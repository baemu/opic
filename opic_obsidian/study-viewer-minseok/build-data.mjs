import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, "..", "output", "audio", "민석", "영어script");
const outputFile = path.resolve(__dirname, "data.js");
const speakingTranslationsFile = path.resolve(__dirname, "speaking-translations.json");

const speakingTranslationOverrides = new Map(
  Object.entries(JSON.parse(fs.readFileSync(speakingTranslationsFile, "utf8"))),
);

const sourceFiles = [
  { id: "minseok-1", number: 1, fileName: "1. family.md", title: "1. family" },
  { id: "minseok-2", number: 2, fileName: "2.park_english.md", title: "2. park" },
  { id: "minseok-3", number: 3, fileName: "3.beach_english.md", title: "3. beach" },
  { id: "minseok-4", number: 4, fileName: "4.music_english.md", title: "4. music" },
  { id: "minseok-5", number: 5, fileName: "5.instrument_english.md", title: "5. instrument" },
  { id: "minseok-6", number: 6, fileName: "6.cafe_english.md", title: "6. cafe" },
  { id: "minseok-7", number: 7, fileName: "7.gym_english.md", title: "7. gym" },
  { id: "minseok-8", number: 8, fileName: "8.vacation_english.md", title: "8. vacation" },
];

const ownerDataFile = path.resolve(__dirname, "..", "study-viewer", "data.js");
const ownerQuestionsBySlot = new Map();
const ownerQuestionTranslations = new Map();
const ownerNumberByMinseokNumber = new Map([
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 5],
  [7, 7],
  [8, 8],
]);

const cafeQuestionsByType = new Map([
  [
    "1",
    "Do you have a favorite cafe? Describe this cafe by telling me what it looks like.",
  ],
  [
    "2",
    "Discuss some of the things that you do when going to a cafe. What does a typical visit to the cafe consist of?",
  ],
  ["3", "Describe your experience the first time you went to this cafe."],
  ["4", "Explain a memorable, unexpected, or interesting cafe experience."],
  ["5", "Ask me 3 questions about the cafe that I go to."],
  ["6", "You are planning to visit a new cafe. Ask three to four questions."],
  ["7", "You received the wrong order at a cafe. Explain the problem and suggest solutions."],
  ["8", "Discuss a bad or memorable cafe experience you had."],
]);

const cafeQuestionTranslations = new Map([
  [
    cafeQuestionsByType.get("1"),
    "좋아하는 카페가 있나요? 그 카페가 어떻게 생겼는지 묘사해 보세요.",
  ],
  [
    cafeQuestionsByType.get("2"),
    "카페에 갈 때 하는 일들을 말해 보세요. 보통 카페 방문은 어떻게 이루어지나요?",
  ],
  [cafeQuestionsByType.get("3"), "처음 그 카페에 갔던 경험을 묘사해 보세요."],
  [cafeQuestionsByType.get("4"), "기억에 남거나 예상치 못했거나 흥미로웠던 카페 경험을 설명해 보세요."],
  [cafeQuestionsByType.get("5"), "내가 가는 카페에 대해 세 가지 질문을 해 보세요."],
  [cafeQuestionsByType.get("6"), "새 카페에 방문하려고 합니다. 세네 가지 질문을 해 보세요."],
  [
    cafeQuestionsByType.get("7"),
    "카페에서 주문이 잘못 나왔습니다. 문제를 설명하고 해결책을 제안해 보세요.",
  ],
  [cafeQuestionsByType.get("8"), "카페에서 겪었던 안 좋았거나 기억에 남는 경험을 말해 보세요."],
]);

