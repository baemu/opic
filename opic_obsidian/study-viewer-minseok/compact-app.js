(function () {
  "use strict";

  const data = window.OPIC_STUDY_DATA;
  const storageKey = "opic-compact-study-viewer-minseok";
  const storageVersion = 2;

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
    settingsToggleBtn: document.getElementById("settingsToggleBtn"),
    settingsPanel: document.getElementById("settingsPanel"),
    entryMeta: document.getElementById("entryMeta"),
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
    showQuestionTranslation:
      savedState.storageVersion === storageVersion
        ? Boolean(savedState.showQuestionTranslation)
        : true,
    showTranslations: Boolean(savedState.showTranslations),
    lastFileByTopic: savedState.lastFileByTopic || {},
  };

  let voices = [];
  let sessionId = 0;
  let activeButton = null;
  let openTranslations = new Set();
  const topicLabels = new Map([
    [1, "Family"],
    [2, "Park"],
    [3, "Beach"],
    [4, "Music"],
    [5, "Inst"],
    [6, "Cafe"],
    [7, "Gym"],
    [8, "Vacation"],
  ]);

  function readSavedState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  }

  function saveState() {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        storageVersion,
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
      const wrapper = document.createElement("div");
      wrapper.className = [
        "sentence-card",
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
        <span class="sentence-index">${index + 1}</span>
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
        "MD 수정 후 study-viewer-minseok/OPIc-study-minseok.bat을 더블클릭하면 업데이트된 화면이 자동으로 열립니다.",
      );
      return;
    }

    if (window.location.hostname === "baemu.github.io") {
      setStatus(
        "휴대폰 공개 화면까지 반영하려면 PC에서 study-viewer-minseok/OPIc-publish-minseok.bat을 실행하세요.",
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
