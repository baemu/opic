(function () {
  "use strict";

  const data = window.OPIC_STUDY_DATA;
  const storageKey = "opic-quick-review";
  const studyStorageKey = "opic-compact-study-viewer";
  const examPlanStorageKey = "opic-exam-practice-plan";
  const topicLabels = new Map([
    [1, "Family"],
    [2, "Park"],
    [3, "Beach"],
    [4, "Music"],
    [5, "Inst"],
    [6, "Movie"],
    [7, "Gym"],
    [8, "Vacation"],
  ]);
  const examPatterns = [
    { label: "Combo I", range: "Q2–Q4", types: [1, 2, 3], startQuestion: 2 },
    { label: "Combo II", range: "Q5–Q7", types: [1, 3, 4], startQuestion: 5 },
    { label: "Combo III", range: "Q8–Q10", types: [1, 3, 4], startQuestion: 8 },
    { label: "Combo IV", range: "Q11–Q13", types: [6, 7, 8], startQuestion: 11 },
  ];

  const elements = {
    reviewStats: document.getElementById("reviewStats"),
    topicNav: document.getElementById("topicNav"),
    topicTabs: document.getElementById("topicTabs"),
    sourceName: document.getElementById("sourceName"),
    topicTitle: document.getElementById("topicTitle"),
    entryCount: document.getElementById("entryCount"),
    setTabs: document.getElementById("setTabs"),
    reviewList: document.getElementById("reviewList"),
    reviewHint: document.getElementById("reviewHint"),
    examControls: document.getElementById("examControls"),
    randomizeExamBtn: document.getElementById("randomizeExamBtn"),
    startExamPracticeLink: document.getElementById("startExamPracticeLink"),
    toggleViewBtn: document.getElementById("toggleViewBtn"),
    toggleEnglishBtn: document.getElementById("toggleEnglishBtn"),
  };

  const savedState = readJson(storageKey);
  const studyState = readJson(studyStorageKey);
  const latestFiles = getLatestFiles(data?.files || []);
  const state = {
    viewMode: savedState.viewMode === "exam" ? "exam" : "topic",
    topicNumber: Number(savedState.topicNumber) || latestFiles[0]?.number || 1,
    set: String(savedState.set || ""),
    openEntryIds: new Set(Array.isArray(savedState.openEntryIds) ? savedState.openEntryIds : []),
    showAllEnglish: Boolean(savedState.showAllEnglish),
    rate: Number(studyState.rate || 0.9),
    volume: Number(studyState.volume ?? 1),
    voiceURI: studyState.voiceURI || "",
    examCombos: makeExamCombos(savedState.examCombos),
  };

  let voices = [];
  let speechSession = 0;
  let activeSpeechButton = null;

  function init() {
    if (!data || !latestFiles.length) {
      document.body.innerHTML =
        '<main class="load-error"><h1>복습 데이터를 찾을 수 없습니다.</h1><p>OPIc-study.bat을 다시 실행해 주세요.</p></main>';
      return;
    }

    ensureSelection();
    bindEvents();
    loadVoices();
    render();
    registerServiceWorker();
  }

  function bindEvents() {
    elements.topicTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-topic-number]");
      if (!button) {
        return;
      }
      state.topicNumber = Number(button.dataset.topicNumber);
      state.set = "";
      state.openEntryIds.clear();
      state.showAllEnglish = false;
      cancelSpeech();
      ensureSelection();
      saveState();
      render();
    });

    elements.setTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-set]");
      if (!button) {
        return;
      }
      state.set = button.dataset.set;
      state.openEntryIds.clear();
      state.showAllEnglish = false;
      cancelSpeech();
      saveState();
      render();
    });

    elements.reviewList.addEventListener("click", (event) => {
      const listenButton = event.target.closest("[data-speak-text]");
      if (listenButton) {
        event.stopPropagation();
        speak(listenButton.dataset.speakText || "", listenButton);
        return;
      }

      const listenAllButton = event.target.closest("[data-speak-entry]");
      if (listenAllButton) {
        event.stopPropagation();
        const entry = findEntryById(listenAllButton.dataset.speakEntry);
        speak(entry?.review?.englishSkeleton?.join(" ") || "", listenAllButton);
        return;
      }

      const toggle = event.target.closest("[data-entry-toggle]");
      if (!toggle) {
        return;
      }
      toggleEntry(toggle.dataset.entryToggle);
    });

    elements.reviewList.addEventListener("change", (event) => {
      const topicSelect = event.target.closest("[data-exam-topic-index]");
      if (topicSelect) {
        updateExamComboTopic(Number(topicSelect.dataset.examTopicIndex), topicSelect.value);
        return;
      }

      const setSelect = event.target.closest("[data-exam-set-index]");
      if (setSelect) {
        updateExamComboSet(Number(setSelect.dataset.examSetIndex), setSelect.value);
      }
    });

    elements.toggleEnglishBtn.addEventListener("click", () => {
      state.showAllEnglish = !state.showAllEnglish;
      state.openEntryIds.clear();
      cancelSpeech();
      saveState();
      renderToggleLabel();
      renderCurrentCards();
    });

    elements.toggleViewBtn.addEventListener("click", () => {
      state.viewMode = state.viewMode === "topic" ? "exam" : "topic";
      state.openEntryIds.clear();
      state.showAllEnglish = false;
      cancelSpeech();
      saveState();
      render();
    });

    elements.randomizeExamBtn.addEventListener("click", randomizeExamTopics);
    elements.startExamPracticeLink.addEventListener("click", saveExamPracticePlan);

    window.addEventListener("beforeunload", cancelSpeech);
  }

  function render() {
    const totalEntries = latestFiles.reduce((sum, item) => sum + item.entries.length, 0);

    elements.reviewStats.textContent = `${latestFiles.length}개 주제 · ${totalEntries}개 문제`;
    elements.topicNav.hidden = state.viewMode === "exam";
    elements.examControls.hidden = state.viewMode !== "exam";
    elements.reviewList.classList.toggle("is-exam-view", state.viewMode === "exam");
    elements.toggleViewBtn.textContent = state.viewMode === "exam" ? "주제별 보기" : "시험 순서";
    elements.toggleViewBtn.setAttribute("aria-pressed", state.viewMode === "exam" ? "true" : "false");

    if (state.viewMode === "exam") {
      elements.sourceName.textContent = "Q2–Q13 · 유형 9·10 제외";
      elements.topicTitle.textContent = "실제 출제 순서";
      elements.entryCount.textContent = "4 Combos · 12문제";
      elements.reviewHint.textContent = "각 Combo의 주제와 Set을 정한 뒤 실제 순서대로 한국어 흐름과 영어 뼈대를 확인하세요.";
      elements.setTabs.hidden = true;
      saveExamPracticePlan();
    } else {
      const file = getCurrentFile();
      const entries = getCurrentEntries();
      elements.sourceName.textContent = file.sourceFile || `${file.title}.md`;
      elements.topicTitle.textContent = topicLabels.get(file.number) || getTopicSlug(file);
      elements.entryCount.textContent = `Set ${state.set} · ${entries.length}개`;
      elements.reviewHint.textContent = "한국어 흐름으로 내용을 떠올리고, 막히는 문제만 눌러 영어 뼈대를 확인하세요.";
      renderTopics();
      renderSets();
    }

    renderToggleLabel();
    renderCurrentCards();
  }

  function renderTopics() {
    elements.topicTabs.innerHTML = "";
    latestFiles.forEach((file) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "topic-tab";
      button.dataset.topicNumber = String(file.number);
      button.setAttribute("aria-current", file.number === state.topicNumber ? "page" : "false");
      button.textContent = `${file.number}. ${topicLabels.get(file.number) || getTopicSlug(file)}`;
      elements.topicTabs.append(button);
    });
  }

  function renderSets() {
    const file = getCurrentFile();
    const sets = unique(file.entries.map((entry) => String(entry.set)));
    elements.setTabs.innerHTML = "";
    sets.forEach((set) => {
      const button = document.createElement("button");
      const count = file.entries.filter((entry) => String(entry.set) === set).length;
      button.type = "button";
      button.className = "set-tab";
      button.dataset.set = set;
      button.setAttribute("aria-current", set === state.set ? "page" : "false");
      button.textContent = `Set ${set} (${count})`;
      elements.setTabs.append(button);
    });
    elements.setTabs.hidden = sets.length <= 1;
  }

  function renderToggleLabel() {
    elements.toggleEnglishBtn.textContent = state.showAllEnglish ? "영어 모두 숨기기" : "영어 모두 보기";
    elements.toggleEnglishBtn.setAttribute(
      "aria-pressed",
      state.showAllEnglish ? "true" : "false",
    );
  }

  function renderCurrentCards() {
    if (state.viewMode === "exam") {
      renderExamCards();
    } else {
      renderCards();
    }
  }

  function renderCards() {
    const entries = getCurrentEntries();
    elements.reviewList.innerHTML = "";

    if (!entries.length) {
      elements.reviewList.innerHTML = '<p class="empty-message">이 Set에는 문제가 없습니다.</p>';
      return;
    }

    entries.forEach((entry) => {
      const isOpen = state.showAllEnglish || state.openEntryIds.has(entry.id);
      const card = document.createElement("article");
      card.className = `review-card${isOpen ? " is-open" : ""}`;
      card.dataset.entryId = entry.id;
      card.innerHTML = makeCardHtml(entry, isOpen, { cardKey: entry.id });
      elements.reviewList.append(card);
    });
  }

  function renderExamCards() {
    elements.reviewList.innerHTML = "";

    examPatterns.forEach((pattern, comboIndex) => {
      const combo = state.examCombos[comboIndex];
      const file = latestFiles.find((item) => item.number === combo.topicNumber) || latestFiles[0];
      const validSets = getValidSets(file, pattern.types);
      const set = validSets.includes(String(combo.set)) ? String(combo.set) : validSets[0] || "";
      const entries = pattern.types
        .map((type) =>
          file.entries.find(
            (entry) => String(entry.set) === set && Number(entry.type) === Number(type),
          ),
        )
        .filter(Boolean);
      const section = document.createElement("section");
      section.className = "exam-combo";
      section.innerHTML = `
        <header class="exam-combo-header">
          <div>
            <p class="eyebrow">${pattern.label} · ${pattern.range}</p>
            <h3>${pattern.types.map((type) => `T${type}`).join(" → ")}</h3>
          </div>
          <div class="exam-source-selects">
            <label>
              <span>주제</span>
              <select data-exam-topic-index="${comboIndex}">
                ${latestFiles
                  .map(
                    (item) =>
                      `<option value="${item.number}"${item.number === file.number ? " selected" : ""}>${item.number}. ${escapeHtml(topicLabels.get(item.number) || getTopicSlug(item))}</option>`,
                  )
                  .join("")}
              </select>
            </label>
            <label${validSets.length <= 1 ? ' class="is-single-set"' : ""}>
              <span>Set</span>
              <select data-exam-set-index="${comboIndex}"${validSets.length <= 1 ? " disabled" : ""}>
                ${validSets
                  .map(
                    (item) =>
                      `<option value="${escapeHtml(item)}"${item === set ? " selected" : ""}>Set ${escapeHtml(item)}</option>`,
                  )
                  .join("")}
              </select>
            </label>
          </div>
        </header>
        <div class="exam-entry-grid"></div>
      `;

      const grid = section.querySelector(".exam-entry-grid");
      entries.forEach((entry, index) => {
        const questionNumber = pattern.startQuestion + index;
        const cardKey = `exam-${comboIndex}-${entry.id}`;
        const isOpen = state.showAllEnglish || state.openEntryIds.has(cardKey);
        const card = document.createElement("article");
        card.className = `review-card${isOpen ? " is-open" : ""}`;
        card.dataset.entryId = entry.id;
        card.innerHTML = makeCardHtml(entry, isOpen, { cardKey, questionNumber });
        grid.append(card);
      });
      elements.reviewList.append(section);
    });
  }

  function makeCardHtml(entry, isOpen, options = {}) {
    const review = entry.review || {};
    const koreanFlow = Array.isArray(review.koreanFlow) ? review.koreanFlow : [];
    const englishSkeleton = Array.isArray(review.englishSkeleton)
      ? review.englishSkeleton
      : entry.finalSentences || [];
    const rpCode = getRolePlayCode(entry);
    const question = entry.questionTranslation || entry.question || "";
    const englishPreview = entry.mainPoint || englishSkeleton[0] || "";
    const cardKey = options.cardKey || entry.id;
    const questionNumber = Number(options.questionNumber) || 0;
    const mainPoints = new Set(
      Array.isArray(entry.mainPointSentenceIndexes) ? entry.mainPointSentenceIndexes : [],
    );

    return `
      <button
        class="review-card-toggle"
        type="button"
        data-entry-toggle="${escapeHtml(cardKey)}"
        aria-expanded="${isOpen ? "true" : "false"}"
        aria-controls="detail-${escapeHtml(cardKey)}"
      >
        <span class="type-number${questionNumber ? " has-question-number" : ""}">
          ${questionNumber ? `<small>Q${questionNumber}</small>` : ""}
          <strong>T${escapeHtml(entry.type)}</strong>
        </span>
        <span class="review-card-body">
          <span class="review-card-meta">
            <span class="category-label">${escapeHtml(entry.category || "Answer")}</span>
            ${rpCode ? `<span class="rp-label">${rpCode}</span>` : ""}
            <span class="review-question">${escapeHtml(question)}</span>
          </span>
          <span class="korean-flow">${makeFlowHtml(koreanFlow)}</span>
          <span class="english-preview"><small>MP</small>${escapeHtml(englishPreview)}</span>
        </span>
        <span class="expand-mark" aria-hidden="true">⌄</span>
      </button>
      <div id="detail-${escapeHtml(cardKey)}" class="english-detail"${isOpen ? "" : " hidden"}>
        <div class="english-heading">
          <h3>English skeleton</h3>
          <button class="listen-button" type="button" data-speak-entry="${escapeHtml(entry.id)}">▶ 전체 듣기</button>
        </div>
        <ol class="english-skeleton">
          ${englishSkeleton
            .map(
              (sentence, index) => `
                <li class="${mainPoints.has(index) ? "is-main-point" : ""}">
                  <p class="english-sentence">${escapeHtml(sentence)}</p>
                  <button
                    class="sentence-listen"
                    type="button"
                    data-speak-text="${escapeHtml(sentence)}"
                    aria-label="${index + 1}번 문장 듣기"
                    title="문장 듣기"
                  >▶</button>
                </li>
              `,
            )
            .join("")}
        </ol>
      </div>
    `;
  }

  function makeFlowHtml(items) {
    if (!items.length) {
      return '<span class="flow-cue">한국어 흐름 없음</span>';
    }
    return items
      .map(
        (item, index) =>
          `${index ? '<span class="flow-arrow" aria-hidden="true">→</span>' : ""}<span class="flow-cue">${escapeHtml(item)}</span>`,
      )
      .join("");
  }

  function toggleEntry(entryId) {
    if (state.showAllEnglish) {
      state.showAllEnglish = false;
      state.openEntryIds = new Set([entryId]);
    } else if (state.openEntryIds.has(entryId)) {
      state.openEntryIds.delete(entryId);
    } else {
      state.openEntryIds = new Set([entryId]);
    }
    cancelSpeech();
    saveState();
    renderToggleLabel();
    renderCurrentCards();
  }

  function getCurrentFile() {
    return latestFiles.find((file) => file.number === state.topicNumber) || latestFiles[0];
  }

  function getCurrentEntries() {
    return getCurrentFile().entries.filter((entry) => String(entry.set) === state.set);
  }

  function findEntryById(entryId) {
    for (const file of latestFiles) {
      const entry = file.entries.find((item) => item.id === entryId);
      if (entry) {
        return entry;
      }
    }
    return null;
  }

  function makeExamCombos(savedCombos) {
    const saved = Array.isArray(savedCombos) ? savedCombos : [];
    return examPatterns.map((pattern, index) => {
      const requestedTopic = Number(saved[index]?.topicNumber);
      const file =
        latestFiles.find((item) => item.number === requestedTopic) ||
        latestFiles[index % Math.max(1, latestFiles.length)];
      const validSets = getValidSets(file, pattern.types);
      const requestedSet = String(saved[index]?.set || "");
      return {
        topicNumber: file?.number || 1,
        set: validSets.includes(requestedSet) ? requestedSet : validSets[0] || "",
      };
    });
  }

  function getValidSets(file, types) {
    if (!file) {
      return [];
    }
    return unique(file.entries.map((entry) => String(entry.set))).filter((set) =>
      types.every((type) =>
        file.entries.some(
          (entry) => String(entry.set) === set && Number(entry.type) === Number(type),
        ),
      ),
    );
  }

  function updateExamComboTopic(comboIndex, topicNumber) {
    const pattern = examPatterns[comboIndex];
    const file = latestFiles.find((item) => item.number === Number(topicNumber));
    if (!pattern || !file) {
      return;
    }
    const validSets = getValidSets(file, pattern.types);
    state.examCombos[comboIndex] = {
      topicNumber: file.number,
      set: validSets[0] || "",
    };
    state.openEntryIds.clear();
    cancelSpeech();
    saveState();
    renderExamCards();
  }

  function updateExamComboSet(comboIndex, set) {
    const combo = state.examCombos[comboIndex];
    const pattern = examPatterns[comboIndex];
    const file = latestFiles.find((item) => item.number === combo?.topicNumber);
    if (!combo || !pattern || !getValidSets(file, pattern.types).includes(String(set))) {
      return;
    }
    combo.set = String(set);
    state.openEntryIds.clear();
    cancelSpeech();
    saveState();
    renderExamCards();
  }

  function randomizeExamTopics() {
    const shuffled = [...latestFiles].sort(() => Math.random() - 0.5);
    state.examCombos = examPatterns.map((pattern, index) => {
      const file = shuffled[index % shuffled.length];
      return {
        topicNumber: file.number,
        set: getValidSets(file, pattern.types)[0] || "",
      };
    });
    state.openEntryIds.clear();
    state.showAllEnglish = false;
    cancelSpeech();
    saveState();
    renderToggleLabel();
    renderExamCards();
  }

  function saveExamPracticePlan() {
    try {
      localStorage.setItem(
        examPlanStorageKey,
        JSON.stringify({
          version: 1,
          combos: state.examCombos.map((combo, index) => ({
            label: examPatterns[index].label,
            range: examPatterns[index].range,
            types: examPatterns[index].types,
            startQuestion: examPatterns[index].startQuestion,
            topicNumber: combo.topicNumber,
            set: combo.set,
          })),
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // The exam plan falls back to default topics when storage is unavailable.
    }
  }

  function ensureSelection() {
    if (!latestFiles.some((file) => file.number === state.topicNumber)) {
      state.topicNumber = latestFiles[0].number;
    }
    const sets = unique(getCurrentFile().entries.map((entry) => String(entry.set)));
    if (!sets.includes(state.set)) {
      state.set = sets[0] || "";
    }
  }

  function getLatestFiles(files) {
    const latest = new Map();
    files.forEach((file) => {
      const current = latest.get(file.number);
      if (!current || getVersionNumber(file) >= getVersionNumber(current)) {
        latest.set(file.number, file);
      }
    });
    return [...latest.values()].sort((a, b) => a.number - b.number);
  }

  function getVersionNumber(file) {
    const slug = String(file.title || "").replace(/^\d+\.\s*/, "");
    const match = slug.match(/(\d+)$/);
    return match ? Number(match[1]) : 1;
  }

  function getRolePlayCode(entry) {
    const type = Number(entry?.type);
    const category = String(entry?.category || "");
    if (category.includes("Role Play") && (type === 5 || type === 6)) {
      return "RP11";
    }
    if (category.includes("Role Play") && type === 7) {
      return "RP12";
    }
    if (type !== 8) {
      return "";
    }
    const file = latestFiles.find((item) => item.entries.some((candidate) => candidate.id === entry.id));
    const precedingRolePlay = file?.entries.some(
      (item) =>
        String(item.set) === String(entry.set) &&
        Number(item.type) === 7 &&
        String(item.category || "").includes("Role Play"),
    );
    return precedingRolePlay ? "RP13" : "";
  }

  function speak(text, button) {
    const content = String(text || "").trim();
    if (!content || !("speechSynthesis" in window)) {
      return;
    }

    const currentSession = ++speechSession;
    window.speechSynthesis.cancel();
    clearActiveSpeechButton();
    activeSpeechButton = button;
    activeSpeechButton.classList.add("is-playing");

    const utterance = new SpeechSynthesisUtterance(content);
    const selectedVoice = voices.find((voice) => voice.voiceURI === state.voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = selectedVoice?.lang || "en-US";
    utterance.rate = state.rate;
    utterance.volume = state.volume;
    utterance.onend = () => {
      if (currentSession === speechSession) {
        clearActiveSpeechButton();
      }
    };
    utterance.onerror = (event) => {
      if (
        currentSession === speechSession &&
        !["canceled", "interrupted"].includes(String(event.error || "").toLowerCase())
      ) {
        clearActiveSpeechButton();
      }
    };
    window.speechSynthesis.speak(utterance);
  }

  function cancelSpeech() {
    speechSession += 1;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    clearActiveSpeechButton();
  }

  function clearActiveSpeechButton() {
    if (activeSpeechButton) {
      activeSpeechButton.classList.remove("is-playing");
      activeSpeechButton = null;
    }
  }

  function loadVoices() {
    if (!("speechSynthesis" in window)) {
      return;
    }
    const refresh = () => {
      voices = window.speechSynthesis
        .getVoices()
        .filter((voice) => String(voice.lang || "").toLowerCase().startsWith("en"));
    };
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
  }

  function saveState() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          viewMode: state.viewMode,
          topicNumber: state.topicNumber,
          set: state.set,
          openEntryIds: [...state.openEntryIds],
          showAllEnglish: state.showAllEnglish,
          examCombos: state.examCombos,
        }),
      );
      saveExamPracticePlan();
    } catch {
      // The review page still works when storage is unavailable.
    }
  }

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  }

  function getTopicSlug(file) {
    return String(file?.title || "")
      .replace(/^\d+\.\s*/, "")
      .replace(/\d+$/, "")
      .replace(/-$/, "")
      .trim();
  }

  function unique(items) {
    return [...new Set(items.filter(Boolean))];
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return replacements[character];
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(window.location.protocol)) {
      return;
    }
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {});
    });
  }

  init();
})();