const questionTranslations = new Map([
  [
    "Describe what your home looks like. Explain the floor plan and the number of rooms your home has.",
    "당신의 집이 어떻게 생겼는지 묘사하세요. 집의 구조와 방의 개수를 설명하세요.",
  ],
  [
    "While at home, what is your typical routine? During the week and on the weekends, what types of things do you do?",
    "집에 있을 때 평소 루틴은 무엇인가요? 평일과 주말에는 어떤 일을 하나요?",
  ],
  [
    "Discuss some of the issues that have occurred in your home.",
    "당신의 집에서 있었던 문제 몇 가지를 이야기하세요.",
  ],
  [
    "Select one of the problems that happened at your house and describe what occurred and how you solved it.",
    "집에서 있었던 문제 하나를 골라 무슨 일이 있었고 어떻게 해결했는지 설명하세요.",
  ],
  [
    "Ask three to four additional questions about the other person's home.",
    "상대방의 집에 대해 추가 질문을 서너 개 해 보세요.",
  ],
  [
    "Pretend that you want to buy new furniture for your house. Explain to a salesperson what you are looking for.",
    "집에 새 가구를 사고 싶다고 가정하세요. 판매원에게 어떤 것을 찾고 있는지 설명하세요.",
  ],
  [
    "Call the store and explain the problem with the furniture that you bought.",
    "가게에 전화해서 당신이 산 가구의 문제를 설명하세요.",
  ],
  [
    "Talk about a problem with something you purchased for your house and how you solved it.",
    "집을 위해 산 물건에 문제가 있었던 일과 그것을 어떻게 해결했는지 이야기하세요.",
  ],
  [
    "What are the various responsibilities in your home? Identify who is responsible for what tasks.",
    "집에서 맡는 여러 책임은 무엇인가요? 누가 어떤 일을 맡는지 말하세요.",
  ],
  ["How do you traditionally handle your responsibilities?", "보통 당신의 책임을 어떻게 처리하나요?"],
  [
    "As a child, discuss what responsibilities you had while you were at home.",
    "어릴 때 집에서 어떤 책임이 있었는지 이야기하세요.",
  ],
  [
    "Recall a specific instance as a child when you were asked to do a task and you did not do it.",
    "어릴 때 어떤 일을 하라고 부탁받았지만 하지 않았던 특정한 일을 떠올려 이야기하세요.",
  ],
  [
    "Ask your family members several questions to decide the best date and time to invite another family for lunch.",
    "다른 가족을 점심에 초대할 가장 좋은 날짜와 시간을 정하기 위해 가족들에게 여러 질문을 하세요.",
  ],
  [
    "Leave a voicemail explaining that one family member became sick and suggest a few future meeting times.",
    "가족 중 한 명이 아프게 되었다고 설명하는 음성 메시지를 남기고, 나중에 만날 수 있는 시간을 몇 가지 제안하세요.",
  ],
  [
    "Describe a time when you had to alter your plans because you needed to help a family member.",
    "가족을 도와야 해서 계획을 바꿔야 했던 때를 묘사하세요.",
  ],
  [
    "Which room in your house do you spend the most time in? Describe it to me.",
    "집에서 가장 많은 시간을 보내는 방은 어디인가요? 그 방을 묘사하세요.",
  ],
  ["How do you spend time with your family in your house?", "집에서 가족과 어떻게 시간을 보내나요?"],
  [
    "Talk about your childhood home. Describe how it has changed over the years.",
    "어린 시절 살던 집에 대해 이야기하세요. 시간이 지나면서 어떻게 변했는지 설명하세요.",
  ],
  [
    "Talk about a memorable experience you have had with family members in your house.",
    "집에서 가족들과 함께했던 기억에 남는 경험을 이야기하세요.",
  ],
  [
    "Call your relative and ask several questions so that you can take care of his or her home.",
    "친척의 집을 돌보기 위해 필요한 정보를 알 수 있도록 친척에게 전화해서 여러 질문을 하세요.",
  ],
  [
    "Leave a message explaining that the key is missing and suggest ways to solve the situation.",
    "열쇠가 없다는 상황을 설명하는 메시지를 남기고 해결 방법을 제안하세요.",
  ],
  [
    "Describe a time when you promised to help a relative but were unable to do it at first.",
    "친척을 돕겠다고 약속했지만 처음에는 하지 못했던 때를 묘사하세요.",
  ],
  ["Favorite Park", "좋아하는 공원"],
  ["Park Routine", "공원에 갈 때의 루틴"],
  ["Last Park Visit", "마지막으로 공원에 갔던 경험"],
  ["Unexpected Park Experience", "공원에서 있었던 예상치 못한 경험"],
  ["Ask About A Park", "공원에 대해 질문하기"],
  ["Ask Park Information", "공원 정보 질문하기"],
  ["Change Park Plan", "공원 계획 변경하기"],
  ["Bad Park Experience", "공원에서 있었던 안 좋은 경험"],
  ["Favorite Beach", "좋아하는 해변"],
  ["Beach Routine", "해변에 갈 때의 루틴"],
  ["Last Beach Visit", "마지막으로 해변에 갔던 경험"],
  ["Unexpected Beach Experience", "해변에서 있었던 예상치 못한 경험"],
  ["Ask About A Beach", "해변에 대해 질문하기"],
  ["Ask Beach Information", "해변 정보 질문하기"],
  ["Change Beach Plan", "해변 계획 변경하기"],
  ["Bad Beach Experience", "해변에서 있었던 안 좋은 경험"],
  ["Favorite Music", "좋아하는 음악"],
  ["Listening Routine", "음악을 듣는 루틴"],
  ["Interest In Music", "음악에 관심을 갖게 된 계기"],
  ["Live Music Experience", "라이브 음악 경험"],
  ["Ask About Violin", "바이올린에 대해 질문하기"],
  ["Ask About MP3 Player", "MP3 플레이어에 대해 질문하기"],
  ["Friend's MP3 Problem", "친구의 MP3 플레이어 문제"],
  ["Device Problem Experience", "기기 문제 경험"],
  ["Electric Guitar", "일렉 기타"],
  ["Practice Routine", "연습 루틴"],
  ["Interest In Guitar", "기타에 관심을 갖게 된 계기"],
  ["Memorable Playing Experience", "기억에 남는 연주 경험"],
  ["Ask About Instrument", "악기에 대해 질문하기"],
  ["Buy A Guitar", "기타 구매하기"],
  ["Guitar Purchase Problem", "기타 구매 후 문제"],
  ["Guitar Problem Experience", "기타 문제 경험"],
  ["Favorite Cafe", "좋아하는 카페"],
  ["Cafe Routine", "카페에 갈 때의 루틴"],
  ["First Cafe Visit", "처음 카페에 갔던 경험"],
  ["Memorable Cafe Experience", "기억에 남는 카페 경험"],
  ["Ask About Cafe", "카페에 대해 질문하기"],
  ["Ask New Cafe Information", "새 카페 정보 질문하기"],
  ["Wrong Order Problem", "주문이 잘못된 문제"],
  ["Bad Cafe Experience", "카페에서 있었던 안 좋은 경험"],
  ["Describe Gym", "헬스장 묘사하기"],
  ["Gym Routine", "헬스장 루틴"],
  ["First Interest In Gym", "헬스장에 처음 관심을 갖게 된 계기"],
  ["Memorable Gym Experience", "기억에 남는 헬스장 경험"],
  ["Ask About Gym", "헬스장에 대해 질문하기"],
  ["Ask New Gym Information", "새 헬스장 정보 질문하기"],
  ["Cannot Go To Gym", "헬스장에 갈 수 없는 상황"],
  ["Changed Workout Plan", "운동 계획을 바꾼 경험"],
  ["People During Vacation", "휴가 때 함께 시간을 보내는 사람들"],
  ["Vacation Activities", "휴가 때 하는 활동"],
  ["Recent Vacation At Home", "최근 집에서 보낸 휴가"],
  ["Memorable Vacation Experience", "기억에 남는 휴가 경험"],
  ["Ask About Vacation People", "휴가 때 함께하는 사람들에 대해 질문하기"],
  ["Ask Ticket Information", "티켓 정보 질문하기"],
  ["Cannot Go To Performance", "공연에 갈 수 없는 상황"],
  ["Ticket Cancellation Experience", "티켓 취소 경험"],
]);

