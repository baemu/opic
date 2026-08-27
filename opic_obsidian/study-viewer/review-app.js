(function () {
  "use strict";

  const data = window.OPIC_STUDY_DATA;
  const storageKey = "opic-quick-review";
  const studyStorageKey = "opic-compact-study-viewer";
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

  const elements = {
    reviewStats: document.getElementById("reviewStats"),
    topicTabs: document.getElementById("topicTabs"),
    sourceName: document.getElementById("sourceName"),
    topicTitle: document.getElementById("topicTitle"),
    entryCount: document.getElementById("entryCount"),
    setTabs: document.getElementById("setTabs"),
    reviewList: document.getElementById("reviewList"),
    toggleEnglishBtn: document.getElementById("toggleEnglishBtn"),
  };

  const savedState = readJson(storageKey);
  const studyState = readJson(studyStorageKey);
  const latestFiles = getLatestFiles(data?.files || []);
  const state = {
    topicNumber: Number(savedState.topicNumber) || latestFiles[0]?.number || 1,
    set: String(savedState.set || ""),
    openEntryIds: new Set(Array.isArray(savedState.openEntryIds) ? savedState.openEntryIds : []),
    showAllEnglish: Boolean(savedState.showAllEnglish),
    rate: Number(studyState.rate || 0.9),
    volume: Number(studyState.volume ?? 1),
    voiceURI: studyState.voiceURI || "",
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
        const entry = getCurrentEntries().find(
          (item) => item.id === listenAllButton.dataset.speakEntry,
        );
        speak(entry?.review?.englishSkeleton?.join(" ") || "", listenAllButton);
        return;
      }

      const toggle = event.target.closest("[data-entry-toggle]");
      if (!toggle) {
        return;
      }
      toggleEntry(toggle.dataset.entryToggle);
    });

    elements.toggleEnglishBtn.addEventListener("click", () => {
      state.showAllEnglish = !state.showAllEnglish;
      state.openEntryIds.clear();
      cancelSpeech();
      saveState();
      renderToggleLabel();
      renderCards();
    });

    window.addEventListener("beforeunload", cancelSpeech);
  }

  function render() {
    const file = getCurrentFile();
    const entries = getCurrentEntries();
    const totalEntries = latestFiles.reduce((sum, item) => sum + item.entries.length, 0);

    elements.reviewStats.textContent = `${latestFiles.length}개 주제 · ${totalEntries}개 문제`;
    elements.sourceName.textContent = file.sourceFile || `${file.title}.md`;
    elements.topicTitle.textContent = topicLabels.get(file.number) || getTopicSlug(file);
    elements.entryCount.textContent = `Set ${state.set} · ${entries.length}개`;
    renderTopics();
    renderSets();
    renderToggleLabel();
    renderCards();
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
      card.innerHTML = makeCardHtml(entry, isOpen);
      elements.reviewList.append(card);
    });
  }

  function makeCardHtml(entry, isOpen) {
    const review = entry.review || {};
    const koreanFlow = Array.isArray(review.koreanFlow) ? review.koreanFlow : [];
    const englishSkeleton = Array.isArray(review.englishSkeleton)
      ? review.englishSkeleton
      : entry.finalSentences || [];
    const rpCode = getRolePlayCode(entry);
    const question = entry.questionTranslation || entry.question || "";
    const englishPreview = entry.mainPoint || englishSkeleton[0] || "";
    const mainPoints = new Set(
      Array.isArray(entry.mainPointSentenceIndexes) ? entry.mainPointSentenceIndexes : [],
    );

    return `
      <button
        class="review-card-toggle"
        type="button"
        data-entry-toggle="${escapeHtml(entry.id)}"
        aria-expanded="${isOpen ? "true" : "false"}"
        aria-controls="detail-${escapeHtml(entry.id)}"
      >
        <span class="type-number">T${escapeHtml(entry.type)}</span>
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
      <div id="detail-${escapeHtml(entry.id)}" class="english-detail"${isOpen ? "" : " hidden"}>
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
    renderCards();
  }

  function getCurrentFile() {
    return latestFiles.find((file) => file.number === state.topicNumber) || latestFiles[0];
  }

  function getCurrentEntries() {
    return getCurrentFile().entries.filter((entry) => String(entry.set) === state.set);
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
    const precedingRolePlay = getCurrentFile().entries.some(
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
          topicNumber: state.topicNumber,
          set: state.set,
          openEntryIds: [...state.openEntryIds],
          showAllEnglish: state.showAllEnglish,
        }),
      );
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
