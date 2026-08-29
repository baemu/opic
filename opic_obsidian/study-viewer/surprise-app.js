(function () {
  "use strict";

  const data = window.OPIC_SURPRISE_DATA;
  const storageKey = "opic-surprise-study-viewer";
  const studyStorageKey = "opic-compact-study-viewer";
  const categoryNames = new Map([
    [1, "Description"],
    [2, "Habit"],
    [3, "Past Experience"],
    [4, "Comparison"],
    [5, "Role Play"],
  ]);

  const elements = {
    appStats: document.getElementById("appStats"),
    viewModeButtons: Array.from(document.querySelectorAll("[data-view-mode]")),
    randomPracticeBtn: document.getElementById("randomPracticeBtn"),
    studyView: document.getElementById("studyView"),
    drillView: document.getElementById("drillView"),
    topicSearchInput: document.getElementById("topicSearchInput"),
    topicSearchResults: document.getElementById("topicSearchResults"),
    worldTabs: document.getElementById("worldTabs"),
    worldNumber: document.getElementById("worldNumber"),
    worldTitle: document.getElementById("worldTitle"),
    worldTopics: document.getElementById("worldTopics"),
    categoryTabs: document.getElementById("categoryTabs"),
    worldFlow: document.getElementById("worldFlow"),
    entryCategory: document.getElementById("entryCategory"),
    entryPosition: document.getElementById("entryPosition"),
    questionEnglish: document.getElementById("questionEnglish"),
    questionKorean: document.getElementById("questionKorean"),
    playQuestionBtn: document.getElementById("playQuestionBtn"),
    copyQuestionBtn: document.getElementById("copyQuestionBtn"),
    playMemoryBtn: document.getElementById("playMemoryBtn"),
    memoryPointList: document.getElementById("memoryPointList"),
    worldPracticeBtn: document.getElementById("worldPracticeBtn"),
    toggleReplacementBtn: document.getElementById("toggleReplacementBtn"),
    answerCount: document.getElementById("answerCount"),
    toggleTranslationsBtn: document.getElementById("toggleTranslationsBtn"),
    playAnswerBtn: document.getElementById("playAnswerBtn"),
    answerLines: document.getElementById("answerLines"),
    replacementPanel: document.getElementById("replacementPanel"),
    closeReplacementBtn: document.getElementById("closeReplacementBtn"),
    replacementList: document.getElementById("replacementList"),
    mappedTopicList: document.getElementById("mappedTopicList"),
    nextDrillBtn: document.getElementById("nextDrillBtn"),
    drillSeconds: document.getElementById("drillSeconds"),
    drillIndex: document.getElementById("drillIndex"),
    drillQuestion: document.getElementById("drillQuestion"),
    playDrillQuestionBtn: document.getElementById("playDrillQuestionBtn"),
    revealDrillBtn: document.getElementById("revealDrillBtn"),
    drillAnswer: document.getElementById("drillAnswer"),
    drillWorld: document.getElementById("drillWorld"),
    drillCategory: document.getElementById("drillCategory"),
    drillQuestionKorean: document.getElementById("drillQuestionKorean"),
    drillFlow: document.getElementById("drillFlow"),
    drillFirstSentence: document.getElementById("drillFirstSentence"),
    practiceOverlay: document.getElementById("practiceOverlay"),
    practiceMeta: document.getElementById("practiceMeta"),
    closePracticeBtn: document.getElementById("closePracticeBtn"),
    practiceSetup: document.getElementById("practiceSetup"),
    practiceScopeText: document.getElementById("practiceScopeText"),
    practiceDurationButtons: Array.from(document.querySelectorAll("[data-practice-duration]")),
    startPracticeBtn: document.getElementById("startPracticeBtn"),
    practiceSession: document.getElementById("practiceSession"),
    practicePhase: document.getElementById("practicePhase"),
    listenSteps: Array.from(document.querySelectorAll("[data-listen-step]")),
    practiceMessage: document.getElementById("practiceMessage"),
    practiceTimer: document.getElementById("practiceTimer"),
    practiceListenBtn: document.getElementById("practiceListenBtn"),
    practiceAnswerBtn: document.getElementById("practiceAnswerBtn"),
    practiceFinishBtn: document.getElementById("practiceFinishBtn"),
    practiceReview: document.getElementById("practiceReview"),
    practiceResultWorld: document.getElementById("practiceResultWorld"),
    practiceResultCategory: document.getElementById("practiceResultCategory"),
    practiceResultTime: document.getElementById("practiceResultTime"),
    practiceResultQuestion: document.getElementById("practiceResultQuestion"),
    practiceResultQuestionKo: document.getElementById("practiceResultQuestionKo"),
    practiceResultMemory: document.getElementById("practiceResultMemory"),
    practiceResultAnswer: document.getElementById("practiceResultAnswer"),
    retryPracticeBtn: document.getElementById("retryPracticeBtn"),
    nextPracticeBtn: document.getElementById("nextPracticeBtn"),
    statusToast: document.getElementById("statusToast"),
  };

  const savedState = readJson(storageKey);
  const studySettings = readJson(studyStorageKey);
  const state = {
    worldNumber: Number(savedState.worldNumber) || 1,
    type: Number(savedState.type) || 1,
    showTranslations: savedState.showTranslations !== false,
    viewMode: savedState.viewMode === "drill" ? "drill" : "study",
    replacementOpen: false,
    rate: Number(studySettings.rate || 0.9),
    volume: Number(studySettings.volume ?? 1),
    voiceURI: studySettings.voiceURI || "",
  };

  const drill = {
    entry: null,
    file: null,
    remaining: 5,
    endAt: 0,
    timerId: null,
    revealed: false,
    round: 0,
  };

  const practice = {
    open: false,
    scope: "all",
    pool: [],
    file: null,
    entry: null,
    phase: "setup",
    durationSec: 60,
    listenCount: 0,
    listeningNumber: 0,
    answerStartedAt: 0,
    elapsedMs: 0,
    timerId: null,
  };

  let voices = [];
  let speechSession = 0;
  let toastTimer = null;

  function init() {
    if (!data?.files?.length || data.stats?.entries !== 45) {
      document.body.innerHTML =
        '<main class="load-error"><h1>돌발 대비 데이터를 찾을 수 없습니다.</h1><p>OPIc-study.bat을 다시 실행해 주세요.</p></main>';
      return;
    }

    ensureSelection();
    bindEvents();
    refreshVoices();
    renderAll();
    if (state.viewMode === "drill") {
      startNewDrill();
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    }
  }

  function bindEvents() {
    elements.viewModeButtons.forEach((button) => {
      button.addEventListener("click", () => setViewMode(button.dataset.viewMode));
    });
    elements.randomPracticeBtn.addEventListener("click", () => openPractice("all"));
    elements.worldTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-world-number]");
      if (button) {
        elements.topicSearchInput.value = "";
        hideSearchResults();
        selectWorld(button.dataset.worldNumber);
      }
    });
    elements.categoryTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-entry-type]");
      if (button) {
        selectType(button.dataset.entryType);
      }
    });
    elements.topicSearchInput.addEventListener("input", renderSearchResults);
    elements.topicSearchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideSearchResults();
        elements.topicSearchInput.blur();
      }
    });
    elements.topicSearchResults.addEventListener("click", (event) => {
      const button = event.target.closest("[data-topic-index]");
      if (button) {
        chooseTopicResult(Number(button.dataset.topicIndex));
      }
    });
    elements.playQuestionBtn.addEventListener("click", () =>
      speakText(getCurrentEntry().question, elements.playQuestionBtn),
    );
    elements.copyQuestionBtn.addEventListener("click", copyQuestionInfo);
    elements.playMemoryBtn.addEventListener("click", () =>
      speakSequence(getCurrentEntry().memoryPoints, elements.playMemoryBtn),
    );
    elements.memoryPointList.addEventListener("click", handleSpeakClick);
    elements.answerLines.addEventListener("click", handleAnswerClick);
    elements.answerLines.addEventListener("keydown", handleSpeakKeydown);
    elements.toggleTranslationsBtn.addEventListener("click", toggleTranslations);
    elements.playAnswerBtn.addEventListener("click", () =>
      speakSequence(getCurrentEntry().finalSentences, elements.playAnswerBtn),
    );
    elements.worldPracticeBtn.addEventListener("click", () => openPractice("world"));
    elements.toggleReplacementBtn.addEventListener("click", toggleReplacement);
    elements.closeReplacementBtn.addEventListener("click", () => setReplacementOpen(false));
    elements.nextDrillBtn.addEventListener("click", startNewDrill);
    elements.playDrillQuestionBtn.addEventListener("click", () =>
      speakText(drill.entry?.question || "", elements.playDrillQuestionBtn),
    );
    elements.revealDrillBtn.addEventListener("click", revealDrill);
    elements.closePracticeBtn.addEventListener("click", closePractice);
    elements.practiceDurationButtons.forEach((button) => {
      button.addEventListener("click", () => setPracticeDuration(button.dataset.practiceDuration));
    });
    elements.startPracticeBtn.addEventListener("click", startPractice);
    elements.practiceListenBtn.addEventListener("click", playPracticeQuestion);
    elements.practiceAnswerBtn.addEventListener("click", startPracticeAnswer);
    elements.practiceFinishBtn.addEventListener("click", finishPracticeAnswer);
    elements.retryPracticeBtn.addEventListener("click", retryPractice);
    elements.nextPracticeBtn.addEventListener("click", nextPracticeEntry);

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".search-area")) {
        hideSearchResults();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && practice.open) {
        closePractice();
      } else if (event.key === "Escape" && state.replacementOpen) {
        setReplacementOpen(false);
      }
    });
  }

  function renderAll() {
    elements.appStats.textContent = `${data.stats.files}개 세계관 · ${data.stats.entries}개 답변`;
    renderViewMode();
    renderWorldTabs();
    renderStudyEntry();
  }

  function renderViewMode() {
    elements.viewModeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.viewMode === state.viewMode ? "true" : "false");
    });
    elements.studyView.hidden = state.viewMode !== "study";
    elements.drillView.hidden = state.viewMode !== "drill";
  }

  function setViewMode(mode) {
    if (!["study", "drill"].includes(mode) || state.viewMode === mode) {
      return;
    }
    cancelSpeech();
    stopDrillTimer();
    state.viewMode = mode;
    state.replacementOpen = false;
    saveState();
    renderViewMode();
    if (mode === "drill") {
      startNewDrill();
    }
  }

  function renderWorldTabs() {
    elements.worldTabs.innerHTML = data.files
      .map(
        (file) => `
          <button
            class="world-tab"
            type="button"
            role="tab"
            data-world-number="${file.number}"
            aria-selected="${file.number === state.worldNumber ? "true" : "false"}"
            title="${escapeHtml(file.worldviewName)}"
          >
            <small>WORLD ${file.number}</small>
            <strong>${escapeHtml(makeShortWorldName(file.worldviewName))}</strong>
          </button>`,
      )
      .join("");
  }

  function renderStudyEntry() {
    const file = getCurrentFile();
    const entry = getCurrentEntry();
    if (!file || !entry) {
      return;
    }

    elements.worldNumber.textContent = `WORLD ${file.number}`;
    elements.worldTitle.textContent = file.worldviewName;
    elements.worldTopics.textContent = file.primaryTopics.join(" · ");
    elements.worldFlow.textContent = formatFlow(file.flow);
    renderCategoryTabs(file);

    elements.entryCategory.textContent = entry.category || categoryNames.get(Number(entry.type));
    elements.entryPosition.textContent = `${entry.type} / ${file.entries.length}`;
    elements.questionEnglish.textContent = entry.question;
    elements.questionKorean.textContent = entry.questionTranslation;
    renderMemoryPoints(entry);
    renderAnswer(entry);
    renderReplacement(file, entry);
    setReplacementOpen(state.replacementOpen, false);
  }

  function renderCategoryTabs(file) {
    elements.categoryTabs.innerHTML = file.entries
      .slice()
      .sort((a, b) => Number(a.type) - Number(b.type))
      .map(
        (entry) => `
          <button
            class="category-tab"
            type="button"
            role="tab"
            data-entry-type="${escapeHtml(entry.type)}"
            aria-selected="${Number(entry.type) === state.type ? "true" : "false"}"
          >
            <small>CATEGORY</small>
            <strong>${escapeHtml(entry.category || categoryNames.get(Number(entry.type)) || "Answer")}</strong>
          </button>`,
      )
      .join("");
  }

  function renderMemoryPoints(entry) {
    elements.memoryPointList.innerHTML = entry.memoryPoints
      .map(
        (sentence, index) => `
          <li class="memory-point">
            <span>${index + 1}</span>
            <p>${escapeHtml(sentence)}</p>
            <button class="sentence-action" type="button" data-speak-text="${escapeHtml(sentence)}" aria-label="${index + 1}번 암기 문장 듣기">▶</button>
          </li>`,
      )
      .join("");
  }

  function renderAnswer(entry) {
    const translationByEnglish = new Map(
      entry.translations.map((pair) => [normalizeText(pair.english), pair.korean]),
    );
    const mainPoints = new Set(entry.mainPointSentenceIndexes || []);
    elements.answerCount.textContent = `${entry.finalSentences.length} SENTENCES`;
    elements.toggleTranslationsBtn.textContent = state.showTranslations ? "번역 숨기기" : "번역 보기";
    elements.toggleTranslationsBtn.setAttribute("aria-pressed", state.showTranslations ? "true" : "false");
    elements.answerLines.innerHTML = entry.finalSentences
      .map((sentence, index) => {
        const korean = translationByEnglish.get(normalizeText(sentence)) || entry.translations[index]?.korean || "";
        return `
          <article class="answer-line${mainPoints.has(index) ? " is-main-point" : ""}">
            <div class="answer-line-top">
              <span class="answer-number">${index + 1}</span>
              <p
                class="answer-english"
                data-speak-text="${escapeHtml(sentence)}"
                tabindex="0"
                role="button"
                aria-label="${index + 1}번 문장 듣기"
              >${escapeHtml(sentence)}</p>
              <button class="answer-copy" type="button" data-copy-sentence="${index}" aria-label="${index + 1}번 문장 정보 복사" title="문장 정보 복사">⧉</button>
            </div>
            <p class="answer-korean"${state.showTranslations ? "" : " hidden"}>${escapeHtml(korean)}</p>
          </article>`;
      })
      .join("");
  }

  function renderReplacement(file, entry) {
    const replacements = entry.replacementLines.map(parseReplacementLine);
    elements.replacementList.innerHTML = replacements.length
      ? replacements
          .map(
            (item) => `
              <div class="replacement-item">
                <strong>${escapeHtml(item.from)}</strong>
                <span>${escapeHtml(item.to)}</span>
              </div>`,
          )
          .join("")
      : '<p class="empty-message">정리된 바꿔쓰기 표현이 없습니다.</p>';

    const mappedTopics = data.master.topicMap.filter(
      (item) =>
        item.primaryWorldview === file.number || item.secondaryWorldview === file.number,
    );
    elements.mappedTopicList.innerHTML = mappedTopics
      .map(
        (item) => `
          <div class="mapped-topic-item">
            <strong>${escapeHtml(item.topic)} · ${item.primaryWorldview === file.number ? "주력" : "보조"}</strong>
            <span>${escapeHtml(item.keywords.join(" · "))}</span>
          </div>`,
      )
      .join("");
  }

  function renderSearchResults() {
    const rawQuery = elements.topicSearchInput.value.trim();
    if (!rawQuery) {
      hideSearchResults();
      return;
    }
    const matches = data.master.topicMap
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => matchesTopicSearch(item, rawQuery))
      .slice(0, 6);
    if (!matches.length) {
      elements.topicSearchResults.innerHTML =
        '<div class="topic-result"><strong>검색 결과 없음</strong><span>다른 주제어를 입력하세요.</span></div>';
    } else {
      elements.topicSearchResults.innerHTML = matches
        .map(({ item, index }) => {
          const world = getFileByNumber(item.primaryWorldview);
          return `
            <button class="topic-result" type="button" data-topic-index="${index}">
              <strong>${escapeHtml(item.topic)}</strong>
              <span>WORLD ${item.primaryWorldview} · ${escapeHtml(makeShortWorldName(world?.worldviewName || ""))} · ${escapeHtml(item.keywords.join(", "))}</span>
            </button>`;
        })
        .join("");
    }
    elements.topicSearchResults.hidden = false;
  }

  function chooseTopicResult(index) {
    const item = data.master.topicMap[index];
    if (!item) {
      return;
    }
    elements.topicSearchInput.value = item.topic;
    hideSearchResults();
    selectWorld(item.primaryWorldview);
    const secondary = getFileByNumber(item.secondaryWorldview);
    setStatus(
      secondary
        ? `주력 WORLD ${item.primaryWorldview} · 보조 WORLD ${item.secondaryWorldview}`
        : `WORLD ${item.primaryWorldview} 선택`,
    );
  }

  function hideSearchResults() {
    elements.topicSearchResults.hidden = true;
  }

  function selectWorld(value) {
    const number = Number(value);
    const file = getFileByNumber(number);
    if (!file) {
      return;
    }
    cancelSpeech();
    state.worldNumber = number;
    if (!file.entries.some((entry) => Number(entry.type) === state.type)) {
      state.type = Number(file.entries[0]?.type) || 1;
    }
    state.replacementOpen = false;
    saveState();
    renderWorldTabs();
    renderStudyEntry();
  }

  function selectType(value) {
    const type = Number(value);
    if (!getCurrentFile()?.entries.some((entry) => Number(entry.type) === type)) {
      return;
    }
    cancelSpeech();
    state.type = type;
    state.replacementOpen = false;
    saveState();
    renderStudyEntry();
  }

  function toggleTranslations() {
    state.showTranslations = !state.showTranslations;
    saveState();
    renderAnswer(getCurrentEntry());
  }

  function toggleReplacement() {
    setReplacementOpen(!state.replacementOpen);
  }

  function setReplacementOpen(isOpen, scroll = true) {
    state.replacementOpen = Boolean(isOpen);
    elements.replacementPanel.hidden = !state.replacementOpen;
    elements.toggleReplacementBtn.setAttribute("aria-expanded", state.replacementOpen ? "true" : "false");
    elements.toggleReplacementBtn.textContent = state.replacementOpen ? "바꿔쓰기 닫기" : "바꿔쓰기";
    if (state.replacementOpen && scroll) {
      elements.replacementPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function handleAnswerClick(event) {
    const copyButton = event.target.closest("[data-copy-sentence]");
    if (copyButton) {
      copySentenceInfo(Number(copyButton.dataset.copySentence));
      return;
    }
    handleSpeakClick(event);
  }

  function handleSpeakClick(event) {
    const target = event.target.closest("[data-speak-text]");
    if (!target || window.getSelection()?.toString()) {
      return;
    }
    speakText(target.dataset.speakText, target);
  }

  function handleSpeakKeydown(event) {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-speak-text]")) {
      event.preventDefault();
      speakText(event.target.dataset.speakText, event.target);
    }
  }

  async function copyQuestionInfo() {
    const entry = getCurrentEntry();
    await copyText(
      `[${entry.sourceFile} | Type ${entry.type} | Question]\n${entry.question}`,
      "문제 정보를 복사했습니다.",
    );
  }

  async function copySentenceInfo(index) {
    const entry = getCurrentEntry();
    const sentence = entry.finalSentences[index];
    if (!sentence) {
      return;
    }
    await copyText(
      `[${entry.sourceFile} | Type ${entry.type} | ${index + 1}번째 문장]\n${sentence}`,
      `${index + 1}번 문장 정보를 복사했습니다.`,
    );
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(successMessage);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      setStatus(successMessage);
    }
  }

  function startNewDrill() {
    stopDrillTimer();
    cancelSpeech();
    const all = getAllSelections();
    const previousId = drill.entry?.id;
    const candidates = all.length > 1 ? all.filter(({ entry }) => entry.id !== previousId) : all;
    const selection = candidates[Math.floor(Math.random() * candidates.length)];
    if (!selection) {
      return;
    }
    drill.entry = selection.entry;
    drill.file = selection.file;
    drill.remaining = 5;
    drill.revealed = false;
    drill.round += 1;
    drill.endAt = Date.now() + 5000;
    renderDrill();
    drill.timerId = window.setInterval(updateDrillTimer, 100);
  }

  function updateDrillTimer() {
    drill.remaining = Math.max(0, Math.ceil((drill.endAt - Date.now()) / 1000));
    elements.drillSeconds.textContent = String(drill.remaining);
    if (drill.remaining <= 0) {
      revealDrill();
    }
  }

  function revealDrill() {
    if (!drill.entry) {
      return;
    }
    stopDrillTimer();
    drill.remaining = 0;
    drill.revealed = true;
    renderDrill();
  }

  function renderDrill() {
    if (!drill.entry || !drill.file) {
      return;
    }
    elements.drillSeconds.textContent = String(drill.remaining);
    elements.drillSeconds.parentElement.classList.toggle("is-done", drill.revealed);
    elements.drillIndex.textContent = `RANDOM ${drill.round} / ${data.stats.entries}`;
    elements.drillQuestion.textContent = drill.entry.question;
    elements.revealDrillBtn.hidden = drill.revealed;
    elements.drillAnswer.hidden = !drill.revealed;
    if (drill.revealed) {
      elements.drillWorld.textContent = `WORLD ${drill.file.number} · ${makeShortWorldName(drill.file.worldviewName)}`;
      elements.drillCategory.textContent = drill.entry.category;
      elements.drillQuestionKorean.textContent = drill.entry.questionTranslation;
      elements.drillFlow.textContent = formatFlow(drill.file.flow);
      elements.drillFirstSentence.textContent =
        drill.entry.memoryPoints[0] || drill.entry.mainPoint || drill.entry.finalSentences[0] || "";
    }
  }

  function stopDrillTimer() {
    if (drill.timerId) {
      window.clearInterval(drill.timerId);
      drill.timerId = null;
    }
  }

  function openPractice(scope) {
    cancelSpeech();
    stopDrillTimer();
    stopPracticeTimer();
    practice.open = true;
    practice.scope = scope === "world" ? "world" : "all";
    practice.pool =
      practice.scope === "world"
        ? getCurrentFile().entries.map((entry) => ({ file: getCurrentFile(), entry }))
        : getAllSelections();
    practice.file = null;
    practice.entry = null;
    practice.phase = "setup";
    practice.listenCount = 0;
    practice.listeningNumber = 0;
    practice.elapsedMs = 0;
    document.body.classList.add("practice-open");
    renderPractice();
    window.requestAnimationFrame(() => elements.startPracticeBtn.focus());
  }

  function closePractice() {
    if (!practice.open) {
      return;
    }
    cancelSpeech();
    stopPracticeTimer();
    practice.open = false;
    practice.phase = "setup";
    document.body.classList.remove("practice-open");
    renderPractice();
    if (state.viewMode === "drill") {
      startNewDrill();
    }
  }

  function setPracticeDuration(value) {
    const duration = Number(value);
    if (![45, 60, 90].includes(duration)) {
      return;
    }
    practice.durationSec = duration;
    renderPracticeDuration();
  }

  function startPractice() {
    const selection = choosePracticeSelection();
    if (!selection) {
      return;
    }
    practice.file = selection.file;
    practice.entry = selection.entry;
    resetPracticeEntry();
    renderPractice();
    window.requestAnimationFrame(() => elements.practiceListenBtn.focus());
  }

  function choosePracticeSelection(excludedId = "") {
    const candidates =
      practice.pool.length > 1
        ? practice.pool.filter(({ entry }) => entry.id !== excludedId)
        : practice.pool;
    return candidates[Math.floor(Math.random() * candidates.length)] || null;
  }

  function resetPracticeEntry() {
    stopPracticeTimer();
    practice.phase = "ready";
    practice.listenCount = 0;
    practice.listeningNumber = 0;
    practice.answerStartedAt = 0;
    practice.elapsedMs = 0;
  }

  function playPracticeQuestion() {
    if (
      !practice.open ||
      !practice.entry ||
      !["ready", "between"].includes(practice.phase) ||
      practice.listenCount >= 2 ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    const session = beginSpeechSession();
    const listenNumber = practice.listenCount + 1;
    const entryId = practice.entry.id;
    practice.phase = "listening";
    practice.listeningNumber = listenNumber;
    renderPractice();

    const utterance = makeUtterance(practice.entry.question);
    utterance.onend = () => {
      if (session !== speechSession || !practice.open || practice.entry?.id !== entryId) {
        return;
      }
      practice.listenCount = listenNumber;
      practice.listeningNumber = 0;
      if (listenNumber >= 2) {
        startPracticeAnswer();
        return;
      }
      practice.phase = "between";
      renderPractice();
      elements.practiceAnswerBtn.focus();
    };
    utterance.onerror = (event) => {
      if (session !== speechSession || ["canceled", "interrupted"].includes(event.error)) {
        return;
      }
      practice.listeningNumber = 0;
      practice.phase = practice.listenCount ? "between" : "ready";
      renderPractice();
      setStatus("문제 음성을 재생하지 못했습니다.");
    };
    window.speechSynthesis.speak(utterance);
  }

  function startPracticeAnswer() {
    if (!practice.open || !practice.entry || practice.listenCount < 1 || practice.phase === "answering") {
      return;
    }
    cancelSpeech();
    stopPracticeTimer();
    practice.phase = "answering";
    practice.answerStartedAt = Date.now();
    practice.elapsedMs = 0;
    practice.timerId = window.setInterval(updatePracticeTimer, 200);
    renderPractice();
    elements.practiceFinishBtn.focus();
  }

  function updatePracticeTimer() {
    if (practice.phase !== "answering") {
      return;
    }
    practice.elapsedMs = Math.max(0, Date.now() - practice.answerStartedAt);
    if (practice.elapsedMs >= practice.durationSec * 1000) {
      finishPracticeAnswer();
      return;
    }
    renderPracticeTimer();
  }

  function finishPracticeAnswer() {
    if (!practice.open || practice.phase !== "answering") {
      return;
    }
    practice.elapsedMs = Math.min(
      Math.max(0, Date.now() - practice.answerStartedAt),
      practice.durationSec * 1000,
    );
    stopPracticeTimer();
    practice.phase = "review";
    renderPractice();
  }

  function retryPractice() {
    if (!practice.entry) {
      return;
    }
    cancelSpeech();
    resetPracticeEntry();
    renderPractice();
  }

  function nextPracticeEntry() {
    const selection = choosePracticeSelection(practice.entry?.id || "");
    if (!selection) {
      return;
    }
    cancelSpeech();
    practice.file = selection.file;
    practice.entry = selection.entry;
    resetPracticeEntry();
    renderPractice();
  }

  function renderPractice() {
    elements.practiceOverlay.hidden = !practice.open;
    if (!practice.open) {
      return;
    }
    elements.practiceSetup.hidden = practice.phase !== "setup";
    elements.practiceSession.hidden = practice.phase === "setup" || practice.phase === "review";
    elements.practiceReview.hidden = practice.phase !== "review";

    if (practice.phase === "setup") {
      const current = getCurrentFile();
      elements.practiceMeta.textContent =
        practice.scope === "world" ? `WORLD ${current.number} · 5개 답변` : "9개 세계관 · 45개 답변";
      elements.practiceScopeText.textContent =
        practice.scope === "world"
          ? `${current.worldviewName}의 5개 카테고리를 연습합니다.`
          : "전체 45개 답변 중 하나를 무작위로 연습합니다.";
      renderPracticeDuration();
      return;
    }

    elements.practiceMeta.textContent = `${practice.file.worldviewName} · ${practice.entry.category}`;
    if (practice.phase === "review") {
      renderPracticeReview();
    } else {
      renderPracticeSession();
    }
  }

  function renderPracticeDuration() {
    elements.practiceDurationButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        Number(button.dataset.practiceDuration) === practice.durationSec ? "true" : "false",
      );
    });
  }

  function renderPracticeSession() {
    const phaseContent = {
      ready: ["준비", "문제를 들어보세요."],
      listening: [`${practice.listeningNumber}회차`, "문제를 듣고 있습니다."],
      between: ["1회 청취 완료", "한 번 더 듣거나 답변을 시작하세요."],
      answering: ["답변 중", "답변하세요."],
    }[practice.phase] || ["준비", "문제를 들어보세요."];
    elements.practicePhase.textContent = phaseContent[0];
    elements.practiceMessage.textContent = phaseContent[1];
    elements.practiceTimer.hidden = practice.phase !== "answering";
    elements.practiceListenBtn.hidden = practice.phase === "answering";
    elements.practiceListenBtn.disabled = practice.phase === "listening";
    elements.practiceAnswerBtn.hidden = practice.phase !== "between";
    elements.practiceFinishBtn.hidden = practice.phase !== "answering";
    elements.practiceListenBtn.textContent =
      practice.phase === "listening"
        ? `재생 중 ${practice.listeningNumber}/2`
        : practice.listenCount === 0
          ? "▶ 문제 듣기 1/2"
          : "▶ 한 번 더 듣기 2/2";
    elements.listenSteps.forEach((step) => {
      const number = Number(step.dataset.listenStep);
      step.classList.toggle("is-complete", number <= practice.listenCount);
      step.classList.toggle(
        "is-current",
        practice.phase === "listening" && number === practice.listeningNumber,
      );
    });
    renderPracticeTimer();
  }

  function renderPracticeTimer() {
    const remaining = Math.max(0, practice.durationSec * 1000 - practice.elapsedMs);
    const text = formatDuration(remaining, true);
    elements.practiceTimer.textContent = text;
    elements.practiceTimer.setAttribute("datetime", `PT${Math.ceil(remaining / 1000)}S`);
  }

  function renderPracticeReview() {
    const entry = practice.entry;
    elements.practiceResultWorld.textContent = `WORLD ${practice.file.number}`;
    elements.practiceResultCategory.textContent = entry.category;
    elements.practiceResultTime.textContent = formatDuration(practice.elapsedMs);
    elements.practiceResultQuestion.textContent = entry.question;
    elements.practiceResultQuestionKo.textContent = entry.questionTranslation;
    elements.practiceResultMemory.innerHTML = entry.memoryPoints
      .map((point) => `<li>${escapeHtml(point)}</li>`)
      .join("");
    elements.practiceResultAnswer.innerHTML = entry.finalSentences
      .map((sentence, index) => {
        const korean = entry.translations[index]?.korean || "";
        return `
          <div class="practice-result-line">
            <strong>${index + 1}. ${escapeHtml(sentence)}</strong>
            <span>${escapeHtml(korean)}</span>
          </div>`;
      })
      .join("");
  }

  function stopPracticeTimer() {
    if (practice.timerId) {
      window.clearInterval(practice.timerId);
      practice.timerId = null;
    }
  }

  function getCurrentFile() {
    return getFileByNumber(state.worldNumber) || data.files[0];
  }

  function getFileByNumber(number) {
    return data.files.find((file) => Number(file.number) === Number(number));
  }

  function getCurrentEntry() {
    const file = getCurrentFile();
    return file.entries.find((entry) => Number(entry.type) === state.type) || file.entries[0];
  }

  function getAllSelections() {
    return data.files.flatMap((file) => file.entries.map((entry) => ({ file, entry })));
  }

  function ensureSelection() {
    const file = getFileByNumber(state.worldNumber) || data.files[0];
    state.worldNumber = file.number;
    if (!file.entries.some((entry) => Number(entry.type) === state.type)) {
      state.type = Number(file.entries[0]?.type) || 1;
    }
  }

  function makeShortWorldName(value) {
    return String(value)
      .replace(/와\s+/g, "·")
      .replace(/으로\s+생긴\s+/g, "·")
      .replace(/와\s+직원\s+도움/g, "·직원 도움")
      .trim();
  }

  function formatFlow(value) {
    return String(value || "").replace(/\s*->\s*/g, " → ");
  }

  function parseReplacementLine(value) {
    const parts = String(value).split(/\s*->\s*/);
    return { from: parts[0] || value, to: parts.slice(1).join(" → ") || "" };
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function normalizeSearch(value) {
    return String(value || "").replace(/\s+/g, "").trim().toLowerCase();
  }

  function matchesTopicSearch(item, query) {
    const fields = [item.topic, ...item.keywords].map((value) => String(value || ""));
    if (/^[a-z0-9]+$/i.test(query)) {
      const normalized = query.toLowerCase();
      return fields.some((field) =>
        field
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(Boolean)
          .some((token) => token === normalized || token.startsWith(normalized)),
      );
    }
    const normalized = normalizeSearch(query);
    return fields.some((field) => normalizeSearch(field).includes(normalized));
  }

  function refreshVoices() {
    if (!("speechSynthesis" in window)) {
      voices = [];
      return;
    }
    voices = window.speechSynthesis
      .getVoices()
      .filter((voice) => /^en([-_]|$)/i.test(voice.lang))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function speakText(text, button) {
    if (!text || !("speechSynthesis" in window)) {
      setStatus("이 브라우저는 영어 음성을 지원하지 않습니다.");
      return;
    }
    const session = beginSpeechSession();
    const utterance = makeUtterance(text);
    setSpeakingButton(button, true);
    utterance.onend = () => {
      if (session === speechSession) {
        setSpeakingButton(button, false);
      }
    };
    utterance.onerror = (event) => {
      if (session !== speechSession || ["canceled", "interrupted"].includes(event.error)) {
        return;
      }
      setSpeakingButton(button, false);
      setStatus("영어 음성을 재생하지 못했습니다.");
    };
    window.speechSynthesis.speak(utterance);
  }

  function speakSequence(items, button) {
    const queue = items.filter(Boolean);
    if (!queue.length || !("speechSynthesis" in window)) {
      return;
    }
    const session = beginSpeechSession();
    let index = 0;
    setSpeakingButton(button, true);
    const run = () => {
      if (session !== speechSession || index >= queue.length) {
        setSpeakingButton(button, false);
        return;
      }
      const utterance = makeUtterance(queue[index]);
      utterance.onend = () => {
        if (session !== speechSession) {
          return;
        }
        index += 1;
        run();
      };
      utterance.onerror = (event) => {
        if (session !== speechSession || ["canceled", "interrupted"].includes(event.error)) {
          return;
        }
        setSpeakingButton(button, false);
        setStatus("영어 음성을 재생하지 못했습니다.");
      };
      window.speechSynthesis.speak(utterance);
    };
    run();
  }

  function makeUtterance(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    const selected = voices.find((voice) => voice.voiceURI === state.voiceURI);
    const fallback =
      voices.find((voice) => /google.*us english/i.test(voice.name)) ||
      voices.find((voice) => /^en-US$/i.test(voice.lang)) ||
      voices[0];
    utterance.voice = selected || fallback || null;
    utterance.lang = utterance.voice?.lang || "en-US";
    utterance.rate = Math.min(2, Math.max(0.5, state.rate));
    utterance.volume = Math.min(1, Math.max(0, state.volume));
    utterance.pitch = 1;
    return utterance;
  }

  function beginSpeechSession() {
    speechSession += 1;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    document.querySelectorAll(".is-speaking").forEach((item) => item.classList.remove("is-speaking"));
    return speechSession;
  }

  function cancelSpeech() {
    beginSpeechSession();
  }

  function setSpeakingButton(button, isSpeaking) {
    if (button) {
      button.classList.toggle("is-speaking", isSpeaking);
    }
  }

  function setStatus(message) {
    window.clearTimeout(toastTimer);
    elements.statusToast.textContent = message;
    elements.statusToast.hidden = false;
    toastTimer = window.setTimeout(() => {
      elements.statusToast.hidden = true;
    }, 1900);
  }

  function formatDuration(milliseconds, roundUp = false) {
    const secondsValue = Number(milliseconds || 0) / 1000;
    const total = Math.max(0, roundUp ? Math.ceil(secondsValue) : Math.floor(secondsValue));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function saveState() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          worldNumber: state.worldNumber,
          type: state.type,
          showTranslations: state.showTranslations,
          viewMode: state.viewMode,
        }),
      );
    } catch {
      // The page still works when storage is unavailable.
    }
  }

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  init();
})();
