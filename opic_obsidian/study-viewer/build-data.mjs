import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, "..", "output", "scripts");
const outputFile = path.resolve(__dirname, "data.js");
const speakingTranslationsFile = path.resolve(__dirname, "speaking-translations.json");

const speakingTranslationOverrides = new Map(
  Object.entries(JSON.parse(fs.readFileSync(speakingTranslationsFile, "utf8"))),
);

const sourceFileCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function getSourceFiles() {
  return fs
    .readdirSync(sourceDir)
    .filter((fileName) => fileName.toLowerCase().endsWith(".md"))
    .map((fileName) => {
      const match = fileName.match(/^(\d+)\.\s*(.+?)\.md$/i);
      if (!match) {
        return null;
      }

      const number = Number(match[1]);
      const slug = match[2].trim();
      if (number < 1 || number > 8) {
        return null;
      }

      if (number === 1 && !/^family-house\d+$/i.test(slug)) {
        return null;
      }

      if (number !== 1 && /xx/i.test(slug)) {
        return null;
      }

      const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return {
        id: `script-${number}-${safeSlug}`,
        number,
        fileName,
        title: `${number}. ${slug}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.number !== b.number) {
        return a.number - b.number;
      }
      return sourceFileCollator.compare(a.fileName, b.fileName);
    });
}

const sourceFiles = getSourceFiles();

const questionTranslations = new Map([
  [
    "Describe what your home looks like. Explain the floor plan and the number of rooms your home has. Please discuss what your home is like for me.",
    "당신의 집이 어떻게 생겼는지 묘사하세요. 집의 구조와 방의 개수를 설명하고, 당신의 집이 어떤 곳인지 이야기해 주세요.",
  ],
  [
    "While at home, what is your typical routine? During the week and on the weekends, what types of things do you do?",
    "집에 있을 때 당신의 평소 루틴은 무엇인가요? 평일과 주말에는 어떤 일을 하나요?",
  ],
  [
    "Problems often happen in homes-unfinished projects, plumbing issues, etc. Discuss some of the issues that have occurred in your home.",
    "집에서는 미완성 작업이나 배관 문제 같은 일이 자주 생깁니다. 당신의 집에서 있었던 문제 몇 가지를 이야기하세요.",
  ],
  [
    "Select one of the problems that happened at your house and describe to me everything that occurred. When did this happen and what types of things created this problem? Then in detail discuss all of the steps that you did in order to solve this issue.",
    "집에서 있었던 문제 하나를 골라 어떤 일이 있었는지 모두 설명하세요. 언제 일어났고 무엇 때문에 문제가 생겼나요? 그 문제를 해결하기 위해 했던 모든 단계를 자세히 이야기하세요.",
  ],
  [
    "With my family, I currently live in a house in the United States. To find out more information about this home, ask me three to four additional questions.",
    "저는 현재 가족과 함께 미국의 한 집에 살고 있습니다. 이 집에 대해 더 알아보기 위해 추가 질문을 서너 개 해 보세요.",
  ],
  [
    "Pretend that you want to buy new furniture for your house. Explain to a salesperson what you are looking for.",
    "집에 새 가구를 사고 싶다고 가정하세요. 판매원에게 어떤 것을 찾고 있는지 설명하세요.",
  ],
  [
    "You discover a problem with the furniture that you bought. Call the store and explain the problem.",
    "당신이 산 가구에 문제가 있다는 것을 발견했습니다. 가게에 전화해서 문제를 설명하세요.",
  ],
  [
    "Have you ever had a problem with something you purchased for your house? Talk about what the problem was and how you solved the problem.",
    "집을 위해 산 물건에 문제가 있었던 적이 있나요? 문제가 무엇이었고 어떻게 해결했는지 이야기하세요.",
  ],
  [
    "What are the various responsibilities in your home? Identify who is responsible for what tasks. Explain how things get accomplished.",
    "집에서 맡고 있는 여러 책임은 무엇인가요? 누가 어떤 일을 맡는지 말하고, 그 일들이 어떻게 처리되는지 설명하세요.",
  ],
  [
    "How do you traditionally handle your responsibilities?",
    "보통 당신의 책임을 어떻게 처리하나요?",
  ],
  [
    "As a child, discuss what responsibilities you had while you were at home. What specific responsibilities were assigned to you and how did you handle them?",
    "어릴 때 집에서 어떤 책임이 있었는지 이야기하세요. 어떤 구체적인 일을 맡았고 어떻게 처리했나요?",
  ],
  [
    "Do you recall a specific instance as a child when you were asked to do a task and you did not do it? Provide details as to what you were supposed to do, what happened in regard to this situation, and why you could not complete it.",
    "어릴 때 어떤 일을 하라고 부탁받았지만 하지 않았던 특정한 일을 기억하나요? 무엇을 해야 했는지, 그 상황에서 무슨 일이 있었는지, 왜 끝내지 못했는지 자세히 말하세요.",
  ],
  [
    "You want to have another family come to your house for lunch. Please ask the other members of your family several questions, so that you can decide the best date and time for your acquaintances to visit.",
    "다른 가족을 당신의 집에 점심 식사로 초대하고 싶습니다. 지인들이 방문하기에 가장 좋은 날짜와 시간을 정할 수 있도록 가족들에게 여러 질문을 해 보세요.",
  ],
  [
    "Unfortunately, on the morning of the day you were going to have lunch with your friend's family, one member of your family becomes sick. Leave a message on your friend's voicemail, and tell them the problem. Then give them a few suggestions for meeting up in the future.",
    "아쉽게도 친구 가족과 점심을 먹기로 한 날 아침에 당신의 가족 중 한 명이 아프게 되었습니다. 친구의 음성사서함에 메시지를 남겨 문제를 말하고, 나중에 만날 수 있는 몇 가지 제안을 하세요.",
  ],
  [
    "Can you remember a time when something similar occurred in your life? Has it ever been necessary for you to alter your plans because you needed to help one of your family members?",
    "비슷한 일이 당신의 삶에서 있었던 때를 기억하나요? 가족 중 한 명을 도와야 해서 계획을 바꿔야 했던 적이 있나요?",
  ],
  [
    "Which room in your house do you spend the most time in? Describe it to me.",
    "집에서 가장 많은 시간을 보내는 방은 어디인가요? 그 방을 묘사해 주세요.",
  ],
  [
    "How do you spend time with your family in your house? Describe how you spend time with your family in your house.",
    "집에서 가족과 어떻게 시간을 보내나요? 집에서 가족과 시간을 보내는 방식을 설명하세요.",
  ],
  [
    "Talk about your childhood home. Describe how it has changed over the years.",
    "어린 시절 살던 집에 대해 이야기하세요. 시간이 지나면서 어떻게 변했는지 설명하세요.",
  ],
  [
    "Talk about a memorable experience you have had with family members in your house. What made this experience special or unique?",
    "집에서 가족들과 함께했던 기억에 남는 경험을 이야기하세요. 무엇이 그 경험을 특별하거나 독특하게 만들었나요?",
  ],
  [
    "One of your relatives is going on a trip. You have told the family member that you will take care of his or her duties at his/her home. Make a telephone call to your relative. Ask several questions so that you can find out all the information you need.",
    "친척 중 한 명이 여행을 갑니다. 당신은 그 친척의 집안일을 대신 돌봐주겠다고 말했습니다. 친척에게 전화해서 필요한 정보를 모두 알 수 있도록 여러 질문을 하세요.",
  ],
  [
    "When you arrive at your family member's home, you discover that the house is locked and the key is not where you were told it would be. Make a telephone call to your family member's hotel. Leave a message telling him/her what has occurred. Offer several ways you can clear up the situation.",
    "가족 구성원의 집에 도착했더니 집이 잠겨 있고, 열쇠도 들은 곳에 없습니다. 가족 구성원이 묵는 호텔에 전화해서 메시지를 남기세요. 무슨 일이 있었는지 말하고 상황을 해결할 수 있는 여러 방법을 제안하세요.",
  ],
  [
    "Can you remember a time when you told an acquaintance or relative that you would do something for them, and then were unable to do it? I'd like to hear about what happened, from start to finish. Describe for me what you told them you'd do, what occurred, and how the problem was fixed.",
    "지인이나 친척에게 무언가를 해 주겠다고 말했지만 하지 못했던 적이 있나요? 처음부터 끝까지 무슨 일이 있었는지 듣고 싶습니다. 무엇을 해 주겠다고 했는지, 무슨 일이 있었는지, 문제가 어떻게 해결되었는지 설명하세요.",
  ],
  [
    "Do you have a favorite park? Describe this park by telling me what it looks like.",
    "좋아하는 공원이 있나요? 그 공원이 어떻게 생겼는지 묘사하세요.",
  ],
  [
    "Discuss some of the things that you do when going to the park. What does a typical visit to the park consist of?",
    "공원에 갈 때 하는 일들을 이야기하세요. 보통 공원 방문은 어떤 활동들로 이루어져 있나요?",
  ],
  [
    "Describe your experience the last time you went to the park.",
    "마지막으로 공원에 갔던 경험을 묘사하세요.",
  ],
  [
    "Explain a comical, unexpected, or interesting park experience.",
    "공원에서 있었던 웃기거나 예상치 못했거나 흥미로운 경험을 설명하세요.",
  ],
  [
    "Ask me 3 questions about the park that I go to.",
    "제가 가는 공원에 대해 질문 세 가지를 해 보세요.",
  ],
  [
    "A friend asks you to go to the park. Ask three to four questions.",
    "친구가 공원에 가자고 합니다. 질문을 서너 개 해 보세요.",
  ],
  [
    "The park will be closed. Explain and provide alternatives.",
    "공원이 문을 닫을 예정입니다. 상황을 설명하고 대안을 제시하세요.",
  ],
  [
    "Discuss a memorable park experience.",
    "기억에 남는 공원 경험을 이야기하세요.",
  ],
  [
    "Your friend asks you to pick her up in an hour, but you cannot. Explain and give alternatives.",
    "친구가 한 시간 뒤에 데리러 와 달라고 하지만 당신은 갈 수 없습니다. 상황을 설명하고 대안을 제시하세요.",
  ],
  [
    "Do you have a favorite beach? Describe this beach by telling me what it looks like.",
    "좋아하는 해변이 있나요? 그 해변이 어떻게 생겼는지 묘사하세요.",
  ],
  [
    "Discuss some of the things that you do when going to the beach.",
    "해변에 갈 때 하는 일들을 이야기하세요.",
  ],
  [
    "Describe your experience the last time you went to the beach.",
    "마지막으로 해변에 갔던 경험을 묘사하세요.",
  ],
  [
    "Explain a comical, unexpected, or interesting beach experience.",
    "해변에서 있었던 웃기거나 예상치 못했거나 흥미로운 경험을 설명하세요.",
  ],
  [
    "Ask me 3 questions about the beach that I go to.",
    "제가 가는 해변에 대해 질문 세 가지를 해 보세요.",
  ],
  [
    "You and your friend are planning to go to the beach. Ask 3 to 4 questions.",
    "당신과 친구가 해변에 갈 계획입니다. 질문을 서너 개 해 보세요.",
  ],
  [
    "Beach weather will be bad. Tell your friend and give alternatives.",
    "해변 날씨가 좋지 않을 예정입니다. 친구에게 말하고 대안을 제시하세요.",
  ],
  [
    "Have you had an unforgettable or scary experience at the beach?",
    "해변에서 잊을 수 없거나 무서웠던 경험이 있나요?",
  ],
  [
    "Explain the types of music you enjoy listening to. Discuss some of your favorite composers and or musicians.",
    "즐겨 듣는 음악 종류를 설명하세요. 좋아하는 작곡가나 음악가에 대해 이야기하세요.",
  ],
  [
    "Explain the types of music you enjoy listening to. Discuss some of your favorite composers or musicians.",
    "즐겨 듣는 음악의 종류를 설명하세요. 좋아하는 작곡가나 음악가에 대해 이야기하세요.",
  ],
  [
    "Explain where and when you typically go to listen to music.",
    "보통 어디에서, 언제 음악을 들으러 가는지 설명하세요.",
  ],
  [
    "Explain when you initially gained an interest in music.",
    "처음 음악에 관심을 갖게 된 때를 설명하세요.",
  ],
  [
    "Could you think back to a particularly memorable time when you heard live music?",
    "라이브 음악을 들었던 특히 기억에 남는 때를 떠올려 볼 수 있나요?",
  ],
  [
    "I am a violin player in an orchestra. Ask me three to four questions.",
    "저는 오케스트라에서 바이올린을 연주합니다. 질문을 서너 개 해 보세요.",
  ],
  [
    "Contact a friend and ask questions about buying an MP3 player.",
    "친구에게 연락해서 MP3 플레이어를 사는 것에 대해 질문하세요.",
  ],
  [
    "You borrowed an MP3 player from a friend, but broke it. Explain and suggest solutions.",
    "친구에게 MP3 플레이어를 빌렸는데 고장 냈습니다. 설명하고 해결책을 제안하세요.",
  ],
  [
    "Discuss an experience where equipment broke or was not working properly.",
    "장비가 고장 났거나 제대로 작동하지 않았던 경험을 이야기하세요.",
  ],
  [
    "Identify the musical instrument you enjoy playing. Discuss the type of music or the composers you like to play and why.",
    "즐겨 연주하는 악기를 말하세요. 연주하기 좋아하는 음악 종류나 작곡가, 그리고 그 이유를 이야기하세요.",
  ],
  [
    "Identify the musical instrument you enjoy playing. Discuss the type of music or the circumstances involved.",
    "즐겨 연주하는 악기를 말하세요. 그 악기로 연주하는 음악의 종류나 관련된 상황에 대해 이야기하세요.",
  ],
  [
    "Discuss your typical routine or practice sessions with this instrument.",
    "이 악기로 하는 평소 루틴이나 연습 과정을 이야기하세요.",
  ],
  [
    "Discuss your initial interest in playing this instrument.",
    "이 악기를 연주하는 데 처음 관심을 갖게 된 계기를 이야기하세요.",
  ],
  [
    "Tell me about one particular experience youve had playing a musical instrument.",
    "악기를 연주하면서 겪었던 특정한 경험 하나를 이야기해 주세요.",
  ],
  [
    "Tell me about one particular experience you've had playing a musical instrument.",
    "악기를 연주하면서 겪었던 특정한 경험 하나를 이야기해 주세요.",
  ],
  [
    "I also play a musical instrument. Ask me several more questions.",
    "저도 악기를 연주합니다. 추가 질문을 여러 개 해 보세요.",
  ],
  [
    "Contact the music store manager and ask questions about buying a new instrument.",
    "악기점 매니저에게 연락해서 새 악기를 사는 것에 대해 질문하세요.",
  ],
  [
    "After buying this instrument, you notice a problem. Explain and suggest solutions.",
    "이 악기를 산 후 문제가 있다는 것을 발견했습니다. 설명하고 해결책을 제안하세요.",
  ],
  [
    "Have you ever had an issue with an instrument before?",
    "전에 악기에 문제가 있었던 적이 있나요?",
  ],
  [
    "What types of movies do you enjoy seeing?",
    "어떤 종류의 영화를 보는 것을 좋아하나요?",
  ],
  [
    "What do you typically do when going to see a movie?",
    "영화를 보러 갈 때 보통 무엇을 하나요?",
  ],
  [
    "Reflect back to the last movie that you recently went to.",
    "최근에 보러 갔던 마지막 영화를 떠올려 보세요.",
  ],
  [
    "Who is your favorite actor or actress? Describe a news story about this person.",
    "좋아하는 배우는 누구인가요? 그 사람에 관한 뉴스 이야기를 묘사하세요.",
  ],
  [
    "Ask me 3-4 questions about the type of movies I like.",
    "제가 좋아하는 영화 종류에 대해 질문을 서너 개 해 보세요.",
  ],
  [
    "Contact the movie theater and ask questions to buy tickets.",
    "영화관에 연락해서 티켓을 사기 위해 질문하세요.",
  ],
  [
    "Wrong tickets were sold to you. Explain and give alternatives.",
    "잘못된 티켓을 받았습니다. 상황을 설명하고 대안을 제시하세요.",
  ],
  [
    "Discuss a reservation or ticket problem you had.",
    "예약이나 티켓과 관련해 겪었던 문제를 이야기하세요.",
  ],
  [
    "In detail, discuss what your gym or health club is like.",
    "당신의 헬스장이나 피트니스 센터가 어떤 곳인지 자세히 이야기하세요.",
  ],
  [
    "Discuss your usual routine when you go to the gym.",
    "헬스장에 갈 때의 평소 루틴을 이야기하세요.",
  ],
  [
    "What sparked your interest in working out and going to health clubs?",
    "운동하고 헬스장에 가는 것에 관심을 갖게 된 계기는 무엇인가요?",
  ],
  [
    "Describe a memorable experience you had at a gym.",
    "헬스장에서 있었던 기억에 남는 경험을 묘사하세요.",
  ],
  [
    "Ask me three questions about my gym.",
    "제 헬스장에 대해 질문 세 가지를 해 보세요.",
  ],
  [
    "Contact the manager of a new gym and ask questions.",
    "새 헬스장의 매니저에게 연락해서 질문하세요.",
  ],
  [
    "You cannot visit a new gym with your friend today. Reschedule.",
    "오늘 친구와 새 헬스장에 갈 수 없습니다. 일정을 다시 잡으세요.",
  ],
  [
    "Have you ever needed to adjust plans with a friend?",
    "친구와의 계획을 조정해야 했던 적이 있나요?",
  ],
  [
    "Identify the people you enjoy seeing and spending time with while on vacation.",
    "휴가 중에 만나고 함께 시간을 보내는 것을 좋아하는 사람들을 말하세요.",
  ],
  [
    "What activities do you enjoy doing with people while on vacation?",
    "휴가 중에 사람들과 함께 어떤 활동을 하는 것을 좋아하나요?",
  ],
  [
    "Discuss the things you did on the last vacation you spent at home.",
    "마지막으로 집에서 보낸 휴가에 했던 일들을 이야기하세요.",
  ],
  [
    "Discuss an unexpected, unusual, or satisfying experience while on vacation.",
    "휴가 중에 있었던 예상치 못했거나 특이했거나 만족스러웠던 경험을 이야기하세요.",
  ],
  [
    "Ask me 4 questions about people I spend time with on vacation.",
    "제가 휴가 때 함께 시간을 보내는 사람들에 대해 질문 네 가지를 해 보세요.",
  ],
  [
    "Call the ticket office to buy two performance tickets while on vacation.",
    "휴가 중 공연 티켓 두 장을 사기 위해 매표소에 전화하세요.",
  ],
  [
    "You are ill on the day of the performance. Call your friend and offer solutions.",
    "공연 당일에 아프게 되었습니다. 친구에게 전화해서 해결책을 제안하세요.",
  ],
  [
    "Was there a time you bought a ticket or made plans but could not go?",
    "티켓을 샀거나 계획을 세웠지만 가지 못했던 적이 있나요?",
  ],
]);

function cleanText(value) {
  return String(value)
    .replace(/<[^>]+>/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getQuestionTranslation(question) {
  const cleanedQuestion = cleanText(question);
  return questionTranslations.get(cleanedQuestion) || "";
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

function parseEmphasizedText(value) {
  const source = cleanText(value);
  const emphasis = [];
  let text = "";
  let cursor = 0;
  const pattern = /\*\*(.+?)\*\*/g;
  let match;

  while ((match = pattern.exec(source))) {
    text += source.slice(cursor, match.index);
    const start = text.length;
    text += match[1];
    emphasis.push({ start, end: text.length });
    cursor = match.index + match[0].length;
  }

  text += source.slice(cursor);
  return {
    text: text.replace(/\*\*/g, ""),
    emphasis,
  };
}

function parseFillerPairs(lines, entryLabel) {
  const pairs = [];
  let pendingEnglish = null;
  const meaningfulLines = lines.map(cleanText).filter(Boolean);

  for (const line of meaningfulLines) {
    if (hasHangul(line)) {
      if (!pendingEnglish) {
        throw new Error(`Filler translation has no English pair: ${entryLabel}`);
      }
      const korean = parseEmphasizedText(line);
      pairs.push({
        english: pendingEnglish.text,
        korean: korean.text,
        englishEmphasis: pendingEnglish.emphasis,
        koreanEmphasis: korean.emphasis,
      });
      pendingEnglish = null;
      continue;
    }

    if (hasEnglish(line)) {
      if (pendingEnglish) {
        throw new Error(`Filler English sentence has no Korean pair: ${entryLabel}`);
      }
      pendingEnglish = parseEmphasizedText(line);
    }
  }

  if (pendingEnglish) {
    throw new Error(`Filler English sentence has no Korean pair: ${entryLabel}`);
  }
  if (pairs.length * 2 !== meaningfulLines.length) {
    throw new Error(`Filler section has an invalid English/Korean line pair: ${entryLabel}`);
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

const categoryNames = new Map([
  ["description", "Description"],
  ["habit", "Habit"],
  ["past experience", "Past Experience"],
  ["comparison", "Comparison"],
  ["role play", "Role Play"],
  ["roleplay", "Role Play"],
]);

function normalizeCategory(value) {
  const categories = cleanText(value)
    .split(/\s*(?:\+|\/|&)\s*/)
    .map((category) => categoryNames.get(category.toLowerCase()) || category)
    .filter(Boolean);
  return [...new Set(categories)].join(" + ");
}

function inferCategory(question) {
  const value = normalizeEnglish(question);

  if (
    /\b(?:ask|call|contact|pretend|reschedule)\b/.test(value) ||
    /\bleave (?:a )?(?:message|voicemail|voice mail)\b/.test(value) ||
    /\b(?:explain|describe) (?:the )?problem and (?:suggest|offer|give)\b/.test(value)
  ) {
    return "Role Play";
  }

  if (
    /\bcompare\b/.test(value) ||
    /\bhow (?:has|have|is|are).*(?:changed|different)\b/.test(value) ||
    /\b(?:then and now|past and present|used to)\b/.test(value)
  ) {
    return "Comparison";
  }

  if (
    /\b(?:last time|recent|remember|memorable|experience|ever|first time|recall)\b/.test(value) ||
    /\b(?:initial interest|sparked your interest|as a child|specific instance)\b/.test(value) ||
    /\bwhat happened\b/.test(value)
  ) {
    return "Past Experience";
  }

  if (
    /\b(?:usually|typical|routine|often|normally|traditionally|whenever)\b/.test(value) ||
    /\bwhat (?:do|types of things do) you do\b/.test(value) ||
    /\bhow do you spend\b/.test(value)
  ) {
    return "Habit";
  }

  return "Description";
}

function fillMissingCategories(files) {
  const categoryByQuestion = new Map();

  files.forEach((file) => {
    file.entries.forEach((entry) => {
      const key = normalizeEnglish(entry.question);
      if (key && entry.category && !categoryByQuestion.has(key)) {
        categoryByQuestion.set(key, entry.category);
      }
    });
  });

  files.forEach((file) => {
    file.entries.forEach((entry) => {
      if (!entry.category) {
        entry.category =
          categoryByQuestion.get(normalizeEnglish(entry.question)) || inferCategory(entry.question);
      }
    });
  });
}

function parseMainPointCollection(text) {
  const mainPoints = new Map();
  let isMainPointSection = false;
  let setNumber = "";

  for (const line of text.split("\n")) {
    if (/^##\s+MP 문장 모음\s*$/.test(line)) {
      isMainPointSection = true;
      continue;
    }

    if (isMainPointSection && /^##\s+/.test(line)) {
      break;
    }

    if (!isMainPointSection) {
      continue;
    }

    let match = line.match(/^###\s+Set\s+(.+?)\s*$/i);
    if (match) {
      setNumber = cleanText(match[1]);
      continue;
    }

    match = line.match(/^-\s+\*\*Type\s+(.+?):\*\*\s*(.+?)\s*$/i);
    if (match && setNumber) {
      mainPoints.set(`${setNumber}|${cleanText(match[1])}`, cleanText(match[2]));
    }
  }

  return mainPoints;
}

const mainPointStopWords = new Set([
  "a",
  "an",
  "and",
  "at",
  "because",
  "but",
  "for",
  "from",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "one",
  "so",
  "that",
  "the",
  "there",
  "this",
  "to",
  "was",
  "when",
  "with",
]);

function getMainPointTokens(value) {
  return new Set(
    normalizeEnglish(value)
      .split(" ")
      .filter((token) => token.length > 1 && !mainPointStopWords.has(token)),
  );
}

function getMainPointSimilarity(mainPoint, sentence) {
  const mainPointTokens = getMainPointTokens(mainPoint);
  const sentenceTokens = getMainPointTokens(sentence);
  if (!mainPointTokens.size || !sentenceTokens.size) {
    return 0;
  }

  const overlap = [...mainPointTokens].filter((token) => sentenceTokens.has(token)).length;
  const coverage = overlap / mainPointTokens.size;
  const precision = overlap / sentenceTokens.size;
  return coverage * 0.7 + precision * 0.3;
}

function findExactMainPointRange(mainPointSentence, sentences, startIndex, usedIndexes) {
  const target = normalizeForAlignment(mainPointSentence);
  if (!target) {
    return [];
  }

  for (let start = startIndex; start < sentences.length; start += 1) {
    if (usedIndexes.has(start)) {
      continue;
    }

    let combined = "";
    const indexes = [];
    for (let end = start; end < sentences.length; end += 1) {
      if (usedIndexes.has(end)) {
        break;
      }

      combined += normalizeForAlignment(sentences[end]);
      indexes.push(end);
      if (combined === target) {
        return indexes;
      }
      if (combined.length >= target.length) {
        break;
      }
    }
  }

  return [];
}

function findBestMainPointIndex(mainPointSentence, sentences, startIndex, usedIndexes) {
  const availableIndexes = sentences
    .map((_, index) => index)
    .filter((index) => !usedIndexes.has(index));
  const orderedIndexes = availableIndexes.filter((index) => index >= startIndex);
  const candidates = orderedIndexes.length ? orderedIndexes : availableIndexes;

  let bestIndex = -1;
  let bestScore = -1;
  candidates.forEach((index) => {
    const score = getMainPointSimilarity(mainPointSentence, sentences[index]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function findMainPointSentenceIndexes(mainPoint, sentences) {
  if (!mainPoint || !sentences.length) {
    return [];
  }

  const indexes = [];
  const usedIndexes = new Set();
  let nextStartIndex = 0;

  splitSentences(mainPoint).forEach((mainPointSentence) => {
    let matchedIndexes = findExactMainPointRange(
      mainPointSentence,
      sentences,
      nextStartIndex,
      usedIndexes,
    );
    if (!matchedIndexes.length && nextStartIndex > 0) {
      matchedIndexes = findExactMainPointRange(mainPointSentence, sentences, 0, usedIndexes);
    }
    if (!matchedIndexes.length) {
      const bestIndex = findBestMainPointIndex(
        mainPointSentence,
        sentences,
        nextStartIndex,
        usedIndexes,
      );
      matchedIndexes = bestIndex >= 0 ? [bestIndex] : [];
    }

    matchedIndexes.forEach((index) => {
      indexes.push(index);
      usedIndexes.add(index);
    });
    if (matchedIndexes.length) {
      nextStartIndex = matchedIndexes.at(-1) + 1;
    }
  });

  return indexes;
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

function parseFile(config) {
  const sourcePath = path.resolve(sourceDir, config.fileName);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing source file: ${sourcePath}`);
  }

  const text = fs.readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
  const mainPointsBySlot = parseMainPointCollection(text);
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

    currentEntry.questionSentences = splitSentences(currentEntry.question);
    currentEntry.questionTranslation = getQuestionTranslation(currentEntry.question);
    const originalFinalSentences = currentEntry.finalSentences.map(cleanText).filter(Boolean);
    currentEntry.finalSentences = originalFinalSentences;
    currentEntry.speakingChunks = currentEntry.speakingChunks.map(cleanText).filter(Boolean);
    currentEntry.translations = parseTranslationPairs(currentEntry.translationLines);
    currentEntry.fillerItems = parseFillerPairs(
      currentEntry.fillerTranslationLines,
      `${config.fileName} / Set ${currentEntry.set} / Type ${currentEntry.type}`,
    );
    delete currentEntry.translationLines;
    delete currentEntry.fillerTranslationLines;

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
    currentEntry.mainPoint =
      mainPointsBySlot.get(`${currentEntry.set}|${currentEntry.type}`) || "";
    currentEntry.mainPointSentences = splitSentences(currentEntry.mainPoint);
    currentEntry.mainPointSentenceIndexes = findMainPointSentenceIndexes(
      currentEntry.mainPoint,
      currentEntry.finalSentences,
    );
    currentEntry.mainPointSpeakingChunkIndexes = findMainPointSentenceIndexes(
      currentEntry.mainPoint,
      currentEntry.speakingChunks,
    );
    currentEntry.mainPointFillerIndexes = findMainPointSentenceIndexes(
      currentEntry.mainPoint,
      currentEntry.fillerItems.map((item) => item.english),
    );
    currentEntry.mainPointSentenceIndex = currentEntry.mainPointSentenceIndexes[0] ?? -1;
    currentEntry.mainPointSpeakingChunkIndex =
      currentEntry.mainPointSpeakingChunkIndexes[0] ?? -1;
    currentEntry.mainPointFillerIndex = currentEntry.mainPointFillerIndexes[0] ?? -1;

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
        category: "",
        questionTranslation: "",
        questionSentences: [],
        finalSentences: [],
        speakingChunks: [],
        speakingTranslations: [],
        mainPoint: "",
        mainPointSentences: [],
        mainPointSentenceIndexes: [],
        mainPointSpeakingChunkIndexes: [],
        mainPointFillerIndexes: [],
        mainPointSentenceIndex: -1,
        mainPointSpeakingChunkIndex: -1,
        mainPointFillerIndex: -1,
        translationLines: [],
        fillerTranslationLines: [],
        translations: [],
        fillerItems: [],
      };
      activeSection = "";
      continue;
    }

    if (!currentEntry) {
      continue;
    }

    match = line.match(/^- `question:`\s*(.+?)\s*$/);
    if (match) {
      currentEntry.question = cleanText(match[1]);
      continue;
    }

    match = line.match(/^(?:-\s*)?`(카테고리|유형):`\s*(.+?)\s*$/);
    if (match) {
      if (match[1] === "카테고리" || !currentEntry.category) {
        currentEntry.category = normalizeCategory(match[2]);
      }
      continue;
    }

    if (/^#####\s+/.test(line)) {
      if (/opic-final-marker|\[최종 답변\]/.test(line)) {
        activeSection = "final";
      } else if (/opic-speaking-marker|\[말하기용 버전\]/.test(line)) {
        activeSection = "speaking";
      } else if (/\[영어\+한국어\+필러 버전\]/.test(line)) {
        activeSection = "filler";
      } else if (/\[영어\+한국어 버전\]/.test(line)) {
        activeSection = "translation";
      } else {
        activeSection = "";
      }
      continue;
    }

    if (
      activeSection !== "final" &&
      activeSection !== "speaking" &&
      activeSection !== "translation" &&
      activeSection !== "filler"
    ) {
      continue;
    }

    match = line.match(/^>\s?(.*)$/);
    if (!match) {
      continue;
    }

    const quoteText = cleanText(match[1]);
    if (!quoteText) {
      continue;
    }

    if (activeSection === "final") {
      currentEntry.finalSentences.push(quoteText);
    } else if (activeSection === "speaking") {
      currentEntry.speakingChunks.push(...splitSpeakingLine(quoteText));
    } else if (activeSection === "translation") {
      currentEntry.translationLines.push(quoteText);
    } else {
      currentEntry.fillerTranslationLines.push(quoteText);
    }
  }

  finishEntry();

  return {
    ...config,
    path: path.relative(__dirname, path.resolve(sourceDir, config.fileName)).replace(/\\/g, "/"),
    entries,
  };
}

