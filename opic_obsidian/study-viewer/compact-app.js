(function () {
  "use strict";

  const data = window.OPIC_STUDY_DATA;
  const storageKey = "opic-compact-study-viewer";
  const practiceStorageKey = "opic-practice-progress";

  const elements = {
    statsText: document.getElementById("statsText"),
    fileTabs: document.getElementById("fileTabs"),
    versionTabs: document.getElementById("versionTabs"),
    setTabs: document.getElementById("setTabs"),
    typeGrid: document.getElementById("typeGrid"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    stopBtn: document.getElementById("stopBtn"),
    rateInput: document.getElementById("rateInput"),
    rateValue: document.getElementById("rateValue"),
    volumeInput: document.getElementById("volumeInput"),
    volumeValue: document.getElementById("volumeValue"),
    repeatSelect: document.getElementById("repeatSelect"),
    voiceSelect: document.getElementById("voiceSelect"),
    modeButtons: Array.from(document.querySelectorAll(".mode-button")),
    updateDataBtn: document.getElementById("updateDataBtn"),
    practiceLaunchBtn: document.getElementById("practiceLaunchBtn"),
    settingsToggleBtn: document.getElementById("settingsToggleBtn"),
    settingsPanel: document.getElementById("settingsPanel"),
    entryMeta: document.getElementById("entryMeta"),
    questionCategory: document.getElementById("questionCategory"),
    categoryTooltipTitle: document.getElementById("categoryTooltipTitle"),
    categoryTooltipFlow: document.getElementById("categoryTooltipFlow"),
    answerMeta: document.getElementById("answerMeta"),
    answerTitle: document.getElementById("answerTitle"),
    questionFullButton: document.getElementById("questionFullButton"),
    questionTranslationText: document.getElementById("questionTranslationText"),
    answerLines: document.getElementById("answerLines"),
    toggleQuestionTranslationBtn: document.getElementById("toggleQuestionTranslationBtn"),
    toggleTranslationsBtn: document.getElementById("toggleTranslationsBtn"),
    copyQuestionBtn: document.getElementById("copyQuestionBtn"),
    playQuestionBtn: document.getElementById("playQuestionBtn"),
    playAnswerBtn: document.getElementById("playAnswerBtn"),
    statusBar: document.querySelector(".status-bar"),
    statusText: document.getElementById("statusText"),
    practiceOverlay: document.getElementById("practiceOverlay"),
    practiceMeta: document.getElementById("practiceMeta"),
    practiceExitBtn: document.getElementById("practiceExitBtn"),
    practiceRunView: document.getElementById("practiceRunView"),
    practiceReviewView: document.getElementById("practiceReviewView"),
    practicePhaseLabel: document.getElementById("practicePhaseLabel"),
    practiceListenSteps: Array.from(document.querySelectorAll("[data-practice-listen]")),
    practiceMessage: document.getElementById("practiceMessage"),
    practiceTimer: document.getElementById("practiceTimer"),
    practiceTimerValue: document.getElementById("practiceTimerValue"),
    practiceListenBtn: document.getElementById("practiceListenBtn"),
    practiceAnswerStartBtn: document.getElementById("practiceAnswerStartBtn"),
    practiceFinishBtn: document.getElementById("practiceFinishBtn"),
    practiceResultTime: document.getElementById("practiceResultTime"),
    practiceAttemptText: document.getElementById("practiceAttemptText"),
    practiceRetryBtn: document.getElementById("practiceRetryBtn"),
    practiceReturnBtn: document.getElementById("practiceReturnBtn"),
    practiceNextBtn: document.getElementById("practiceNextBtn"),
    practiceCategory: document.getElementById("practiceCategory"),
    practiceFlow: document.getElementById("practiceFlow"),
    practiceQuestion: document.getElementById("practiceQuestion"),
    practiceQuestionTranslation: document.getElementById("practiceQuestionTranslation"),
    practiceMainPoints: document.getElementById("practiceMainPoints"),
    practiceChecklist: document.getElementById("practiceChecklist"),
    practiceCheckInputs: Array.from(document.querySelectorAll("[data-practice-check]")),
    practiceAnswerLines: document.getElementById("practiceAnswerLines"),
  };

  const savedState = readSavedState();
  const state = {
    fileId: savedState.fileId || data?.files?.[0]?.id || "",
    entryId: savedState.entryId || "",
    mode: savedState.mode || "speaking",
    rate: Number(savedState.rate || 0.9),
    volume: Number(savedState.volume ?? 1),
    repeat: Number(savedState.repeat || 1),
    voiceURI: savedState.voiceURI || "",
    showQuestionTranslation: Boolean(savedState.showQuestionTranslation),
    showTranslations: Boolean(savedState.showTranslations),
    lastFileByTopic: savedState.lastFileByTopic || {},
  };

  let voices = [];
  let sessionId = 0;
  let activeButton = null;
  let openTranslations = new Set();
  const practiceProgress = readPracticeProgress();
  const practice = {
    open: false,
    phase: "ready",
    entryId: "",
    listenCount: 0,
    listeningNumber: 0,
    answerStartedAt: 0,
    elapsedMs: 0,
    timerId: null,
    attemptNumber: 0,
    checks: {},
  };
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
  const categoryGuides = new Map([
    [
      "Description",
      { korean: "묘사", flow: "특징 → 느낌 → 이유 → 구체적 디테일 → 마무리" },
    ],
    ["Habit", { korean: "습관", flow: "평소 행동 → 이유 → 반복 디테일 → 변화 → 마무리" }],
    [
      "Past Experience",
      { korean: "과거 경험", flow: "상황 → 핵심 사건 → 반응 → 해결/결과 → 느낌/교훈" },
    ],
    [
      "Comparison",
      { korean: "비교", flow: "가장 큰 차이 → 과거 → 현재 → 변화 이유 → 마무리" },
    ],
    [
      "Role Play",
      { korean: "롤플레이", flow: "상황 → 질문/요청 → 반응 → 대안 → 마무리" },
    ],
  ]);

  function readSavedState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  }

  function readPracticeProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(practiceStorageKey) || "{}");
      return saved && typeof saved.entries === "object" && saved.entries !== null
        ? saved
        : { version: 1, entries: {} };
    } catch {
      return { version: 1, entries: {} };
    }
  }

  function savePracticeProgress() {
    try {
      localStorage.setItem(practiceStorageKey, JSON.stringify(practiceProgress));
    } catch {
      // Practice still works when private browsing blocks local storage.
    }
  }

  function saveState() {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        fileId: state.fileId,
        entryId: state.entryId,
        mode: state.mode,
        rate: state.rate,
        volume: state.volume,
        repeat: state.repeat,
        voiceURI: state.voiceURI,
        showQuestionTranslation: state.showQuestionTranslation,
        showTranslations: state.showTranslations,
        lastFileByTopic: state.lastFileByTopic,
      }),
    );
  }

  function init() {
    if (!data || !Array.isArray(data.files)) {
      document.body.innerHTML =
        '<main class="load-error"><h1>data.js를 찾을 수 없습니다.</h1><p>먼저 <code>node build-data.mjs</code>를 실행해 주세요.</p></main>';
      return;
    }

    ensureSelectedEntry();
    elements.rateInput.value = String(state.rate);
    elements.rateValue.textContent = `${state.rate.toFixed(2)}x`;
    elements.volumeInput.value = String(state.volume);
    elements.volumeValue.textContent = `${Math.round(state.volume * 100)}%`;
    elements.repeatSelect.value = String(state.repeat);
    if (elements.updateDataBtn) {
      const isLocalServer = ["localhost", "127.0.0.1"].includes(window.location.hostname);
      if (window.location.protocol === "file:") {
        elements.updateDataBtn.textContent = "업데이트 방법";
      } else if (!isLocalServer) {
        elements.updateDataBtn.hidden = true;
      }
    }

    bindEvents();
    refreshVoices();
    render();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    }
  }

  function bindEvents() {
    elements.fileTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-topic-number]");
      if (!button) {
        return;
      }
      selectTopic(button.dataset.topicNumber);
    });

    elements.versionTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-file-id]");
      if (!button) {
        return;
      }
      selectFile(button.dataset.fileId);
    });

    elements.setTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-set]");
      if (!button) {
        return;
      }
      const entry = getSelectedFile().entries.find((item) => item.set === button.dataset.set);
      if (entry) {
        state.entryId = entry.id;
        saveState();
        stopSpeaking();
        render();
      }
    });

    elements.typeGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-entry-id]");
      if (!button) {
        return;
      }
      state.entryId = button.dataset.entryId;
      saveState();
      stopSpeaking();
      renderEntry();
      renderEntryNav();
    });

    elements.modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.mode = button.dataset.mode;
        saveState();
        renderMode();
        renderAnswer();
      });
    });

    elements.updateDataBtn?.addEventListener("click", updateData);
    elements.practiceLaunchBtn?.addEventListener("click", openPractice);
    elements.practiceExitBtn?.addEventListener("click", closePractice);
    elements.practiceReturnBtn?.addEventListener("click", closePractice);
    elements.practiceListenBtn?.addEventListener("click", playPracticeQuestion);
    elements.practiceAnswerStartBtn?.addEventListener("click", startPracticeAnswer);
    elements.practiceFinishBtn?.addEventListener("click", finishPracticeAnswer);
    elements.practiceRetryBtn?.addEventListener("click", retryPractice);
    elements.practiceNextBtn?.addEventListener("click", moveToNextPracticeEntry);
    elements.practiceChecklist?.addEventListener("change", savePracticeChecks);
    elements.settingsToggleBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = elements.settingsToggleBtn.getAttribute("aria-expanded") === "true";
      setSettingsOpen(!isOpen);
    });

    document.addEventListener("click", (event) => {
      if (
        !elements.settingsPanel?.hidden &&
        !elements.settingsPanel.contains(event.target) &&
        !elements.settingsToggleBtn?.contains(event.target)
      ) {
        setSettingsOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !elements.settingsPanel?.hidden) {
        setSettingsOpen(false);
        elements.settingsToggleBtn?.focus();
      }
    });

    elements.rateInput.addEventListener("input", () => {
      state.rate = Number(elements.rateInput.value);
      elements.rateValue.textContent = `${state.rate.toFixed(2)}x`;
      saveState();
    });

    elements.volumeInput.addEventListener("input", () => {
      state.volume = Number(elements.volumeInput.value);
      elements.volumeValue.textContent = `${Math.round(state.volume * 100)}%`;
      saveState();
    });

    elements.repeatSelect.addEventListener("change", () => {
      state.repeat = Number(elements.repeatSelect.value);
      saveState();
    });

    elements.voiceSelect.addEventListener("change", () => {
      state.voiceURI = elements.voiceSelect.value;
      saveState();
    });

    elements.prevBtn.addEventListener("click", () => moveEntry(-1));
    elements.nextBtn.addEventListener("click", () => moveEntry(1));
    elements.stopBtn.addEventListener("click", stopSpeaking);

    elements.questionFullButton.addEventListener("click", () => {
      if (hasTextSelection()) {
        return;
      }
      const entry = getSelectedEntry();
      playSingle(entry.question, elements.questionFullButton);
    });
    elements.answerLines.addEventListener("click", speakFromClick);

    elements.playQuestionBtn.addEventListener("click", () => {
      const entry = getSelectedEntry();
      playSingle(entry.question, elements.questionFullButton);
    });

    elements.copyQuestionBtn?.addEventListener("click", () => {
      const entry = getSelectedEntry();
      copyEntryReference("Question", entry.question);
    });

    elements.toggleQuestionTranslationBtn.addEventListener("click", () => {
      state.showQuestionTranslation = !state.showQuestionTranslation;
      saveState();
      renderQuestionTranslation();
    });

    elements.toggleTranslationsBtn.addEventListener("click", () => {
      state.showTranslations = !state.showTranslations;
      openTranslations = new Set();
      saveState();
      renderAnswer();
    });

    elements.playAnswerBtn.addEventListener("click", () => {
      playSequence(getAnswerItems(getSelectedEntry()), elements.answerLines);
    });

    document.addEventListener("keydown", (event) => {
      if (practice.open) {
        if (event.key === "Escape") {
          closePractice();
        }
        return;
      }
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
        return;
      }
      if (event.key === "ArrowLeft") {
        moveEntry(-1);
      } else if (event.key === "ArrowRight") {
        moveEntry(1);
      } else if (event.key === "Escape") {
        stopSpeaking();
      }
    });
  }

  function getSelectedFile() {
    return data.files.find((file) => file.id === state.fileId) || data.files[0];
  }

  function getSelectedEntry() {
    const file = getSelectedFile();
    return file.entries.find((entry) => entry.id === state.entryId) || file.entries[0];
  }

  function ensureSelectedEntry() {
    if (!data.files.some((file) => file.id === state.fileId)) {
      state.fileId = data.files[0]?.id || "";
    }

    const file = getSelectedFile();
    if (file?.id) {
      state.lastFileByTopic[String(file.number)] = file.id;
    }

    if (!file.entries.some((entry) => entry.id === state.entryId)) {
      state.entryId = file.entries[0]?.id || "";
      saveState();
    }
  }

  function selectTopic(topicNumber) {
    const group = getFileGroups().find((item) => String(item.number) === String(topicNumber));
    if (!group) {
      return;
    }

    const savedFileId = state.lastFileByTopic[String(group.number)];
    const file = group.files.find((item) => item.id === savedFileId) || group.files[0];
    selectFile(file.id);
  }

  function selectFile(fileId) {
    const file = data.files.find((item) => item.id === fileId);
    if (!file) {
      return;
    }

    state.fileId = file.id;
    state.lastFileByTopic[String(file.number)] = file.id;
    state.entryId = file.entries[0]?.id || "";
    saveState();
    stopSpeaking();
    render();
  }

  function render() {
    ensureSelectedEntry();
    elements.statsText.textContent = `${data.stats.entries} questions`;
    renderFiles();
    renderMode();
    renderEntryNav();
    renderEntry();
  }

  function setSettingsOpen(isOpen) {
    if (!elements.settingsToggleBtn || !elements.settingsPanel) {
      return;
    }
    elements.settingsToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    elements.settingsPanel.hidden = !isOpen;
  }

  function openPractice() {
    const entry = getSelectedEntry();
    if (!entry || !elements.practiceOverlay) {
      return;
    }

    cancelSpeechSession();
    stopPracticeTimer();
    setSettingsOpen(false);
    resetPracticeState(entry);
    practice.open = true;
    document.body.classList.add("practice-open");
    renderPractice();
    window.requestAnimationFrame(() => elements.practiceListenBtn?.focus());
  }

  function closePractice() {
    if (!practice.open) {
      return;
    }

    cancelSpeechSession();
    stopPracticeTimer();
    practice.open = false;
    practice.phase = "ready";
    document.body.classList.remove("practice-open");
    renderPractice();
    setStatus("Ready");
    elements.practiceLaunchBtn?.focus();
  }

  function resetPracticeState(entry) {
    stopPracticeTimer();
    practice.phase = "ready";
    practice.entryId = entry?.id || "";
    practice.listenCount = 0;
    practice.listeningNumber = 0;
    practice.answerStartedAt = 0;
    practice.elapsedMs = 0;
    practice.attemptNumber = 0;
    practice.checks = {};
  }

  function retryPractice() {
    if (!practice.open) {
      return;
    }
    cancelSpeechSession();
    resetPracticeState(getPracticeEntry());
    renderPractice();
    window.requestAnimationFrame(() => elements.practiceListenBtn?.focus());
  }

  function moveToNextPracticeEntry() {
    const entries = getSelectedFile().entries;
    const currentIndex = entries.findIndex((entry) => entry.id === practice.entryId);
    if (currentIndex < 0 || currentIndex >= entries.length - 1) {
      return;
    }

    cancelSpeechSession();
    state.entryId = entries[currentIndex + 1].id;
    saveState();
    renderEntryNav();
    renderEntry();
    resetPracticeState(entries[currentIndex + 1]);
    renderPractice();
    window.requestAnimationFrame(() => elements.practiceListenBtn?.focus());
  }

  function getPracticeEntry() {
    const entries = getSelectedFile()?.entries || [];
    return entries.find((entry) => entry.id === practice.entryId) || getSelectedEntry();
  }

  function getPracticeEntryKey(entry) {
    return String(entry?.id || `${entry?.sourceFile || entry?.fileTitle}:${entry?.set}:${entry?.type}`);
  }

  function playPracticeQuestion() {
    if (
      !practice.open ||
      !["ready", "between"].includes(practice.phase) ||
      practice.listenCount >= 2
    ) {
      return;
    }

    const entry = getPracticeEntry();
    if (!entry?.question || !canSpeak()) {
      return;
    }

    const currentSession = beginSession();
    const listenNumber = practice.listenCount + 1;
    const entryId = entry.id;
    practice.phase = "listening";
    practice.listeningNumber = listenNumber;
    renderPractice();

    const utterance = makeUtterance(entry.question);
    utterance.onend = () => {
      if (
        currentSession !== sessionId ||
        !practice.open ||
        practice.entryId !== entryId
      ) {
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
      elements.practiceAnswerStartBtn?.focus();
    };
    utterance.onerror = (event) => {
      if (
        currentSession !== sessionId ||
        event.error === "canceled" ||
        event.error === "interrupted"
      ) {
        return;
      }
      practice.listeningNumber = 0;
      practice.phase = practice.listenCount > 0 ? "between" : "ready";
      renderPractice();
      setStatus("TTS 재생에 실패했습니다.");
    };
    window.speechSynthesis.speak(utterance);
  }

  function startPracticeAnswer() {
    if (!practice.open || practice.listenCount < 1 || practice.phase === "answering") {
      return;
    }

    cancelSpeechSession();
    stopPracticeTimer();
    practice.phase = "answering";
    practice.answerStartedAt = Date.now();
    practice.elapsedMs = 0;
    practice.timerId = window.setInterval(updatePracticeTimer, 250);
    renderPractice();
    updatePracticeTimer();
    elements.practiceFinishBtn?.focus();
  }

  function finishPracticeAnswer() {
    if (!practice.open || practice.phase !== "answering") {
      return;
    }

    practice.elapsedMs = Math.max(0, Date.now() - practice.answerStartedAt);
    stopPracticeTimer();
    practice.phase = "review";
    practice.checks = {};

    const entry = getPracticeEntry();
    const key = getPracticeEntryKey(entry);
    const previous = practiceProgress.entries[key] || {};
    const record = {
      ...previous,
      attempts: Number(previous.attempts || 0) + 1,
      lastDurationMs: practice.elapsedMs,
      lastListenCount: practice.listenCount,
      lastCompletedAt: new Date().toISOString(),
      lastChecks: {},
    };
    practiceProgress.entries[key] = record;
    practice.attemptNumber = record.attempts;
    savePracticeProgress();
    renderPractice();
    window.requestAnimationFrame(() => elements.practiceRetryBtn?.focus());
  }

  function stopPracticeTimer() {
    if (practice.timerId !== null) {
      window.clearInterval(practice.timerId);
      practice.timerId = null;
    }
  }

  function updatePracticeTimer() {
    if (practice.phase === "answering" && practice.answerStartedAt) {
      practice.elapsedMs = Math.max(0, Date.now() - practice.answerStartedAt);
    }
    const value = formatPracticeDuration(practice.elapsedMs);
    elements.practiceTimerValue.textContent = value;
    elements.practiceTimerValue.setAttribute(
      "datetime",
      `PT${Math.floor(practice.elapsedMs / 1000)}S`,
    );
  }

  function renderPractice() {
    if (!elements.practiceOverlay) {
      return;
    }

    elements.practiceOverlay.hidden = !practice.open;
    if (!practice.open) {
      return;
    }

    const entry = getPracticeEntry();
    if (!entry) {
      closePractice();
      return;
    }

    const entries = getSelectedFile().entries;
    const currentIndex = entries.findIndex((item) => item.id === entry.id);
    elements.practiceMeta.textContent = `${entry.fileTitle} · Set ${entry.set} · Type ${entry.type} · ${currentIndex + 1}/${entries.length}`;
    const isReview = practice.phase === "review";
    elements.practiceRunView.hidden = isReview;
    elements.practiceReviewView.hidden = !isReview;

    if (isReview) {
      renderPracticeReview(entry, currentIndex, entries.length);
    } else {
      renderPracticeRun();
    }
  }

  function renderPracticeRun() {
    const phaseContent = {
      ready: { label: "준비", message: "문제를 들어보세요." },
      listening: {
        label: `${practice.listeningNumber}회차`,
        message: "문제를 듣고 있습니다.",
      },
      between: { label: "1회 청취 완료", message: "한 번 더 듣거나 답변을 시작하세요." },
      answering: { label: "답변 중", message: "답변하세요." },
    }[practice.phase] || { label: "준비", message: "문제를 들어보세요." };

    elements.practicePhaseLabel.textContent = phaseContent.label;
    elements.practiceMessage.textContent = phaseContent.message;
    elements.practiceTimer.hidden = practice.phase !== "answering";
    elements.practiceListenBtn.hidden = practice.phase === "answering";
    elements.practiceListenBtn.disabled = practice.phase === "listening";
    elements.practiceAnswerStartBtn.hidden = practice.phase !== "between";
    elements.practiceFinishBtn.hidden = practice.phase !== "answering";

    if (practice.phase === "listening") {
      elements.practiceListenBtn.textContent = `재생 중 ${practice.listeningNumber}/2`;
    } else if (practice.listenCount === 0) {
      elements.practiceListenBtn.textContent = "▶ 문제 듣기 1/2";
    } else {
      elements.practiceListenBtn.textContent = "▶ 한 번 더 듣기 2/2";
    }

    elements.practiceListenSteps.forEach((step) => {
      const number = Number(step.dataset.practiceListen);
      const isCurrent = practice.phase === "listening" && practice.listeningNumber === number;
      step.classList.toggle("is-complete", number <= practice.listenCount);
      step.classList.toggle("is-current", isCurrent);
      step.setAttribute("aria-current", isCurrent ? "step" : "false");
    });
    updatePracticeTimer();
  }

  function renderPracticeReview(entry, currentIndex, entryCount) {
    const details = getCategoryDetails(entry.category);
    const mainPointIndexes = getFinalMainPointIndexes(entry);
    const mainPointTexts = mainPointIndexes
      .map((index) => entry.finalSentences?.[index])
      .filter(Boolean);

    if (!mainPointTexts.length && Array.isArray(entry.mainPointSentences)) {
      mainPointTexts.push(...entry.mainPointSentences.filter(Boolean));
    }

    if (!mainPointTexts.length && entry.mainPoint) {
      mainPointTexts.push(entry.mainPoint);
    }

    elements.practiceResultTime.textContent = formatPracticeDuration(practice.elapsedMs);
    elements.practiceAttemptText.textContent = `${practice.attemptNumber}회차 완료`;
    elements.practiceNextBtn.disabled = currentIndex >= entryCount - 1;
    elements.practiceCategory.textContent = details.label;
    elements.practiceFlow.textContent = details.flow;
    elements.practiceQuestion.textContent = entry.question || "";
    elements.practiceQuestionTranslation.textContent = entry.questionTranslation || "";
    elements.practiceQuestionTranslation.hidden = !entry.questionTranslation;

    elements.practiceMainPoints.innerHTML = "";
    if (!mainPointTexts.length) {
      const empty = document.createElement("p");
      empty.className = "practice-empty";
      empty.textContent = "정리된 MP 문장이 없습니다.";
      elements.practiceMainPoints.append(empty);
    } else {
      mainPointTexts.forEach((text, index) => {
        const item = document.createElement("p");
        item.innerHTML = `<span>MP${mainPointTexts.length > 1 ? index + 1 : ""}</span>${escapeHtml(text)}`;
        elements.practiceMainPoints.append(item);
      });
    }

    elements.practiceCheckInputs.forEach((input) => {
      input.checked = Boolean(practice.checks[input.dataset.practiceCheck]);
    });
    renderPracticeAnswer(entry, mainPointIndexes);
  }

  function renderPracticeAnswer(entry, mainPointIndexes) {
    const mainPointSet = new Set(mainPointIndexes);
    const sentences = entry.finalSentences || [];
    elements.practiceAnswerLines.innerHTML = "";

    sentences.forEach((text, index) => {
      const card = document.createElement("article");
      card.className = `practice-answer-card${mainPointSet.has(index) ? " is-main-point" : ""}`;

      const english = document.createElement("div");
      english.className = "practice-answer-english";
      english.innerHTML = `
        <span class="practice-answer-marker">
          <span>${index + 1}</span>
          ${mainPointSet.has(index) ? '<small title="Main Point · 핵심 문장">MP</small>' : ""}
        </span>
        <p>${escapeHtml(text)}</p>
      `;
      card.append(english);

      const translation = findExactTranslation(entry, text);
      if (translation) {
        const korean = document.createElement("p");
        korean.className = "practice-answer-translation";
        korean.textContent = translation;
        card.append(korean);
      }
      elements.practiceAnswerLines.append(card);
    });
  }

  function savePracticeChecks(event) {
    const input = event.target.closest("[data-practice-check]");
    if (!input || practice.phase !== "review") {
      return;
    }

    practice.checks[input.dataset.practiceCheck] = input.checked;
    const entry = getPracticeEntry();
    const record = practiceProgress.entries[getPracticeEntryKey(entry)];
    if (record) {
      record.lastChecks = { ...practice.checks };
      savePracticeProgress();
    }
  }

  function getFinalMainPointIndexes(entry) {
    const sentences = entry?.finalSentences || [];
    if (Array.isArray(entry?.mainPointSentenceIndexes)) {
      const storedIndexes = [...new Set(entry.mainPointSentenceIndexes)].filter(
        (index) => Number.isInteger(index) && index >= 0 && index < sentences.length,
      );
      if (storedIndexes.length) {
        return storedIndexes;
      }
    }

    if (Array.isArray(entry?.mainPointSentences)) {
      const matchedIndexes = entry.mainPointSentences
        .map((mainPointSentence) =>
          sentences.findIndex(
            (sentence) => normalizeEnglish(sentence) === normalizeEnglish(mainPointSentence),
          ),
        )
        .filter((index) => index >= 0);
      if (matchedIndexes.length) {
        return [...new Set(matchedIndexes)];
      }
    }

    const legacyIndex = Number(entry?.mainPointSentenceIndex);
    return Number.isInteger(legacyIndex) && legacyIndex >= 0 && legacyIndex < sentences.length
      ? [legacyIndex]
      : [];
  }

  function findExactTranslation(entry, text) {
    const normalizedText = normalizeEnglish(text);
    const exact = (entry?.translations || []).find(
      (pair) => normalizeEnglish(pair.english) === normalizedText,
    );
    return exact?.korean || "";
  }

  function formatPracticeDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(Number(milliseconds || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function cancelSpeechSession() {
    sessionId += 1;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    clearActiveButton();
  }

  function renderFiles() {
    const selectedFile = getSelectedFile();
    const groups = getFileGroups();

    elements.fileTabs.innerHTML = "";
    groups.forEach((group) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "topic-tab";
      button.dataset.topicNumber = String(group.number);
      button.setAttribute("aria-current", group.number === selectedFile.number ? "page" : "false");
      button.textContent = `${group.number}. ${topicLabels.get(group.number) || getTopicSlug(group.files[0])}`;
      elements.fileTabs.append(button);
    });

    elements.versionTabs.innerHTML = "";
    const selectedGroup = groups.find((group) => group.number === selectedFile.number);
    if (!selectedGroup || selectedGroup.files.length <= 1) {
      elements.versionTabs.hidden = true;
      return;
    }

    elements.versionTabs.hidden = false;
    selectedGroup.files.forEach((file) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "version-tab";
      button.dataset.fileId = file.id;
      button.setAttribute("aria-current", file.id === selectedFile.id ? "page" : "false");
      button.textContent = getVersionLabel(file);
      elements.versionTabs.append(button);
    });
  }

  function renderEntryNav() {
    const entry = getSelectedEntry();
    const entries = getSelectedFile().entries;
    const sets = unique(entries.map((item) => item.set));

    elements.setTabs.innerHTML = "";
    sets.forEach((set) => {
      const count = entries.filter((item) => item.set === set).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "set-tab";
      button.dataset.set = set;
      button.setAttribute("aria-current", set === entry.set ? "page" : "false");
      button.textContent = `Set ${set} (${count})`;
      elements.setTabs.append(button);
    });

    elements.typeGrid.innerHTML = "";
    entries
      .filter((item) => item.set === entry.set)
      .forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "type-button";
        button.dataset.entryId = item.id;
        button.setAttribute("aria-current", item.id === state.entryId ? "page" : "false");
        button.innerHTML = `
          <strong>T${escapeHtml(item.type)}</strong>
          <span>${escapeHtml(shortQuestion(item.question))}</span>
        `;
        elements.typeGrid.append(button);
      });
  }

  function renderMode() {
    elements.modeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.mode === state.mode ? "true" : "false");
    });
  }

  function renderEntry() {
    const entry = getSelectedEntry();
    const allEntries = getSelectedFile().entries;
    const currentIndex = allEntries.findIndex((item) => item.id === entry.id);

    elements.entryMeta.textContent = `${entry.fileTitle} · Set ${entry.set} · Type ${entry.type} · ${currentIndex + 1}/${allEntries.length}`;
    const categoryDetails = getCategoryDetails(entry.category);
    elements.questionCategory.textContent = categoryDetails.label;
    elements.questionCategory.setAttribute(
      "aria-label",
      `문제 유형: ${categoryDetails.title}. 답변 흐름: ${categoryDetails.flow}`,
    );
    elements.categoryTooltipTitle.textContent = categoryDetails.title;
    elements.categoryTooltipFlow.textContent = categoryDetails.flow;
    elements.questionFullButton.textContent = entry.question || "Question not found.";
    elements.questionFullButton.dataset.speakText = entry.question || "";
    renderQuestionTranslation();
    renderAnswer();
    setStatus("Ready");
  }

  function renderQuestionTranslation() {
    const entry = getSelectedEntry();
    const translation = entry.questionTranslation || "";
    elements.toggleQuestionTranslationBtn.textContent = state.showQuestionTranslation ? "번역 숨기기" : "번역";
    elements.toggleQuestionTranslationBtn.setAttribute(
      "aria-pressed",
      state.showQuestionTranslation ? "true" : "false",
    );
    elements.toggleQuestionTranslationBtn.disabled = !translation;
    elements.questionTranslationText.textContent = translation;
    elements.questionTranslationText.hidden = !translation || !state.showQuestionTranslation;
  }

  function renderAnswer() {
    const entry = getSelectedEntry();
    const items = getAnswerItems(entry);
    elements.answerMeta.textContent = `${items.length}개 문장`;
    elements.answerTitle.textContent = state.mode === "speaking" ? "말하기용 답변" : "최종 답변";
    elements.toggleTranslationsBtn.textContent = state.showTranslations ? "번역 숨기기" : "번역";
    elements.toggleTranslationsBtn.setAttribute("aria-pressed", state.showTranslations ? "true" : "false");
    renderSentenceButtons(elements.answerLines, items, "answer");
  }

  function renderSentenceButtons(container, items, type) {
    const entry = getSelectedEntry();
    const mainPointIndexes = type === "answer" ? getMainPointItemIndexes(entry) : [];
    container.innerHTML = "";
    if (!items.length) {
      container.innerHTML = '<p class="empty-message">읽을 문장이 없습니다.</p>';
      return;
    }

    items.forEach((item, index) => {
      const text = getItemText(item);
      const translation = typeof item === "object" ? item.translation : "";
      const translationKey = `${state.entryId}:${state.mode}:${index}`;
      const isTranslationOpen = state.showTranslations || openTranslations.has(translationKey);
      const isMainPoint = mainPointIndexes.includes(index);
      const wrapper = document.createElement("div");
      wrapper.className = [
        "sentence-card",
        isMainPoint ? "is-main-point" : "",
        translation ? "has-translation" : "",
        translation && !state.showTranslations ? "has-translation-toggle" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const sentenceMain = document.createElement("div");
      sentenceMain.className = "sentence-main-row";
      wrapper.append(sentenceMain);

      const button = document.createElement("button");
      button.type = "button";
      button.className = `sentence-button ${type === "question" ? "question-sentence" : ""}`;
      button.dataset.speakText = text;
      button.dataset.speakIndex = String(index);
      button.innerHTML = `
        <span class="sentence-marker">
          <span class="sentence-index">${index + 1}</span>
          ${
            isMainPoint
              ? '<span class="main-point-label" title="Main Point · 핵심 문장">MP</span>'
              : ""
          }
        </span>
        <span class="sentence-text">${escapeHtml(text)}</span>
      `;
      sentenceMain.append(button);

      const sentenceTools = document.createElement("div");
      sentenceTools.className = "sentence-tools";

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "sentence-copy-button copy-icon-button";
      copyButton.title = `${index + 1}번 문장과 위치 복사`;
      copyButton.setAttribute("aria-label", copyButton.title);
      copyButton.addEventListener("click", (event) => {
        event.stopPropagation();
        copyEntryReference(`${index + 1}번 문장`, text);
      });
      sentenceTools.append(copyButton);
      sentenceMain.append(sentenceTools);

      if (translation) {
        if (!state.showTranslations) {
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "translation-toggle";
          toggle.textContent = isTranslationOpen ? "접기" : "번역";
          toggle.setAttribute("aria-expanded", isTranslationOpen ? "true" : "false");
          toggle.addEventListener("click", () => {
            if (openTranslations.has(translationKey)) {
              openTranslations.delete(translationKey);
            } else {
              openTranslations.add(translationKey);
            }
            renderAnswer();
          });
          sentenceTools.append(toggle);
        }

        const translationText = document.createElement("p");
        translationText.className = "translation-text";
        translationText.hidden = !isTranslationOpen;
        translationText.textContent = translation;
        wrapper.append(translationText);
      }

      container.append(wrapper);
    });
  }

  function getAnswerItems(entry) {
    if (!entry) {
      return [];
    }
    const texts = state.mode === "speaking" ? entry.speakingChunks : entry.finalSentences;
    return texts.map((text, index) => ({
      text,
      translation:
        state.mode === "speaking"
          ? entry.speakingTranslations?.[index] || findTranslation(entry, text)
          : findTranslation(entry, text),
    }));
  }

  function getItemText(item) {
    return typeof item === "object" && item !== null ? item.text : item;
  }

  function getCategoryDetails(value) {
    const categories = String(value || "")
      .split(/\s*\+\s*/)
      .map((category) => category.trim())
      .filter(Boolean);

    if (!categories.length) {
      return {
        label: "문제 유형",
        title: "문제 유형",
        flow: "핵심 답변 → 이유/디테일 → 마무리",
      };
    }

    const guides = categories.map(
      (category) =>
        categoryGuides.get(category) || {
          korean: category,
          flow: "핵심 답변 → 이유/디테일 → 마무리",
        },
    );
    const flow = guides
      .map((guide) =>
        categories.length > 1 ? `${guide.korean}: ${guide.flow}` : guide.flow,
      )
      .join("\n");

    return {
      label: categories.join(" + "),
      title: `${categories.join(" + ")} · ${guides.map((guide) => guide.korean).join(" + ")}`,
      flow,
    };
  }

  function getMainPointItemIndexes(entry) {
    if (!entry?.mainPoint) {
      return [];
    }

    const items = state.mode === "final" ? entry.finalSentences : entry.speakingChunks;
    const storedIndexes =
      state.mode === "final"
        ? entry.mainPointSentenceIndexes
        : entry.mainPointSpeakingChunkIndexes;
    if (Array.isArray(storedIndexes)) {
      return [...new Set(storedIndexes)].filter(
        (index) => Number.isInteger(index) && index >= 0 && index < items.length,
      );
    }

    const legacyIndex = Number(
      state.mode === "final"
        ? entry.mainPointSentenceIndex
        : entry.mainPointSpeakingChunkIndex,
    );
    if (Number.isInteger(legacyIndex) && legacyIndex >= 0 && legacyIndex < items.length) {
      return [legacyIndex];
    }

    return [];
  }

  function normalizeEnglish(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/["'“”‘’]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findTranslation(entry, text) {
    const pairs = entry?.translations || [];
    if (!pairs.length) {
      return "";
    }

    const normalizedText = normalizeEnglish(text);
    if (!normalizedText) {
      return "";
    }

    const exact = pairs.find((pair) => normalizeEnglish(pair.english) === normalizedText);
    if (exact) {
      return exact.korean;
    }

    if (state.mode !== "speaking" || normalizedText.length < 5) {
      return "";
    }

    const containingSentence = pairs.find((pair) => {
      const normalizedEnglish = normalizeEnglish(pair.english);
      return normalizedEnglish.includes(normalizedText);
    });

    return containingSentence?.korean || "";
  }

  async function updateData() {
    if (!elements.updateDataBtn) {
      return;
    }

    if (window.location.protocol === "file:") {
      setStatus(
        "MD 수정 후 study-viewer/OPIc-study.bat을 더블클릭하면 업데이트된 화면이 자동으로 열립니다.",
      );
      return;
    }

    if (window.location.hostname === "baemu.github.io") {
      setStatus(
        "휴대폰 공개 화면까지 반영하려면 PC에서 study-viewer/OPIc-publish.bat을 실행하세요.",
      );
      return;
    }

    const originalText = elements.updateDataBtn.textContent;
    elements.updateDataBtn.disabled = true;
    elements.updateDataBtn.textContent = "업데이트 중";
    stopSpeaking();
    setStatus("md 변경 내용을 data.js로 반영하는 중입니다.");

    let shouldReload = false;
    try {
      const response = await fetch("/api/update", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || `HTTP ${response.status}`);
      }

      shouldReload = true;
      setStatus("업데이트 완료. 화면을 새로고침합니다.");
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setStatus(`업데이트 실패: ${error.message}`);
    } finally {
      if (!shouldReload) {
        elements.updateDataBtn.disabled = false;
        elements.updateDataBtn.textContent = originalText;
      }
    }
  }

  function moveEntry(direction) {
    const entries = getSelectedFile().entries;
    const currentIndex = entries.findIndex((entry) => entry.id === state.entryId);
    if (currentIndex < 0) {
      return;
    }
    const nextIndex = Math.min(Math.max(currentIndex + direction, 0), entries.length - 1);
    if (nextIndex === currentIndex) {
      return;
    }
    state.entryId = entries[nextIndex].id;
    saveState();
    stopSpeaking();
    renderEntryNav();
    renderEntry();
  }

  function refreshVoices() {
    if (!("speechSynthesis" in window)) {
      elements.voiceSelect.innerHTML = '<option value="">TTS 미지원</option>';
      elements.voiceSelect.disabled = true;
      return;
    }

    voices = window.speechSynthesis
      .getVoices()
      .filter((voice) => /^en([-_]|$)/i.test(voice.lang))
      .sort((a, b) => a.name.localeCompare(b.name));

    elements.voiceSelect.innerHTML = "";

    if (!voices.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "기본 영어 음성";
      elements.voiceSelect.append(option);
      return;
    }

    voices.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.voiceURI;
      option.textContent = `${voice.name} (${voice.lang})`;
      elements.voiceSelect.append(option);
    });

    if (state.voiceURI && voices.some((voice) => voice.voiceURI === state.voiceURI)) {
      elements.voiceSelect.value = state.voiceURI;
    } else {
      const preferredVoice =
        voices.find((voice) => /en-US/i.test(voice.lang)) ||
        voices.find((voice) => /en-GB/i.test(voice.lang)) ||
        voices[0];
      state.voiceURI = preferredVoice.voiceURI;
      elements.voiceSelect.value = state.voiceURI;
      saveState();
    }
  }

  function speakFromClick(event) {
    const button = event.target.closest("[data-speak-text]");
    if (!button || hasTextSelection()) {
      return;
    }
    playSingle(button.dataset.speakText, button);
  }

  function hasTextSelection() {
    return Boolean(window.getSelection?.()?.toString().trim());
  }

  function copyEntryReference(label, text) {
    const entry = getSelectedEntry();
    const fileName = entry.sourceFile || `${entry.fileTitle}.md`;
    const content = `[${fileName} | Set ${entry.set} | Type ${entry.type} | ${label}] ${text}`;

    writeClipboard(content)
      .then(() => setStatus("위치와 문장을 복사했습니다."))
      .catch(() => setStatus("복사에 실패했습니다."));
  }

  async function writeClipboard(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Local file pages can block the modern clipboard API, so use the browser fallback.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) {
      throw new Error("Clipboard copy failed");
    }
  }

  function playSingle(text, button) {
    if (!text || !canSpeak()) {
      return;
    }

    const currentSession = beginSession();
    let repeatLeft = state.repeat;

    function run() {
      if (currentSession !== sessionId) {
        return;
      }
      setActiveButton(button);
      const utterance = makeUtterance(text);
      utterance.onend = () => {
        if (currentSession !== sessionId) {
          return;
        }
        repeatLeft -= 1;
        if (repeatLeft > 0) {
          run();
        } else {
          clearActiveButton();
          setStatus("Ready");
        }
      };
      utterance.onerror = (event) => {
        if (
          currentSession !== sessionId ||
          event.error === "canceled" ||
          event.error === "interrupted"
        ) {
          return;
        }
        clearActiveButton();
        setStatus("TTS 재생에 실패했습니다.");
      };
      window.speechSynthesis.speak(utterance);
    }

    setStatus("Playing");
    run();
  }

  function playSequence(items, container) {
    if (!items.length || !canSpeak()) {
      return;
    }

    const currentSession = beginSession();
    let index = 0;
    let repeatLeft = state.repeat;

    function run() {
      if (currentSession !== sessionId) {
        return;
      }
      if (index >= items.length) {
        clearActiveButton();
        setStatus("Ready");
        return;
      }

      const button = container.querySelector(`[data-speak-index="${index}"]`);
      setActiveButton(button);
      const utterance = makeUtterance(getItemText(items[index]));
      utterance.onend = () => {
        if (currentSession !== sessionId) {
          return;
        }
        repeatLeft -= 1;
        if (repeatLeft <= 0) {
          index += 1;
          repeatLeft = state.repeat;
        }
        run();
      };
      utterance.onerror = (event) => {
        if (
          currentSession !== sessionId ||
          event.error === "canceled" ||
          event.error === "interrupted"
        ) {
          return;
        }
        clearActiveButton();
        setStatus("TTS 재생에 실패했습니다.");
      };
      window.speechSynthesis.speak(utterance);
    }

    setStatus("Playing sequence");
    run();
  }

  function canSpeak() {
    if (!("speechSynthesis" in window)) {
      setStatus("이 브라우저는 TTS를 지원하지 않습니다.");
      return false;
    }
    return true;
  }

  function beginSession() {
    sessionId += 1;
    window.speechSynthesis.cancel();
    clearActiveButton();
    return sessionId;
  }

  function stopSpeaking() {
    sessionId += 1;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    clearActiveButton();
    setStatus("Stopped");
  }

  function makeUtterance(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = voices.find((voice) => voice.voiceURI === state.voiceURI);
    utterance.lang = selectedVoice?.lang || "en-US";
    utterance.voice = selectedVoice || null;
    utterance.rate = state.rate;
    utterance.volume = state.volume;
    utterance.pitch = 1;
    return utterance;
  }

  function setActiveButton(button) {
    clearActiveButton();
    activeButton = button || null;
    if (activeButton) {
      activeButton.classList.add("is-speaking");
      activeButton.closest(".sentence-card")?.classList.add("is-speaking");
      activeButton.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function clearActiveButton() {
    if (activeButton) {
      activeButton.closest(".sentence-card")?.classList.remove("is-speaking");
      activeButton.classList.remove("is-speaking");
      activeButton = null;
    }
  }

  function setStatus(text) {
    elements.statusText.textContent = text;
    if (elements.statusBar) {
      elements.statusBar.hidden = text === "Ready";
    }
  }

  function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  function getFileGroups() {
    const groups = [];
    data.files.forEach((file) => {
      let group = groups.find((item) => item.number === file.number);
      if (!group) {
        group = { number: file.number, files: [] };
        groups.push(group);
      }
      group.files.push(file);
    });
    return groups.sort((a, b) => a.number - b.number);
  }

  function getTopicSlug(file) {
    return String(file?.title || "")
      .replace(/^\d+\.\s*/, "")
      .replace(/\d+$/, "")
      .replace(/-$/, "")
      .trim();
  }

  function getVersionLabel(file) {
    return String(file?.title || "").replace(/^\d+\.\s*/, "");
  }

  function shortQuestion(text) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    return value.length > 54 ? `${value.slice(0, 54)}...` : value;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[character];
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
        .catch(() => {
          // The viewer still works online when service worker registration is unavailable.
        });
    });
  }

  registerServiceWorker();
  init();
})();
