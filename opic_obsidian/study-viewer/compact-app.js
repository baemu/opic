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
    questionRpBadge: document.getElementById("questionRpBadge"),
    categoryTooltipTitle: document.getElementById("categoryTooltipTitle"),
    categoryTooltipRp: document.getElementById("categoryTooltipRp"),
    categoryTooltipSummary: document.getElementById("categoryTooltipSummary"),
    categoryTooltipSignals: document.getElementById("categoryTooltipSignals"),
    categoryTooltipFlow: document.getElementById("categoryTooltipFlow"),
    categoryTooltipStrategy: document.getElementById("categoryTooltipStrategy"),
    categoryTooltipCautions: document.getElementById("categoryTooltipCautions"),
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
    practiceSetupView: document.getElementById("practiceSetupView"),
    practiceSessionView: document.getElementById("practiceSessionView"),
    practiceKindButtons: Array.from(document.querySelectorAll("[data-practice-kind]")),
    practiceRandomPanel: document.getElementById("practiceRandomPanel"),
    practiceRandomSummary: document.getElementById("practiceRandomSummary"),
    practiceSelectedPanel: document.getElementById("practiceSelectedPanel"),
    practiceSelectedMeta: document.getElementById("practiceSelectedMeta"),
    practiceSelectedQuestion: document.getElementById("practiceSelectedQuestion"),
    practiceDurationButtons: Array.from(document.querySelectorAll("[data-practice-duration]")),
    practiceDurationInput: document.getElementById("practiceDurationInput"),
    practiceSetupStartBtn: document.getElementById("practiceSetupStartBtn"),
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
    practiceDurationSec: Math.min(
      300,
      Math.max(10, Number(savedState.practiceDurationSec) || 60),
    ),
  };

  let voices = [];
  let sessionId = 0;
  let activeButton = null;
  let openTranslations = new Set();
  const practiceProgress = readPracticeProgress();
  const practice = {
    open: false,
    phase: "setup",
    kind: "random",
    durationSec: state.practiceDurationSec,
    setupFileId: "",
    setupEntryId: "",
    fileId: "",
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
      {
        korean: "묘사",
        summary: "한 특징을 중심으로 묘사하고 마지막에 다시 돌아옵니다.",
        signals: ["Describe", "What is it like / look like?", "Tell me about ..."],
        flow: "MP → 묘사 보충 → MP 복귀",
        steps: [
          "대상과 가장 두드러지는 특징 하나를 먼저 말한다.",
          "그 특징에 대한 감정과 좋아하거나 싫어하는 이유를 붙인다.",
          "관련 묘사 1~2개만 보충한다.",
          "처음 특징으로 돌아와 짧게 마무리한다.",
        ],
        cautions: [
          "방·가구·시설을 전부 나열하지 않는다.",
          "방 개수·구조처럼 질문이 지정한 정보는 짧게라도 답한다.",
          "답이 충분하면 Quick Comparison을 억지로 넣지 않는다.",
        ],
      },
    ],
    [
      "Habit",
      {
        korean: "습관",
        summary: "평소 반복하는 행동 하나와 그 이유를 중심으로 말합니다.",
        signals: ["usually / normally / often", "whenever / every time", "typical routine"],
        flow: "현재 행동 MP → 이유·디테일 → 선택적 과거 비교 → 현재 MP",
        steps: [
          "반복 행동 하나를 현재형으로 먼저 말한다.",
          "언제, 얼마나 자주 하는지 덧붙인다.",
          "그 행동을 하는 개인적인 이유와 작은 디테일을 말한다.",
          "답이 짧을 때만 과거와 비교한 뒤 현재 습관으로 돌아온다.",
        ],
        cautions: [
          "MP는 감정보다 행동이어야 한다.",
          "한 번의 긴 사건으로 바뀌지 않게 현재형을 유지한다.",
          "여러 행동을 한꺼번에 중심으로 잡지 않는다.",
        ],
      },
    ],
    [
      "Past Experience",
      {
        korean: "과거 경험",
        summary: "무슨 일이 있었는지와 당시 감정을 먼저 밝힙니다.",
        signals: [
          "last time / memorable",
          "Tell me about a time",
          "Have you ever?",
          "problem / unexpected",
        ],
        flow: "사건·감정·이유 → 과정 → 해결·결과",
        steps: [
          "핵심 사건과 그때의 감정을 먼저 말한다.",
          "왜 그렇게 느꼈는지 짧게 설명한다.",
          "사건의 배경과 진행을 시간 순서로 이어 간다.",
          "해결 또는 결과와 최종 감정·교훈으로 끝낸다.",
        ],
        cautions: [
          "긴 배경보다 핵심 사건을 먼저 밝힌다.",
          "한 답변에는 사건 하나만 사용하고 과거형을 유지한다.",
          "해결되지 않은 일을 억지로 해결된 것처럼 만들지 않는다.",
        ],
      },
    ],
    [
      "Comparison",
      {
        korean: "비교",
        summary: "비교 기준 하나를 정하고 같은 요소끼리 비교합니다.",
        signals: ["compare / difference", "then and now", "changed", "A and B"],
        flow: "시간: 현재 → 과거 → 현재 / A·B: 큰 차이 → A → B → 선호",
        steps: [
          "시간 비교인지 A/B 비교인지 먼저 구분한다.",
          "시간 비교는 현재 MP에서 반대되는 과거로 갔다가 현재로 돌아온다.",
          "A/B 비교는 가장 큰 차이를 먼저 말하고 A와 B를 차례로 설명한다.",
          "내 선호와 이유 또는 짧은 결론으로 마무리한다.",
        ],
        cautions: [
          "가격·분위기·편리함을 모두 비교하지 말고 기준은 1~2개만 쓴다.",
          "현재와 과거에서 서로 다른 요소를 비교하지 않는다.",
          "막히면 과거 → 현재 → 결론만 말해도 된다.",
        ],
      },
    ],
    [
      "Role Play",
      {
        korean: "롤플레이",
        summary: "상대가 있다고 가정하고 질문·요청과 반응을 주고받습니다.",
        signals: ["ask questions", "call / contact", "problem", "suggest alternatives"],
        flow: "상황·목적 → 질문/요청 → 가상 답변·반응 → 마무리",
        steps: [
          "상황과 통화 목적을 짧게 밝힌다.",
          "필요한 질문이나 요청을 하나씩 말한다.",
          "상대의 가상 답을 반복하고 자연스럽게 반응한다.",
          "감사 또는 다음 행동으로 마무리한다.",
        ],
        cautions: [
          "질문이나 대안을 한꺼번에 나열하지 않는다.",
          "실제 대화처럼 짧게 반응하며 이어 간다.",
        ],
      },
    ],
    [
      "Past Experience + Comparison",
      {
        korean: "과거 경험 + 비교",
        summary: "과거 사건을 설명한 뒤 같은 기준으로 과거와 현재를 비교합니다.",
        signals: ["Have you ever? / last time", "changed / compare", "then and now"],
        flow: "사건·감정·이유 → 결과 → 같은 기준의 과거·현재 비교 → 결론",
        steps: [
          "핵심 과거 사건과 당시 감정을 먼저 말한다.",
          "사건의 진행과 결과를 짧게 정리한다.",
          "그 경험 전후가 어떻게 달라졌는지 같은 기준으로 비교한다.",
          "현재의 생각이나 선택으로 마무리한다.",
        ],
        cautions: [
          "사건과 비교를 각각 길게 늘이지 않는다.",
          "비교 기준은 하나, 많아도 두 개만 사용한다.",
          "과거 사건과 관련 없는 현재 이야기를 붙이지 않는다.",
        ],
      },
    ],
  ]);
  const rolePlayGuides = new Map([
    [
      "RP11",
      {
        korean: "정보 질문·요청",
        summary: "상대의 답을 가정해 반복하고 반응하면서 정보를 얻습니다.",
        signals: [
          "ask 3–4 questions",
          "find out more",
          "call / contact",
          "interested in ...",
        ],
        flow: "질문 → 답 반복 → 반응",
        steps: [
          "상황과 목적을 한 문장으로 짧게 밝힌다.",
          "첫 질문을 하고 상대의 가상 답을 반복해 반응한다.",
          "두 번째·세 번째 질문도 질문 → 답 반복 → 반응 순서로 이어 간다.",
          "감사하거나 다음 행동을 말하며 끝낸다.",
        ],
        cautions: [
          "질문 세 개를 반응 없이 연속으로 던지지 않는다.",
          "질문은 보통 세 개면 충분하며 목적과 관련된 정보만 묻는다.",
        ],
      },
    ],
    [
      "RP12",
      {
        korean: "문제 해결·대안",
        summary: "문제를 바로 알리고, 첫 해결책이 안 된다고 가정해 다른 대안을 냅니다.",
        signals: [
          "problem / cannot",
          "wrong / broken",
          "change / refund / reschedule",
          "alternatives",
        ],
        flow: "문제 → 대안 1 → 대안 2 → 결정",
        steps: [
          "인사 뒤 문제를 바로 설명한다.",
          "첫 번째 해결책을 요청한다.",
          "안 된다는 가상 답에 짧게 반응한다.",
          "두 번째 해결책을 요청하고, 된다고 가정해 결정·감사로 끝낸다.",
        ],
        cautions: [
          "문제 설명을 길게 끌지 않는다.",
          "현실적인 대안 두 개면 충분하며 세네 개를 나열하지 않는다.",
        ],
      },
    ],
    [
      "RP13",
      {
        korean: "비슷한 문제 경험",
        summary: "형식은 Role Play지만 답변은 Past Experience 방식으로 전개합니다.",
        signals: ["similar problem", "Have you ever?", "remember a time", "what happened?"],
        flow: "과거 문제 → 해결 → 결과",
        steps: [
          "과거에 생긴 문제와 결과를 먼저 제시한다.",
          "문제가 발생한 배경과 내가 취한 행동을 설명한다.",
          "해결 과정을 시간 순서로 이어 간다.",
          "최종 결과와 감정 또는 이후의 변화로 끝낸다.",
        ],
        cautions: [
          "현재 상황극처럼 말하지 말고 과거형을 유지한다.",
          "앞 RP12의 소재를 이어 쓰되 한 사건에만 집중한다.",
        ],
      },
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
        practiceDurationSec: state.practiceDurationSec,
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
    elements.practiceSetupStartBtn?.addEventListener("click", startPracticeFromSetup);
    elements.practiceKindButtons.forEach((button) => {
      button.addEventListener("click", () => setPracticeKind(button.dataset.practiceKind));
    });
    elements.practiceDurationButtons.forEach((button) => {
      button.addEventListener("click", () => setPracticeDuration(button.dataset.practiceDuration));
    });
    elements.practiceDurationInput?.addEventListener("input", updatePracticeDurationFromInput);
    elements.practiceDurationInput?.addEventListener("change", commitPracticeDurationInput);
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
    const file = getSelectedFile();
    if (!entry || !file || !elements.practiceOverlay) {
      return;
    }

    cancelSpeechSession();
    stopPracticeTimer();
    setSettingsOpen(false);
    practice.kind = "random";
    practice.durationSec = state.practiceDurationSec;
    practice.setupFileId = file.id;
    practice.setupEntryId = entry.id;
    resetPracticeState(entry, "setup", file.id);
    practice.open = true;
    document.body.classList.add("practice-open");
    renderPractice();
    window.requestAnimationFrame(() => elements.practiceSetupStartBtn?.focus());
  }

  function closePractice() {
    if (!practice.open) {
      return;
    }

    cancelSpeechSession();
    stopPracticeTimer();
    practice.open = false;
    practice.phase = "setup";
    document.body.classList.remove("practice-open");
    renderPractice();
    setStatus("Ready");
    elements.practiceLaunchBtn?.focus();
  }

  function resetPracticeState(entry, phase = "ready", fileId = practice.fileId || state.fileId) {
    stopPracticeTimer();
    practice.phase = phase;
    practice.fileId = fileId || "";
    practice.entryId = entry?.id || "";
    practice.listenCount = 0;
    practice.listeningNumber = 0;
    practice.answerStartedAt = 0;
    practice.elapsedMs = 0;
    practice.attemptNumber = 0;
    practice.checks = {};
  }

  function setPracticeKind(kind) {
    if (!practice.open || practice.phase !== "setup" || !["random", "selected"].includes(kind)) {
      return;
    }
    practice.kind = kind;
    renderPractice();
  }

  function setPracticeDuration(value) {
    practice.durationSec = clampPracticeDuration(value);
    state.practiceDurationSec = practice.durationSec;
    saveState();
    if (elements.practiceDurationInput) {
      elements.practiceDurationInput.value = String(practice.durationSec);
    }
    renderPracticeDurationButtons();
  }

  function updatePracticeDurationFromInput() {
    const value = Number(elements.practiceDurationInput?.value);
    if (!Number.isFinite(value) || value < 10 || value > 300) {
      return;
    }
    practice.durationSec = Math.round(value);
    state.practiceDurationSec = practice.durationSec;
    saveState();
    renderPracticeDurationButtons();
  }

  function commitPracticeDurationInput() {
    setPracticeDuration(elements.practiceDurationInput?.value);
  }

  function clampPracticeDuration(value) {
    return Math.min(300, Math.max(10, Math.round(Number(value) || 60)));
  }

  function startPracticeFromSetup() {
    if (!practice.open || practice.phase !== "setup") {
      return;
    }

    if (practice.kind === "selected") {
      commitPracticeDurationInput();
    }

    const selection =
      practice.kind === "random"
        ? chooseRandomPracticeEntry(`${practice.setupFileId}:${practice.setupEntryId}`)
        : findPracticeSelection(practice.setupFileId, practice.setupEntryId);
    if (!selection) {
      return;
    }

    activatePracticeEntry(selection.file, selection.entry);
    resetPracticeState(selection.entry, "ready", selection.file.id);
    renderPractice();
    window.requestAnimationFrame(() => elements.practiceListenBtn?.focus());
  }

  function findPracticeSelection(fileId, entryId) {
    const file = data.files.find((item) => item.id === fileId);
    const entry = file?.entries.find((item) => item.id === entryId);
    return file && entry ? { file, entry } : null;
  }

  function getPracticePool() {
    return data.files.flatMap((file) => file.entries.map((entry) => ({ file, entry })));
  }

  function chooseRandomPracticeEntry(excludedKey = "") {
    const pool = getPracticePool();
    const candidates =
      pool.length > 1
        ? pool.filter(({ file, entry }) => `${file.id}:${entry.id}` !== excludedKey)
        : pool;
    if (!candidates.length) {
      return null;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function activatePracticeEntry(file, entry) {
    state.fileId = file.id;
    state.lastFileByTopic[String(file.number)] = file.id;
    state.entryId = entry.id;
    saveState();
    render();
  }

  function retryPractice() {
    if (!practice.open) {
      return;
    }
    cancelSpeechSession();
    resetPracticeState(getPracticeEntry(), "ready", getPracticeFile()?.id);
    renderPractice();
    window.requestAnimationFrame(() => elements.practiceListenBtn?.focus());
  }

  function moveToNextPracticeEntry() {
    if (practice.kind === "random") {
      const currentKey = `${practice.fileId}:${practice.entryId}`;
      const selection = chooseRandomPracticeEntry(currentKey);
      if (!selection) {
        return;
      }
      cancelSpeechSession();
      activatePracticeEntry(selection.file, selection.entry);
      resetPracticeState(selection.entry, "ready", selection.file.id);
      renderPractice();
      window.requestAnimationFrame(() => elements.practiceListenBtn?.focus());
      return;
    }

    const file = getPracticeFile();
    const entries = file?.entries || [];
    const currentIndex = entries.findIndex((entry) => entry.id === practice.entryId);
    if (currentIndex < 0 || currentIndex >= entries.length - 1) {
      return;
    }

    cancelSpeechSession();
    activatePracticeEntry(file, entries[currentIndex + 1]);
    resetPracticeState(entries[currentIndex + 1], "ready", file.id);
    renderPractice();
    window.requestAnimationFrame(() => elements.practiceListenBtn?.focus());
  }

  function getPracticeFile() {
    return data.files.find((file) => file.id === practice.fileId) || getSelectedFile();
  }

  function getPracticeEntry() {
    const entries = getPracticeFile()?.entries || [];
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

    const rawElapsedMs = Math.max(0, Date.now() - practice.answerStartedAt);
    practice.elapsedMs = isTimedPractice()
      ? Math.min(rawElapsedMs, getPracticeTimeLimitMs())
      : rawElapsedMs;
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
      lastPracticeKind: practice.kind,
      lastTimeLimitSec: isTimedPractice() ? practice.durationSec : null,
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
      if (isTimedPractice() && practice.elapsedMs >= getPracticeTimeLimitMs()) {
        finishPracticeAnswer();
        return;
      }
    }
    const displayMs = isTimedPractice()
      ? Math.max(0, getPracticeTimeLimitMs() - practice.elapsedMs)
      : practice.elapsedMs;
    const value = formatPracticeDuration(displayMs, isTimedPractice());
    elements.practiceTimerValue.textContent = value;
    elements.practiceTimer.setAttribute(
      "aria-label",
      isTimedPractice() ? `남은 시간 ${value}` : `답변 시간 ${value}`,
    );
    elements.practiceTimerValue.setAttribute(
      "datetime",
      `PT${Math.max(0, Math.ceil(displayMs / 1000))}S`,
    );
  }

  function isTimedPractice() {
    return practice.kind === "selected";
  }

  function getPracticeTimeLimitMs() {
    return clampPracticeDuration(practice.durationSec) * 1000;
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

    const file = getPracticeFile();
    const entries = file?.entries || [];
    const currentIndex = entries.findIndex((item) => item.id === entry.id);
    if (practice.phase === "setup") {
      elements.practiceMeta.textContent = `전체 ${data.stats.entries}문제 · 현재 선택 ${entry.fileTitle} · Set ${entry.set} · Type ${entry.type}`;
    } else if (practice.kind === "random" && practice.phase !== "review") {
      elements.practiceMeta.textContent = "랜덤 실전 · 문제 비공개";
    } else {
      const kindLabel = practice.kind === "random" ? "랜덤 실전" : "선택 연습";
      elements.practiceMeta.textContent = `${kindLabel} · ${entry.fileTitle} · Set ${entry.set} · Type ${entry.type} · ${currentIndex + 1}/${entries.length}`;
    }
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
    const isSetup = practice.phase === "setup";
    elements.practiceSetupView.hidden = !isSetup;
    elements.practiceSessionView.hidden = isSetup;
    if (isSetup) {
      renderPracticeSetup();
      return;
    }

    const phaseContent = {
      ready: { label: "준비", message: "문제를 들어보세요." },
      listening: {
        label: `${practice.listeningNumber}회차`,
        message: "문제를 듣고 있습니다.",
      },
      between: { label: "1회 청취 완료", message: "한 번 더 듣거나 답변을 시작하세요." },
      answering: {
        label: isTimedPractice() ? `답변 중 · ${practice.durationSec}초` : "답변 중",
        message: "답변하세요.",
      },
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

  function renderPracticeSetup() {
    const selectedFile = data.files.find((file) => file.id === practice.setupFileId);
    const selectedEntry = selectedFile?.entries.find((entry) => entry.id === practice.setupEntryId);
    const isRandom = practice.kind === "random";

    elements.practiceKindButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        button.dataset.practiceKind === practice.kind ? "true" : "false",
      );
    });
    elements.practiceRandomPanel.hidden = !isRandom;
    elements.practiceSelectedPanel.hidden = isRandom;
    elements.practiceRandomSummary.textContent = `${data.stats.entries}개 문제 · 시간 제한 없음`;
    elements.practiceSetupStartBtn.textContent = isRandom ? "랜덤 문제 시작" : "선택 문제 시작";

    if (selectedEntry) {
      elements.practiceSelectedMeta.textContent = `${selectedEntry.fileTitle} · Set ${selectedEntry.set} · Type ${selectedEntry.type}`;
      elements.practiceSelectedQuestion.textContent = selectedEntry.question;
    }
    if (elements.practiceDurationInput && document.activeElement !== elements.practiceDurationInput) {
      elements.practiceDurationInput.value = String(practice.durationSec);
    }
    renderPracticeDurationButtons();
  }

  function renderPracticeDurationButtons() {
    elements.practiceDurationButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        Number(button.dataset.practiceDuration) === practice.durationSec ? "true" : "false",
      );
    });
  }

  function renderPracticeReview(entry, currentIndex, entryCount) {
    const details = getCategoryDetails(entry.category, entry);
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

    elements.practiceResultTime.textContent = isTimedPractice()
      ? `${formatPracticeDuration(practice.elapsedMs)} / ${formatPracticeDuration(getPracticeTimeLimitMs())}`
      : formatPracticeDuration(practice.elapsedMs);
    elements.practiceAttemptText.textContent = `${practice.kind === "random" ? "랜덤" : "선택"} · ${practice.attemptNumber}회차 완료`;
    elements.practiceNextBtn.textContent = practice.kind === "random" ? "다른 랜덤" : "다음 문제";
    elements.practiceNextBtn.disabled =
      practice.kind === "random" ? getPracticePool().length <= 1 : currentIndex >= entryCount - 1;
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

  function formatPracticeDuration(milliseconds, roundUp = false) {
    const secondsValue = Number(milliseconds || 0) / 1000;
    const totalSeconds = Math.max(0, roundUp ? Math.ceil(secondsValue) : Math.floor(secondsValue));
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
    const categoryDetails = getCategoryDetails(entry.category, entry);
    elements.questionCategory.textContent = categoryDetails.label;
    elements.questionCategory.setAttribute(
      "aria-label",
      `문제 유형: ${categoryDetails.title}.${categoryDetails.rpCode ? ` ${categoryDetails.rpCode}.` : ""} 답변 흐름: ${categoryDetails.flow}`,
    );
    elements.questionRpBadge.textContent = categoryDetails.rpCode;
    elements.questionRpBadge.hidden = !categoryDetails.rpCode;
    elements.categoryTooltipTitle.textContent = categoryDetails.title;
    elements.categoryTooltipRp.textContent = categoryDetails.rpCode;
    elements.categoryTooltipRp.hidden = !categoryDetails.rpCode;
    elements.categoryTooltipSummary.textContent = categoryDetails.summary;
    elements.categoryTooltipSignals.textContent = categoryDetails.signals.join(" · ");
    elements.categoryTooltipFlow.textContent = categoryDetails.flow;
    renderCategoryList(elements.categoryTooltipStrategy, categoryDetails.steps);
    renderCategoryList(elements.categoryTooltipCautions, categoryDetails.cautions);
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

  function renderCategoryList(container, items) {
    container.innerHTML = "";
    items.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      container.append(item);
    });
  }

  function getCategoryDetails(value, entry) {
    const normalizedValue = String(value || "").trim();
    const categories = normalizedValue
      .split(/\s*\+\s*/)
      .map((category) => category.trim())
      .filter(Boolean);

    if (!categories.length) {
      return {
        label: "문제 유형",
        title: "문제 유형",
        summary: "질문의 핵심을 먼저 답하고 필요한 이유와 디테일만 붙입니다.",
        signals: ["질문의 핵심 동사와 시제 확인"],
        flow: "핵심 답변 → 이유/디테일 → 마무리",
        steps: ["질문에 직접 답한다.", "이유와 관련 디테일을 붙인다.", "짧게 결론을 낸다."],
        cautions: ["질문과 관계없는 외운 답변으로 길게 벗어나지 않는다."],
        rpCode: "",
      };
    }

    const rpCode = getRolePlayCode(entry);
    const exactGuide = categoryGuides.get(normalizedValue);
    const guides = categories.map(
      (category) => categoryGuides.get(category) || getFallbackGuide(category),
    );
    const guide =
      rolePlayGuides.get(rpCode) || exactGuide || mergeCategoryGuides(categories, guides);

    return {
      label: normalizedValue || categories.join(" + "),
      title: `${categories.join(" + ")} · ${
        rpCode ? guide.korean : exactGuide?.korean || guides.map((item) => item.korean).join(" + ")
      }`,
      summary: guide.summary,
      signals: guide.signals,
      flow: guide.flow,
      steps: guide.steps,
      cautions: guide.cautions,
      rpCode,
    };
  }

  function getFallbackGuide(category) {
    return {
      korean: category,
      summary: "질문의 핵심을 먼저 답하고 필요한 이유와 디테일만 붙입니다.",
      signals: ["질문의 핵심 동사와 시제 확인"],
      flow: "핵심 답변 → 이유/디테일 → 마무리",
      steps: ["질문에 직접 답한다.", "이유와 관련 디테일을 붙인다.", "짧게 결론을 낸다."],
      cautions: ["질문과 관계없는 외운 답변으로 길게 벗어나지 않는다."],
    };
  }

  function mergeCategoryGuides(categories, guides) {
    if (guides.length === 1) {
      return guides[0];
    }

    return {
      summary: guides.map((guide) => guide.summary).join(" "),
      signals: [...new Set(guides.flatMap((guide) => guide.signals))],
      flow: guides.map((guide, index) => `${categories[index]}: ${guide.flow}`).join("\n"),
      steps: guides.flatMap((guide, index) =>
        guide.steps.map((step) => `${categories[index]} · ${step}`),
      ),
      cautions: [...new Set(guides.flatMap((guide) => guide.cautions))],
    };
  }

  function getRolePlayCode(entry) {
    if (!entry) {
      return "";
    }

    const type = Number(entry.type);
    const category = String(entry.category || "");
    if (category.includes("Role Play") && (type === 5 || type === 6)) {
      return "RP11";
    }
    if (category.includes("Role Play") && type === 7) {
      return "RP12";
    }
    if (type !== 8) {
      return "";
    }

    const file = data.files.find(
      (candidate) =>
        candidate.id === entry.fileId || candidate.entries.some((item) => item.id === entry.id),
    );
    const precedingRolePlay = file?.entries.find(
      (item) =>
        String(item.set) === String(entry.set) &&
        Number(item.type) === 7 &&
        String(item.category || "").includes("Role Play"),
    );
    return precedingRolePlay ? "RP13" : "";
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
