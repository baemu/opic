"use strict";

(() => {
  const data = window.TOEIC_SPEAKING_DATA;
  const storageKey = "toeic-speaking-study-viewer";
  const opicStorageKey = "opic-compact-study-viewer";
  const elements = {
    appStats: document.getElementById("appStats"),
    toggleTranslationsBtn: document.getElementById("toggleTranslationsBtn"),
    settingsToggleBtn: document.getElementById("settingsToggleBtn"),
    settingsPanel: document.getElementById("settingsPanel"),
    rateInput: document.getElementById("rateInput"),
    rateValue: document.getElementById("rateValue"),
    volumeInput: document.getElementById("volumeInput"),
    volumeValue: document.getElementById("volumeValue"),
    voiceSelect: document.getElementById("voiceSelect"),
    studyNav: document.getElementById("studyNav"),
    partTabs: document.getElementById("partTabs"),
    viewTabs: Array.from(document.querySelectorAll("[data-view]")),
    referenceTabBtn: document.getElementById("referenceTabBtn"),
    strategyTabBtn: document.getElementById("strategyTabBtn"),
    filterBar: document.getElementById("filterBar"),
    searchInput: document.getElementById("searchInput"),
    sectionSelect: document.getElementById("sectionSelect"),
    resultCount: document.getElementById("resultCount"),
    randomBtn: document.getElementById("randomBtn"),
    listView: document.getElementById("listView"),
    sentenceGrid: document.getElementById("sentenceGrid"),
    emptyState: document.getElementById("emptyState"),
    memorizeView: document.getElementById("memorizeView"),
    memoryCard: document.getElementById("memoryCard"),
    memoryNumber: document.getElementById("memoryNumber"),
    memoryLabel: document.getElementById("memoryLabel"),
    memorySection: document.getElementById("memorySection"),
    memoryEnglish: document.getElementById("memoryEnglish"),
    memoryKorean: document.getElementById("memoryKorean"),
    previousBtn: document.getElementById("previousBtn"),
    playMemoryBtn: document.getElementById("playMemoryBtn"),
    randomMemoryBtn: document.getElementById("randomMemoryBtn"),
    nextBtn: document.getElementById("nextBtn"),
    memoryProgress: document.getElementById("memoryProgress"),
    memoryPosition: document.getElementById("memoryPosition"),
    referenceView: document.getElementById("referenceView"),
    referenceSets: document.getElementById("referenceSets"),
    comparisonCard: document.getElementById("comparisonCard"),
    strategyView: document.getElementById("strategyView"),
    strategyGuideTabs: document.getElementById("strategyGuideTabs"),
    strategyTabs: document.getElementById("strategyTabs"),
    strategyContent: document.getElementById("strategyContent"),
    statusToast: document.getElementById("statusToast"),
  };

  const saved = readJson(storageKey);
  const opicSettings = readJson(opicStorageKey);
  const strategyGuides = Array.isArray(data?.strategyGuide?.guides)
    ? data.strategyGuide.guides
    : [];
  const defaultStrategyGuideId = strategyGuides.some(
    (guide) => guide.id === data?.strategyGuide?.defaultGuideId,
  )
    ? data.strategyGuide.defaultGuideId
    : strategyGuides[0]?.id || "";
  const initialStrategyGuideId = strategyGuides.some(
    (guide) => guide.id === saved.strategyGuideId,
  )
    ? saved.strategyGuideId
    : defaultStrategyGuideId;
  const savedStrategySections =
    saved.strategySectionByGuide && typeof saved.strategySectionByGuide === "object"
      ? saved.strategySectionByGuide
      : {};
  const initialStrategySections = Object.fromEntries(
    strategyGuides.map((guide) => {
      const savedSectionId =
        savedStrategySections[guide.id] ||
        (guide.id === "ih-review" ? saved.strategySectionId : "");
      const sectionId = guide.sections?.some((section) => section.id === savedSectionId)
        ? savedSectionId
        : guide.sections?.[0]?.id || "";
      return [guide.id, sectionId];
    }),
  );
  const state = {
    partId: data?.parts?.some((part) => part.id === saved.partId)
      ? saved.partId
      : data?.parts?.[0]?.id || "part2",
    view: ["list", "memorize", "reference", "strategy"].includes(saved.view)
      ? saved.view
      : "list",
    strategyGuideId: initialStrategyGuideId,
    strategySectionByGuide: initialStrategySections,
    section: "all",
    query: "",
    showTranslations: saved.showTranslations !== false,
    rate: toNumber(saved.rate, toNumber(opicSettings.rate, 0.9)),
    volume: toNumber(saved.volume, toNumber(opicSettings.volume, 1)),
    voiceURI: String(saved.voiceURI || opicSettings.voiceURI || ""),
    memoryNumberByPart:
      saved.memoryNumberByPart && typeof saved.memoryNumberByPart === "object"
        ? saved.memoryNumberByPart
        : {},
  };

  let voices = [];
  let speechSession = 0;
  let activeSpeechElement = null;
  let toastTimer = null;

  function init() {
    if (
      !data ||
      !Array.isArray(data.parts) ||
      data.parts.length !== 4 ||
      !data.strategyGuide ||
      !Array.isArray(data.strategyGuide.guides) ||
      !data.strategyGuide.guides.length
    ) {
      document.body.innerHTML =
        '<main class="load-error"><h1>토익스피킹 데이터를 찾을 수 없습니다.</h1><p>toss/build-data.mjs를 다시 실행해 주세요.</p></main>';
      return;
    }

    ensureViewIsAvailable();
    bindEvents();
    refreshVoices();
    render();
    registerServiceWorker();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
    }
    window.addEventListener("beforeunload", cancelSpeech);
  }

  function bindEvents() {
    elements.partTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-part-id]");
      if (!button) {
        return;
      }
      state.partId = button.dataset.partId;
      state.section = "all";
      state.query = "";
      elements.searchInput.value = "";
      ensureViewIsAvailable();
      cancelSpeech();
      saveState();
      render();
    });

    elements.viewTabs.forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    elements.searchInput.addEventListener("input", () => {
      state.query = elements.searchInput.value;
      renderContent();
    });

    elements.sectionSelect.addEventListener("change", () => {
      state.section = elements.sectionSelect.value;
      ensureMemorySelection();
      renderContent();
    });

    elements.randomBtn.addEventListener("click", showRandomEntry);
    elements.randomMemoryBtn.addEventListener("click", selectRandomMemory);
    elements.previousBtn.addEventListener("click", () => moveMemory(-1));
    elements.nextBtn.addEventListener("click", () => moveMemory(1));
    elements.playMemoryBtn.addEventListener("click", () => {
      const entry = getMemoryEntry();
      if (entry) {
        speakLines(entry.english, elements.playMemoryBtn);
      }
    });
    elements.memoryEnglish.addEventListener("click", () => {
      if (hasSelectedText()) {
        return;
      }
      const entry = getMemoryEntry();
      if (entry) {
        speakLines(entry.english, elements.memoryEnglish);
      }
    });
    elements.memoryEnglish.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const entry = getMemoryEntry();
        if (entry) {
          speakLines(entry.english, elements.memoryEnglish);
        }
      }
    });

    elements.sentenceGrid.addEventListener("click", handleSpeakRequest);
    elements.sentenceGrid.addEventListener("keydown", handleSpeakKeydown);
    elements.referenceView.addEventListener("click", handleSpeakRequest);
    elements.referenceView.addEventListener("keydown", handleSpeakKeydown);
    elements.strategyGuideTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-strategy-guide]");
      if (!button || button.dataset.strategyGuide === state.strategyGuideId) {
        return;
      }
      state.strategyGuideId = button.dataset.strategyGuide;
      cancelSpeech();
      saveState();
      renderStrategy();
      elements.strategyContent.scrollTop = 0;
      elements.strategyView.scrollTop = 0;
    });
    elements.strategyTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-strategy-section]");
      if (!button) {
        return;
      }
      const guide = getCurrentStrategyGuide();
      if (!guide) {
        return;
      }
      state.strategySectionByGuide[guide.id] = button.dataset.strategySection;
      cancelSpeech();
      saveState();
      renderStrategy();
      elements.strategyContent.scrollTop = 0;
      elements.strategyView.scrollTop = 0;
    });
    elements.strategyContent.addEventListener("click", handleStrategyAction);
    elements.strategyContent.addEventListener("keydown", handleSpeakKeydown);

    elements.toggleTranslationsBtn.addEventListener("click", () => {
      state.showTranslations = !state.showTranslations;
      saveState();
      renderTranslationState();
    });

    elements.settingsToggleBtn.addEventListener("click", () => {
      const open = elements.settingsPanel.hidden;
      elements.settingsPanel.hidden = !open;
      elements.settingsToggleBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (event) => {
      if (
        !elements.settingsPanel.hidden &&
        !elements.settingsPanel.contains(event.target) &&
        !elements.settingsToggleBtn.contains(event.target)
      ) {
        elements.settingsPanel.hidden = true;
        elements.settingsToggleBtn.setAttribute("aria-expanded", "false");
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
    elements.voiceSelect.addEventListener("change", () => {
      state.voiceURI = elements.voiceSelect.value;
      saveState();
    });

    window.addEventListener("keydown", (event) => {
      if (state.view !== "memorize" || event.target.matches("input, select, button")) {
        return;
      }
      if (event.key === "ArrowLeft") {
        moveMemory(-1);
      } else if (event.key === "ArrowRight") {
        moveMemory(1);
      }
    });
  }

  function render() {
    const part = getCurrentPart();
    elements.appStats.textContent = `${data.stats.entries}개 카드 · Part 2·3·4·5`;
    elements.partTabs.innerHTML = data.parts
      .map(
        (item) => `
          <button type="button" role="tab" data-part-id="${item.id}" aria-selected="${item.id === state.partId}">
            <strong>Part ${item.number}</strong>
            <span>${item.entries.length}</span>
          </button>`,
      )
      .join("");
    const strategyMode = state.view === "strategy";
    elements.partTabs.hidden = strategyMode;
    elements.studyNav.classList.toggle("is-strategy-mode", strategyMode);

    const hasReferences = Boolean(part.referenceSets?.length || part.comparisonFormula);
    elements.referenceTabBtn.hidden = !hasReferences;
    elements.viewTabs.forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.view === state.view));
    });

    renderFilters(part);
    renderSettings();
    renderTranslationState();
    renderContent();
  }

  function renderFilters(part) {
    const sections = [...new Set(part.entries.map((entry) => entry.section))];
    if (!sections.includes(state.section)) {
      state.section = "all";
    }
    elements.sectionSelect.innerHTML = [
      '<option value="all">전체 분류</option>',
      ...sections.map(
        (section) =>
          `<option value="${escapeHtml(section)}"${state.section === section ? " selected" : ""}>${escapeHtml(section)}</option>`,
      ),
    ].join("");
  }

  function renderSettings() {
    elements.rateInput.value = String(state.rate);
    elements.rateValue.textContent = `${state.rate.toFixed(2)}x`;
    elements.volumeInput.value = String(state.volume);
    elements.volumeValue.textContent = `${Math.round(state.volume * 100)}%`;
  }

  function renderTranslationState() {
    document.body.classList.toggle("translations-hidden", !state.showTranslations);
    elements.toggleTranslationsBtn.textContent = state.showTranslations ? "번역 숨기기" : "번역 보기";
    elements.toggleTranslationsBtn.setAttribute("aria-pressed", String(state.showTranslations));
  }

  function renderContent() {
    const entries = getFilteredEntries();
    elements.filterBar.hidden = ["reference", "strategy"].includes(state.view);
    elements.listView.hidden = state.view !== "list";
    elements.memorizeView.hidden = state.view !== "memorize";
    elements.referenceView.hidden = state.view !== "reference";
    elements.strategyView.hidden = state.view !== "strategy";
    elements.resultCount.textContent = `${entries.length} / ${getCurrentPart().entries.length}`;

    if (state.view === "list") {
      renderList(entries);
    } else if (state.view === "memorize") {
      renderMemory(entries);
    } else if (state.view === "reference") {
      renderReferences();
    } else {
      renderStrategy();
    }
  }

  function renderList(entries) {
    elements.emptyState.hidden = entries.length > 0;
    elements.sentenceGrid.innerHTML = entries
      .map(
        (entry) => `
          <article class="sentence-card">
            <header>
              <span class="entry-number">${entry.number}</span>
              <div>
                <small>${escapeHtml(entry.section)}</small>
                <h2>${escapeHtml(entry.label)}</h2>
              </div>
              <button class="play-icon" type="button" data-entry-number="${entry.number}" aria-label="${entry.number}번 듣기" title="듣기">▶</button>
            </header>
            <div class="english-block" data-entry-number="${entry.number}" role="button" tabindex="0" aria-label="${entry.number}번 영어 듣기">
              ${entry.english.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
            </div>
            <div class="korean-block">
              ${entry.korean.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
            </div>
          </article>`,
      )
      .join("");
  }

  function renderMemory(entries) {
    if (!entries.length) {
      elements.memoryCard.hidden = true;
      return;
    }
    elements.memoryCard.hidden = false;
    ensureMemorySelection(entries);
    const entry = getMemoryEntry(entries);
    const position = entries.findIndex((item) => item.number === entry.number);
    elements.memoryNumber.textContent = entry.number;
    elements.memoryLabel.textContent = entry.label;
    elements.memorySection.textContent = entry.section;
    elements.memoryEnglish.innerHTML = entry.english.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    elements.memoryKorean.innerHTML = entry.korean.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    elements.memoryPosition.textContent = `${position + 1} / ${entries.length}`;
    elements.memoryProgress.style.width = `${((position + 1) / entries.length) * 100}%`;
    elements.previousBtn.disabled = entries.length < 2;
    elements.nextBtn.disabled = entries.length < 2;
    elements.randomMemoryBtn.disabled = entries.length < 2;
  }

  function renderReferences() {
    const part = getCurrentPart();
    elements.referenceSets.innerHTML = (part.referenceSets || [])
      .map(
        (set) => `
          <article class="reference-card">
            <header><small>FEATURE WORDS</small><h2>${escapeHtml(set.title)}</h2></header>
            <div class="reference-items">
              ${set.items
                .map(
                  (item) => `
                    <button type="button" data-speak-text="${escapeHtml(item.english)}">
                      <strong>${escapeHtml(item.english)}</strong>
                      <span>${escapeHtml(item.korean)}</span>
                    </button>`,
                )
                .join("")}
            </div>
            <div class="reference-examples">
              ${set.examples
                .map(
                  (example) =>
                    `<p data-speak-text="${escapeHtml(example)}" role="button" tabindex="0">${escapeHtml(example)}</p>`,
                )
                .join("")}
            </div>
          </article>`,
      )
      .join("");

    const formula = part.comparisonFormula;
    elements.comparisonCard.hidden = !formula;
    elements.comparisonCard.innerHTML = formula
      ? `
          <header><small>COMPARISON</small><h2>${escapeHtml(formula.title)}</h2></header>
          <ol>
            ${formula.steps
              .map(
                (step) => `
                  <li>
                    <span>${step.number}</span>
                    <div>
                      <p data-speak-text="${escapeHtml(step.english)}" role="button" tabindex="0">${escapeHtml(step.english)}</p>
                      <small>${escapeHtml(step.korean)}</small>
                    </div>
                  </li>`,
              )
              .join("")}
          </ol>
          <div class="formula-expressions">
            ${formula.expressions
              .map(
                (line) =>
                  `<button type="button" data-speak-text="${escapeHtml(line)}">${escapeHtml(line)}</button>`,
              )
              .join("")}
          </div>`
      : "";
  }

  function renderStrategy() {
    const strategyGuide = data.strategyGuide;
    const guide = getCurrentStrategyGuide();
    if (!guide) {
      return;
    }
    state.strategyGuideId = guide.id;
    const savedSectionId = state.strategySectionByGuide[guide.id];
    const section =
      guide.sections.find((item) => item.id === savedSectionId) || guide.sections[0];
    state.strategySectionByGuide[guide.id] = section.id;

    elements.strategyGuideTabs.innerHTML = strategyGuide.guides
      .map(
        (item) => `
          <button
            type="button"
            role="tab"
            data-strategy-guide="${escapeHtml(item.id)}"
            aria-selected="${item.id === guide.id}"
          >${escapeHtml(item.tab)}</button>`,
      )
      .join("");

    elements.strategyTabs.innerHTML = guide.sections
      .map(
        (item) => `
          <button
            type="button"
            role="tab"
            data-strategy-section="${escapeHtml(item.id)}"
            aria-selected="${item.id === section.id}"
          >${escapeHtml(item.tab)}</button>`,
      )
      .join("");
    elements.strategyTabs.style.setProperty("--strategy-tab-count", String(guide.sections.length));
    elements.strategyTabs.classList.toggle("is-video-guide", guide.id === "clock-rabbit");

    const facts = (section.facts || [])
      .map(
        (fact) => `
          <div class="strategy-fact">
            <span>${escapeHtml(fact.label)}</span>
            <strong>${escapeHtml(fact.value)}</strong>
          </div>`,
      )
      .join("");

    const timings = section.timings?.length
      ? `
        <section class="strategy-block strategy-timing-block">
          <div class="strategy-block-heading">
            <span>OFFICIAL FORMAT</span>
            <h2>공식 준비·답변 시간</h2>
          </div>
          <div class="strategy-timing-table" role="table" aria-label="토익스피킹 공식 시간">
            <div class="strategy-timing-row strategy-timing-head" role="row">
              <span role="columnheader">문항</span>
              <span role="columnheader">유형</span>
              <span role="columnheader">준비</span>
              <span role="columnheader">답변</span>
            </div>
            ${section.timings
              .map(
                (timing) => `
                  <div class="strategy-timing-row" role="row">
                    <strong role="cell">${escapeHtml(timing.questions)}</strong>
                    <span role="cell">${escapeHtml(timing.task)}</span>
                    <span role="cell">${escapeHtml(timing.prep)}</span>
                    <span role="cell">${escapeHtml(timing.response)}</span>
                  </div>`,
              )
              .join("")}
          </div>
        </section>`
      : "";

    const checklistBlocks = (section.checklists || [])
      .map(
        (checklist) => `
          <section class="strategy-block strategy-checklist">
            <div class="strategy-block-heading">
              <span>PREP CHECK</span>
              <h2>${escapeHtml(checklist.title)}</h2>
            </div>
            <ul>
              ${checklist.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </section>`,
      )
      .join("");

    const flow = section.flow?.length
      ? `
        <section class="strategy-block strategy-flow-block">
          <div class="strategy-block-heading">
            <span>ANSWER FLOW</span>
            <h2>${escapeHtml(section.flowTitle || "답변 순서")}</h2>
          </div>
          <ol class="strategy-flow">
            ${section.flow
              .map(
                (step) => `
                  <li>
                    <span>${escapeHtml(step.number)}</span>
                    <div><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.description)}</p></div>
                  </li>`,
              )
              .join("")}
          </ol>
        </section>`
      : "";

    const templates = section.templates?.length
      ? `
        <section class="strategy-block strategy-template-block">
          <div class="strategy-block-heading">
            <span>SPEAKING TEMPLATE</span>
            <h2>${escapeHtml(section.templateTitle || "말하기 예시")}</h2>
          </div>
          <div class="strategy-template-grid">
            ${section.templates.map(renderStrategyTemplate).join("")}
          </div>
        </section>`
      : "";

    const reasonGroups = section.reasonGroups?.length
      ? `
        <section class="strategy-block strategy-reason-block">
          <div class="strategy-block-heading">
            <span>REASON BANK</span>
            <h2>형용사에서 근거까지 바로 연결하기</h2>
          </div>
          <div class="strategy-reason-grid">
            ${section.reasonGroups.map(renderReasonGroup).join("")}
          </div>
        </section>`
      : "";

    const warnings = section.warnings?.length
      ? `
        <aside class="strategy-warning">
          <strong>주의할 점</strong>
          <ul>${section.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>
        </aside>`
      : "";

    const chapterUrl = getVideoChapterUrl(guide, section);
    const chapterLink = chapterUrl
      ? `<a class="strategy-video-link" href="${escapeHtml(chapterUrl)}" target="_blank" rel="noreferrer">▶ 영상에서 보기 · ${escapeHtml(section.chapter.label)}</a>`
      : "";

    elements.strategyContent.innerHTML = `
      <header class="strategy-heading">
        <div class="strategy-title-line">
          <span class="strategy-kicker">${escapeHtml(section.kicker)}</span>
          <div class="strategy-heading-actions">
            <span class="strategy-target">목표 ${escapeHtml(guide.target)}</span>
            ${chapterLink}
          </div>
        </div>
        <h1>${escapeHtml(section.title)}</h1>
        <p>${escapeHtml(section.lead)}</p>
      </header>
      ${facts ? `<div class="strategy-facts">${facts}</div>` : ""}
      ${timings}
      ${(checklistBlocks || flow) ? `<div class="strategy-two-column">${checklistBlocks}${flow}</div>` : ""}
      ${templates}
      ${reasonGroups}
      ${warnings}
      <footer class="strategy-sources">
        <p>${escapeHtml(guide.disclaimer)}</p>
        <div>
          ${guide.sources
            .map(
              (source) =>
                `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)}</a>`,
            )
            .join("")}
        </div>
      </footer>`;
  }

  function renderStrategyTemplate(template) {
    return `
      <article class="strategy-template-card">
        <header>
          <div><strong>${escapeHtml(template.title)}</strong>${template.caption ? `<span>${escapeHtml(template.caption)}</span>` : ""}</div>
          <div class="strategy-template-actions">
            <button type="button" data-strategy-copy="${escapeHtml(template.id)}" aria-label="${escapeHtml(template.title)} 복사">복사</button>
            <button type="button" data-strategy-speak="${escapeHtml(template.id)}" aria-label="${escapeHtml(template.title)} 듣기">▶ 듣기</button>
          </div>
        </header>
        <div class="strategy-template-english" data-strategy-speak="${escapeHtml(template.id)}" role="button" tabindex="0" aria-label="${escapeHtml(template.title)} 영어 듣기">
          ${template.english.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        </div>
        <div class="strategy-template-korean">
          ${template.korean.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        </div>
      </article>`;
  }

  function renderReasonGroup(group) {
    return `
      <article class="strategy-reason-card">
        <header>
          <div><strong>${escapeHtml(group.keywords)}</strong><span>${escapeHtml(group.useWhen)}</span></div>
          <div class="strategy-template-actions">
            <button type="button" data-strategy-copy="${escapeHtml(group.id)}" aria-label="${escapeHtml(group.keywords)} 문장 복사">복사</button>
            <button type="button" data-strategy-speak="${escapeHtml(group.id)}" aria-label="${escapeHtml(group.keywords)} 문장 듣기">▶</button>
          </div>
        </header>
        <div class="strategy-reason-english" data-strategy-speak="${escapeHtml(group.id)}" role="button" tabindex="0" aria-label="${escapeHtml(group.keywords)} 영어 듣기">
          ${group.english.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        </div>
        <p class="strategy-reason-korean">${escapeHtml(group.korean)}</p>
      </article>`;
  }

  function setView(view) {
    if (!["list", "memorize", "reference", "strategy"].includes(view)) {
      return;
    }
    if (view === "reference" && !getCurrentPart().referenceSets?.length) {
      return;
    }
    state.view = view;
    cancelSpeech();
    saveState();
    render();
  }

  function showRandomEntry() {
    const entries = getFilteredEntries();
    if (!entries.length) {
      setStatus("선택할 문장이 없습니다.");
      return;
    }
    state.view = "memorize";
    state.memoryNumberByPart[state.partId] = pickRandom(entries).number;
    saveState();
    render();
  }

  function selectRandomMemory() {
    const entries = getFilteredEntries();
    if (entries.length < 2) {
      return;
    }
    const current = getMemoryEntry(entries);
    const candidates = entries.filter((entry) => entry.number !== current?.number);
    state.memoryNumberByPart[state.partId] = pickRandom(candidates).number;
    cancelSpeech();
    saveState();
    renderMemory(entries);
  }

  function moveMemory(direction) {
    const entries = getFilteredEntries();
    if (entries.length < 2) {
      return;
    }
    const current = getMemoryEntry(entries);
    const index = entries.findIndex((entry) => entry.number === current.number);
    const nextIndex = (index + direction + entries.length) % entries.length;
    state.memoryNumberByPart[state.partId] = entries[nextIndex].number;
    cancelSpeech();
    saveState();
    renderMemory(entries);
  }

  async function handleStrategyAction(event) {
    const copyTarget = event.target.closest("[data-strategy-copy]");
    if (copyTarget) {
      const item = getStrategySpeechItem(copyTarget.dataset.strategyCopy);
      if (item) {
        await copyText(item.english.join("\n"));
      }
      return;
    }

    const speakTarget = event.target.closest("[data-strategy-speak]");
    if (speakTarget && !hasSelectedText()) {
      const item = getStrategySpeechItem(speakTarget.dataset.strategySpeak);
      if (item) {
        speakLines(item.english, speakTarget);
      }
    }
  }

  function handleSpeakRequest(event) {
    const strategyTarget = event.target.closest("[data-strategy-speak]");
    if (strategyTarget) {
      if (!hasSelectedText()) {
        const item = getStrategySpeechItem(strategyTarget.dataset.strategySpeak);
        if (item) {
          speakLines(item.english, strategyTarget);
        }
      }
      return;
    }
    const textTarget = event.target.closest("[data-speak-text]");
    if (textTarget) {
      if (!hasSelectedText()) {
        speakLines([textTarget.dataset.speakText], textTarget);
      }
      return;
    }
    const entryTarget = event.target.closest("[data-entry-number]");
    if (entryTarget && !hasSelectedText()) {
      const entry = getCurrentPart().entries.find(
        (item) => item.number === Number(entryTarget.dataset.entryNumber),
      );
      if (entry) {
        speakLines(entry.english, entryTarget);
      }
    }
  }

  function handleSpeakKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const target = event.target.closest(
      "[data-speak-text], [data-entry-number], [data-strategy-speak]",
    );
    if (!target) {
      return;
    }
    event.preventDefault();
    handleSpeakRequest({ target });
  }

  function getStrategySpeechItem(id) {
    const guide = getCurrentStrategyGuide();
    const section = guide?.sections.find(
      (item) => item.id === state.strategySectionByGuide[guide.id],
    );
    if (!section) {
      return null;
    }
    return [...(section.templates || []), ...(section.reasonGroups || [])].find(
      (item) => item.id === id,
    );
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("영어 문장을 복사했습니다.");
      return;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      setStatus(copied ? "영어 문장을 복사했습니다." : "복사하지 못했습니다.");
    }
  }

  function speakLines(lines, activeElement) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setStatus("이 브라우저는 영어 음성을 지원하지 않습니다.");
      return;
    }
    const queue = lines.map((line) => line.trim()).filter(Boolean);
    if (!queue.length) {
      return;
    }

    cancelSpeech();
    const session = ++speechSession;
    activeSpeechElement = activeElement;
    activeSpeechElement?.classList.add("is-playing");

    const playNext = (index) => {
      if (session !== speechSession) {
        return;
      }
      if (index >= queue.length) {
        clearActiveSpeech();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(queue[index]);
      utterance.lang = "en-US";
      utterance.rate = state.rate;
      utterance.volume = state.volume;
      utterance.voice = voices.find((voice) => voice.voiceURI === state.voiceURI) || null;
      utterance.onend = () => playNext(index + 1);
      utterance.onerror = (event) => {
        if (["canceled", "interrupted"].includes(event.error) || session !== speechSession) {
          return;
        }
        clearActiveSpeech();
        setStatus("영어 음성을 재생하지 못했습니다.");
      };
      window.speechSynthesis.speak(utterance);
    };

    playNext(0);
  }

  function cancelSpeech() {
    speechSession += 1;
    window.speechSynthesis?.cancel();
    clearActiveSpeech();
  }

  function clearActiveSpeech() {
    activeSpeechElement?.classList.remove("is-playing");
    activeSpeechElement = null;
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
      .sort((a, b) => Number(b.lang === "en-US") - Number(a.lang === "en-US"));
    elements.voiceSelect.disabled = voices.length === 0;
    elements.voiceSelect.innerHTML = voices.length
      ? voices
          .map(
            (voice) =>
              `<option value="${escapeHtml(voice.voiceURI)}">${escapeHtml(voice.name)} (${escapeHtml(voice.lang)})</option>`,
          )
          .join("")
      : '<option value="">영어 음성 불러오는 중...</option>';
    if (!voices.length) {
      return;
    }
    if (!voices.some((voice) => voice.voiceURI === state.voiceURI)) {
      const preferred =
        voices.find((voice) => /Google US English/i.test(voice.name)) ||
        voices.find((voice) => voice.lang === "en-US") ||
        voices[0];
      state.voiceURI = preferred.voiceURI;
      saveState();
    }
    elements.voiceSelect.value = state.voiceURI;
  }

  function ensureViewIsAvailable() {
    if (state.view === "reference" && !getCurrentPart()?.referenceSets?.length) {
      state.view = "list";
    }
  }

  function ensureMemorySelection(entries = getFilteredEntries()) {
    if (!entries.length) {
      return;
    }
    const selected = Number(state.memoryNumberByPart[state.partId]);
    if (!entries.some((entry) => entry.number === selected)) {
      state.memoryNumberByPart[state.partId] = entries[0].number;
    }
  }

  function getCurrentPart() {
    return data.parts.find((part) => part.id === state.partId) || data.parts[0];
  }

  function getCurrentStrategyGuide() {
    return (
      data.strategyGuide.guides.find((guide) => guide.id === state.strategyGuideId) ||
      data.strategyGuide.guides.find(
        (guide) => guide.id === data.strategyGuide.defaultGuideId,
      ) ||
      data.strategyGuide.guides[0] ||
      null
    );
  }

  function getVideoChapterUrl(guide, section) {
    if (!guide?.videoUrl || !Number.isInteger(section?.chapter?.startSeconds)) {
      return "";
    }
    const separator = guide.videoUrl.includes("?") ? "&" : "?";
    return `${guide.videoUrl}${separator}t=${section.chapter.startSeconds}s`;
  }

  function getFilteredEntries() {
    const query = normalizeSearch(state.query);
    return getCurrentPart().entries.filter((entry) => {
      if (state.section !== "all" && entry.section !== state.section) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = normalizeSearch(
        [entry.number, entry.section, entry.label, ...entry.english, ...entry.korean].join(" "),
      );
      return haystack.includes(query);
    });
  }

  function getMemoryEntry(entries = getFilteredEntries()) {
    ensureMemorySelection(entries);
    const number = Number(state.memoryNumberByPart[state.partId]);
    return entries.find((entry) => entry.number === number) || entries[0] || null;
  }

  function saveState() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          partId: state.partId,
          view: state.view,
          strategyGuideId: state.strategyGuideId,
          strategySectionByGuide: state.strategySectionByGuide,
          strategySectionId: state.strategySectionByGuide["ih-review"],
          showTranslations: state.showTranslations,
          rate: state.rate,
          volume: state.volume,
          voiceURI: state.voiceURI,
          memoryNumberByPart: state.memoryNumberByPart,
        }),
      );
    } catch {
      // The study screen remains usable when storage is unavailable.
    }
  }

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  }

  function setStatus(message) {
    clearTimeout(toastTimer);
    elements.statusToast.textContent = message;
    elements.statusToast.hidden = false;
    toastTimer = setTimeout(() => {
      elements.statusToast.hidden = true;
    }, 2200);
  }

  function hasSelectedText() {
    return Boolean(window.getSelection?.().toString().trim());
  }

  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function normalizeSearch(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(window.location.protocol)) {
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("../service-worker.js", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {
          // Online study remains available when service worker registration is blocked.
        });
    });
  }

  init();
})();