const files = sourceFiles.map(parseFile);
fillMissingCategories(files);
const stats = files.reduce(
  (total, file) => {
    total.files += 1;
    total.entries += file.entries.length;
    total.questions += file.entries.reduce((sum, entry) => sum + entry.questionSentences.length, 0);
    total.questionTranslations += file.entries.reduce(
      (sum, entry) => sum + (entry.questionTranslation ? 1 : 0),
      0,
    );
    total.categories += file.entries.reduce((sum, entry) => sum + (entry.category ? 1 : 0), 0);
    total.mainPoints += file.entries.reduce(
      (sum, entry) => sum + (entry.mainPointSentenceIndex >= 0 ? 1 : 0),
      0,
    );
    total.finalSentences += file.entries.reduce(
      (sum, entry) => sum + entry.finalSentences.length,
      0,
    );
    total.speakingChunks += file.entries.reduce(
      (sum, entry) => sum + entry.speakingChunks.length,
      0,
    );
    total.speakingTranslations += file.entries.reduce(
      (sum, entry) => sum + entry.speakingTranslations.filter(Boolean).length,
      0,
    );
    total.fillerEntries += file.entries.reduce(
      (sum, entry) => sum + (entry.fillerItems.length > 0 ? 1 : 0),
      0,
    );
    total.fillerSentences += file.entries.reduce(
      (sum, entry) => sum + entry.fillerItems.length,
      0,
    );
    total.fillerTranslations += file.entries.reduce(
      (sum, entry) => sum + entry.fillerItems.filter((item) => item.korean).length,
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
    categories: 0,
    mainPoints: 0,
    finalSentences: 0,
    speakingChunks: 0,
    speakingTranslations: 0,
    fillerEntries: 0,
    fillerSentences: 0,
    fillerTranslations: 0,
    translations: 0,
  },
);

const data = {
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
  `Loaded ${stats.files} files, ${stats.entries} entries, ${stats.questions} question sentences, ${stats.questionTranslations} question translations, ${stats.categories} categories, ${stats.mainPoints} main points, ${stats.finalSentences} final sentences, ${stats.speakingChunks} speaking chunks, ${stats.speakingTranslations} speaking translations, ${stats.fillerEntries} filler entries, ${stats.fillerSentences} filler sentences, ${stats.fillerTranslations} filler translations, ${stats.translations} final translations.`,
);

if (stats.speakingTranslations !== stats.speakingChunks) {
  console.warn(
    `Warning: ${stats.speakingChunks - stats.speakingTranslations} speaking translations are missing.`,
  );
}

if (stats.fillerTranslations !== stats.fillerSentences) {
  console.warn(
    `Warning: ${stats.fillerSentences - stats.fillerTranslations} filler translations are missing.`,
  );
}