function cleanText(value) {
  return String(value)
    .replace(/<[^>]+>/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkdownLine(line) {
  return cleanText(String(line).replace(/^>\s?/, ""));
}

function splitSentences(text) {
  const value = cleanText(text);
  if (!value) {
    return [];
  }

  const matches = value.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g);
  return (matches || [value]).map(cleanText).filter(Boolean);
}

function splitSpeakingLine(text) {
  return cleanText(text)
    .split(/\s*\/\s*/)
    .map(cleanText)
    .filter(Boolean);
}

function hasHangul(text) {
  return /[가-힣]/.test(text);
}

function hasEnglish(text) {
  return /[A-Za-z]/.test(text);
}

function normalizeSlotPart(value) {
  const text = cleanText(value);
  const match = text.match(/\d+/);
  return match ? String(Number(match[0])) : text;
}

function slotKey(fileNumber, setNumber, typeNumber) {
  return `${fileNumber}|${normalizeSlotPart(setNumber)}|${normalizeSlotPart(typeNumber)}`;
}

function getFileNumber(file) {
  const candidates = [file.number, file.title, file.id, file.fileName];
  for (const candidate of candidates) {
    const match = String(candidate || "").match(/\d+/);
    if (match) {
      return Number(match[0]);
    }
  }
  return 0;
}

function parseStudyDataFile(dataFile) {
  if (!fs.existsSync(dataFile)) {
    return null;
  }

  const text = fs.readFileSync(dataFile, "utf8");
  const match = text.match(/window\.OPIC_STUDY_DATA\s*=\s*([\s\S]*);\s*$/);
  if (!match) {
    return null;
  }

  return JSON.parse(match[1]);
}

function loadOwnerQuestionData() {
  const ownerData = parseStudyDataFile(ownerDataFile);
  if (!ownerData) {
    return;
  }

  for (const file of ownerData.files || []) {
    const fileNumber = getFileNumber(file);
    if (!fileNumber) {
      continue;
    }

    for (const entry of file.entries || []) {
      const question = cleanText(entry.question);
      if (!question) {
        continue;
      }

      ownerQuestionsBySlot.set(slotKey(fileNumber, entry.set, entry.type), question);
      if (entry.questionTranslation) {
        ownerQuestionTranslations.set(question, cleanText(entry.questionTranslation));
      }
    }
  }
}

function getCanonicalQuestion(config, entry) {
  if (config.number === 6) {
    return cafeQuestionsByType.get(normalizeSlotPart(entry.type)) || cleanText(entry.question);
  }

  const ownerNumber = ownerNumberByMinseokNumber.get(config.number);
  if (!ownerNumber) {
    return cleanText(entry.question);
  }

  return (
    ownerQuestionsBySlot.get(slotKey(ownerNumber, entry.set, entry.type)) ||
    cleanText(entry.question)
  );
}

function getQuestionTranslation(question) {
  const key = cleanText(question);
  return (
    ownerQuestionTranslations.get(key) ||
    cafeQuestionTranslations.get(key) ||
    questionTranslations.get(key) ||
    ""
  );
}

function parseTranslationPairs(lines) {
  const pairs = [];
  let pendingEnglish = "";

  for (const line of lines) {
    const text = cleanText(line);
    if (!text) {
      continue;
    }

    if (hasHangul(text)) {
      if (pendingEnglish) {
        pairs.push({ english: pendingEnglish, korean: text });
        pendingEnglish = "";
      }
      continue;
    }

    if (hasEnglish(text)) {
      pendingEnglish = text;
    }
  }

  return pairs;
}

function normalizeForAlignment(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");
}

function normalizeEnglish(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSpeakingTranslation(text, pairs) {
  const cleanedText = cleanText(text);
  const override = speakingTranslationOverrides.get(cleanedText);
  if (override) {
    return override;
  }

  const normalizedText = normalizeEnglish(cleanedText);
  if (!normalizedText) {
    return "";
  }

  const exact = pairs.find((pair) => normalizeEnglish(pair.english) === normalizedText);
  if (exact) {
    return exact.korean;
  }

  if (normalizedText.length < 5) {
    return "";
  }

  const containingSentence = pairs.find((pair) =>
    normalizeEnglish(pair.english).includes(normalizedText),
  );
  return containingSentence?.korean || "";
}

function syncSpeakingChunks(originalSentences, updatedSentences, speakingChunks) {
  const sentenceGroups = [];
  let chunkIndex = 0;

  for (const sentence of originalSentences) {
    const target = normalizeForAlignment(sentence);
    const group = [];
    let combined = "";

    while (chunkIndex < speakingChunks.length && combined.length < target.length) {
      const chunk = speakingChunks[chunkIndex];
      group.push(chunk);
      combined += normalizeForAlignment(chunk);
      chunkIndex += 1;
    }

    if (!target || combined !== target) {
      return updatedSentences;
    }

    sentenceGroups.push(group);
  }

  if (chunkIndex !== speakingChunks.length) {
    return updatedSentences;
  }

  return updatedSentences.flatMap((sentence, index) => {
    const original = originalSentences[index];
    if (normalizeForAlignment(original) === normalizeForAlignment(sentence)) {
      return sentenceGroups[index];
    }
    return [sentence];
  });
}

function makeEntryId(fileId, index, setNumber, typeNumber) {
  const setPart = setNumber ? `set-${setNumber}` : "set-x";
  const typePart = typeNumber ? `type-${typeNumber}` : "type-x";
  return `${fileId}-${setPart}-${typePart}-${index + 1}`;
}

function addDerivedEntries(config, entries) {
  if (config.number === 1) {
    const base = entries.find(
      (entry) => normalizeSlotPart(entry.set) === "1" && normalizeSlotPart(entry.type) === "5",
    );
    if (!base) {
      return;
    }

    for (const setNumber of ["2", "3"]) {
      const exists = entries.some(
        (entry) =>
          normalizeSlotPart(entry.set) === setNumber && normalizeSlotPart(entry.type) === "5",
      );
      if (exists) {
        continue;
      }

      const clone = JSON.parse(JSON.stringify(base));
      const question = ownerQuestionsBySlot.get(slotKey(1, setNumber, "5")) || base.question;
      clone.set = setNumber;
      clone.type = "5";
      clone.entryLabel = `Derived Set ${setNumber} Type 5`;
      clone.originalQuestion = base.question;
      clone.question = question;
      clone.questionSentences = splitSentences(question);
      clone.questionTranslation = getQuestionTranslation(question) || base.questionTranslation;
      entries.push(clone);
    }
  }

  if (config.number === 2) {
    const base = entries.find(
      (entry) => normalizeSlotPart(entry.set) === "1" && normalizeSlotPart(entry.type) === "7",
    );
    const exists = entries.some(
      (entry) => normalizeSlotPart(entry.set) === "2" && normalizeSlotPart(entry.type) === "7",
    );
    if (!base || exists) {
      return;
    }

    const clone = JSON.parse(JSON.stringify(base));
    const question = ownerQuestionsBySlot.get(slotKey(2, "2", "7")) || base.question;
    clone.set = "2";
    clone.type = "7";
    clone.entryLabel = "Derived Set 2 Type 7";
    clone.originalQuestion = base.question;
    clone.question = question;
    clone.questionSentences = splitSentences(question);
    clone.questionTranslation = getQuestionTranslation(question) || base.questionTranslation;
    entries.push(clone);
  }
}

function finalizeEntries(config, entries) {
  entries.sort((a, b) => {
    const setDiff = Number(normalizeSlotPart(a.set)) - Number(normalizeSlotPart(b.set));
    if (setDiff) {
      return setDiff;
    }
    return Number(normalizeSlotPart(a.type)) - Number(normalizeSlotPart(b.type));
  });

  entries.forEach((entry, index) => {
    entry.id = makeEntryId(config.id, index, entry.set, entry.type);
  });
}

function parseMetadataLine(line) {
  const match = line.match(/^-\s+`?([^`:]+):`?\s*(.+?)\s*$/);
  if (!match) {
    return null;
  }
  return { key: cleanText(match[1]), value: cleanText(match[2]) };
}

function parseFile(config) {
  const sourcePath = path.resolve(sourceDir, config.fileName);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing source file: ${sourcePath}`);
  }

  const text = fs.readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const entries = [];

  let currentSet = "";
  let currentType = "";
  let currentEntry = null;
  let activeSection = "";

  function finishEntry() {
    if (!currentEntry) {
      return;
    }

    currentEntry.set = currentEntry.set || currentSet || "1";
    currentEntry.type = currentEntry.type || currentType || String(entries.length + 1);
    const originalQuestion = currentEntry.question;
    currentEntry.question = getCanonicalQuestion(config, currentEntry);
    if (cleanText(originalQuestion) !== cleanText(currentEntry.question)) {
      currentEntry.originalQuestion = cleanText(originalQuestion);
    }
    currentEntry.questionSentences = splitSentences(currentEntry.question);
    currentEntry.questionTranslation = getQuestionTranslation(currentEntry.question);
    const originalFinalSentences = currentEntry.finalSentences.map(cleanText).filter(Boolean);
    currentEntry.finalSentences = originalFinalSentences;
    currentEntry.speakingChunks = currentEntry.speakingChunks.map(cleanText).filter(Boolean);
    currentEntry.translations = parseTranslationPairs(currentEntry.translationLines);
    delete currentEntry.translationLines;

    if (currentEntry.translations.length > 0) {
      const translatedEnglish = currentEntry.translations.map((pair) => pair.english);
      const hasUpdatedEnglish =
        translatedEnglish.length !== originalFinalSentences.length ||
        translatedEnglish.some((sentence, index) => sentence !== originalFinalSentences[index]);
      currentEntry.finalSentences = translatedEnglish;
      if (hasUpdatedEnglish) {
        currentEntry.speakingChunks = syncSpeakingChunks(
          originalFinalSentences,
          translatedEnglish,
          currentEntry.speakingChunks,
        );
      }
    }

    currentEntry.speakingTranslations = currentEntry.speakingChunks.map((chunk) =>
      getSpeakingTranslation(chunk, currentEntry.translations),
    );

    if (
      currentEntry.question ||
      currentEntry.finalSentences.length > 0 ||
      currentEntry.speakingChunks.length > 0
    ) {
      currentEntry.id = makeEntryId(
        config.id,
        entries.length,
        currentEntry.set,
        currentEntry.type,
      );
      entries.push(currentEntry);
    }

    currentEntry = null;
  }

  for (const line of lines) {
    let match = line.match(/^## Set\s+(.+?)\s*$/);
    if (match) {
      currentSet = cleanText(match[1]);
      activeSection = "";
      continue;
    }

    match = line.match(/^### Type\s+(.+?)\s*$/);
    if (match) {
      currentType = cleanText(match[1]);
      activeSection = "";
      continue;
    }

    match = line.match(/^#### Entry\s+(.+?)\s*$/);
    if (match) {
      finishEntry();
      currentEntry = {
        id: "",
        fileId: config.id,
        fileTitle: config.title,
        sourceFile: config.fileName,
        set: currentSet,
        type: currentType,
        entryLabel: cleanText(match[1]),
        question: "",
        questionTranslation: "",
        questionSentences: [],
        finalSentences: [],
        speakingChunks: [],
        speakingTranslations: [],
        translationLines: [],
        translations: [],
      };
      activeSection = "";
      continue;
    }

    if (!currentEntry) {
      continue;
    }

    const metadata = parseMetadataLine(line);
    if (metadata) {
      if (metadata.key === "set") {
        currentEntry.set = metadata.value;
      } else if (metadata.key === "type") {
        currentEntry.type = metadata.value;
      } else if (metadata.key === "question") {
        currentEntry.question = metadata.value;
      }
      continue;
    }

    if (/^#####\s+/.test(line)) {
      if (/opic-final-marker|\[최종 답변\]/.test(line)) {
        activeSection = "final";
      } else if (/opic-speaking-marker|\[말하기용 버전\]/.test(line)) {
        activeSection = "speaking";
      } else if (/영어\+한국어/.test(line)) {
        activeSection = "translation";
      } else {
        activeSection = "";
      }
      continue;
    }

    if (activeSection !== "final" && activeSection !== "speaking" && activeSection !== "translation") {
      continue;
    }

    if (/^---\s*$/.test(line)) {
      continue;
    }

    const sectionText = stripMarkdownLine(line);
    if (!sectionText) {
      continue;
    }

    if (activeSection === "final") {
      currentEntry.finalSentences.push(sectionText);
    } else if (activeSection === "speaking") {
      currentEntry.speakingChunks.push(...splitSpeakingLine(sectionText));
    } else {
      currentEntry.translationLines.push(sectionText);
    }
  }

  finishEntry();
  addDerivedEntries(config, entries);
  finalizeEntries(config, entries);

  return {
    ...config,
    path: path.relative(__dirname, path.resolve(sourceDir, config.fileName)).replace(/\\/g, "/"),
    entries,
  };
}

loadOwnerQuestionData();
const files = sourceFiles.map(parseFile);
const stats = files.reduce(
  (total, file) => {
    total.files += 1;
    total.entries += file.entries.length;
    total.questions += file.entries.reduce((sum, entry) => sum + entry.questionSentences.length, 0);
    total.questionTranslations += file.entries.reduce(
      (sum, entry) => sum + (entry.questionTranslation ? 1 : 0),
      0,
    );
    total.finalSentences += file.entries.reduce((sum, entry) => sum + entry.finalSentences.length, 0);
    total.speakingChunks += file.entries.reduce((sum, entry) => sum + entry.speakingChunks.length, 0);
    total.speakingTranslations += file.entries.reduce(
      (sum, entry) => sum + entry.speakingTranslations.filter(Boolean).length,
      0,
    );
    total.translations += file.entries.reduce((sum, entry) => sum + entry.translations.length, 0);
    return total;
  },
  {
    files: 0,
    entries: 0,
    questions: 0,
    questionTranslations: 0,
    finalSentences: 0,
    speakingChunks: 0,
    speakingTranslations: 0,
    translations: 0,
  },
);

const data = {
  owner: "민석",
  generatedAt: new Date().toISOString(),
  sourceDirectory: path.relative(__dirname, sourceDir).replace(/\\/g, "/"),
  files,
  stats,
};

fs.writeFileSync(
  outputFile,
  `window.OPIC_STUDY_DATA = ${JSON.stringify(data, null, 2)};\n`,
  "utf8",
);

console.log(`Wrote ${outputFile}`);
console.log(
  `Loaded ${stats.files} files, ${stats.entries} entries, ${stats.questions} question sentences, ${stats.questionTranslations} question translations, ${stats.finalSentences} final sentences, ${stats.speakingChunks} speaking chunks, ${stats.speakingTranslations} speaking translations, ${stats.translations} final translations.`,
);

if (stats.speakingTranslations !== stats.speakingChunks) {
  console.warn(
    `Warning: ${stats.speakingChunks - stats.speakingTranslations} speaking translations are missing.`,
  );
}
