import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceFile = path.join(__dirname, "source.json");
const outputFile = path.join(__dirname, "data.js");
const data = JSON.parse(fs.readFileSync(sourceFile, "utf8"));

const expectedCounts = new Map([
  ["part2", 46],
  ["part3", 50],
  ["part4", 35],
  ["part5", 66],
]);

if (!Array.isArray(data.parts) || data.parts.length !== expectedCounts.size) {
  throw new Error(`Expected ${expectedCounts.size} TOEIC Speaking parts.`);
}

const partIds = data.parts.map((part) => part.id);
for (const requiredId of expectedCounts.keys()) {
  if (partIds.filter((id) => id === requiredId).length !== 1) {
    throw new Error(`Expected exactly one ${requiredId} section.`);
  }
}

for (const part of data.parts) {
  const expected = expectedCounts.get(part.id);
  if (!expected) {
    throw new Error(`Unexpected TOEIC Speaking part: ${part.id}`);
  }
  if (!Array.isArray(part.entries)) {
    throw new Error(`${part.id} entries must be an array.`);
  }
  if (part.entries.length !== expected) {
    throw new Error(`${part.id} should contain ${expected} entries, found ${part.entries.length}.`);
  }
  part.entries.forEach((entry, index) => {
    const expectedNumber = index + 1;
    if (entry.number !== expectedNumber) {
      throw new Error(`${part.id} numbering error: expected ${expectedNumber}, found ${entry.number}.`);
    }
    if (
      !entry.label ||
      !entry.section ||
      !Array.isArray(entry.english) ||
      !entry.english.length ||
      entry.english.some((line) => !String(line).trim()) ||
      !Array.isArray(entry.korean)
    ) {
      throw new Error(`${part.id} entry ${entry.number} is incomplete.`);
    }
    if (
      entry.english.length !== entry.korean.length ||
      entry.korean.some((line) => !String(line).trim())
    ) {
      throw new Error(`${part.id} entry ${entry.number} translation count mismatch.`);
    }
  });
}

const expectedStrategyGuides = new Map([
  ["ih-review", ["overview", "part1", "part2", "part3", "part4", "part5", "reason-bank"]],
  [
    "clock-rabbit",
    ["video-overview", "video-part1", "video-part2", "video-part3", "video-part4", "video-part5"],
  ],
]);
const expectedVideoChapters = new Map([
  ["video-overview", 0],
  ["video-part1", 0],
  ["video-part2", 914],
  ["video-part3", 1599],
  ["video-part4", 3534],
  ["video-part5", 7280],
]);
const strategyGuide = data.strategyGuide;
if (
  !strategyGuide ||
  strategyGuide.target !== "IH" ||
  !strategyGuide.title ||
  strategyGuide.defaultGuideId !== "ih-review" ||
  !Array.isArray(strategyGuide.guides) ||
  strategyGuide.guides.length !== expectedStrategyGuides.size
) {
  throw new Error("The strategy guide collection is incomplete.");
}

const strategyGuideIds = strategyGuide.guides.map((guide) => guide.id);
for (const requiredGuideId of expectedStrategyGuides.keys()) {
  if (strategyGuideIds.filter((id) => id === requiredGuideId).length !== 1) {
    throw new Error(`Expected exactly one ${requiredGuideId} strategy guide.`);
  }
}

if (!strategyGuideIds.includes(strategyGuide.defaultGuideId)) {
  throw new Error("The default strategy guide does not exist.");
}

const speechItemIds = new Set();
for (const guide of strategyGuide.guides) {
  const expectedStrategyIds = expectedStrategyGuides.get(guide.id);
  if (
    !expectedStrategyIds ||
    !guide.tab ||
    guide.target !== "IH" ||
    !guide.title ||
    !guide.summary ||
    !guide.disclaimer ||
    !Array.isArray(guide.sources) ||
    guide.sources.length < 2 ||
    !Array.isArray(guide.sections) ||
    guide.sections.length !== expectedStrategyIds.length
  ) {
    throw new Error(`Strategy guide ${guide.id || "unknown"} is incomplete.`);
  }

  if (guide.id === "clock-rabbit" && !/^https:\/\/www\.youtube\.com\//.test(guide.videoUrl || "")) {
    throw new Error("The Clock Rabbit guide needs its YouTube video URL.");
  }

  for (const source of guide.sources) {
    if (!source.label || !source.kind || !/^https:\/\//.test(source.url || "")) {
      throw new Error(`Every ${guide.id} source needs a kind, label, and HTTPS URL.`);
    }
  }

  const strategyIds = guide.sections.map((section) => section.id);
  for (const requiredId of expectedStrategyIds) {
    if (strategyIds.filter((id) => id === requiredId).length !== 1) {
      throw new Error(`Expected exactly one ${requiredId} section in ${guide.id}.`);
    }
  }

  for (const section of guide.sections) {
    if (!section.tab || !section.kicker || !section.title || !section.lead) {
      throw new Error(`Strategy section ${section.id} is missing its heading content.`);
    }
    if (!Array.isArray(section.facts) || !section.facts.length) {
      throw new Error(`Strategy section ${section.id} needs at least one fact.`);
    }
    section.facts.forEach((fact) => {
      if (!fact.label || !fact.value) {
        throw new Error(`Strategy section ${section.id} contains an incomplete fact.`);
      }
    });
    (section.timings || []).forEach((timing) => {
      if (!timing.questions || !timing.task || !timing.prep || !timing.response) {
        throw new Error(`Strategy section ${section.id} contains an incomplete timing row.`);
      }
    });
    (section.checklists || []).forEach((checklist) => {
      if (!checklist.title || !Array.isArray(checklist.items) || !checklist.items.length) {
        throw new Error(`Strategy section ${section.id} contains an incomplete checklist.`);
      }
    });
    (section.flow || []).forEach((step) => {
      if (!step.number || !step.title || !step.description) {
        throw new Error(`Strategy section ${section.id} contains an incomplete flow step.`);
      }
    });
    if (!Array.isArray(section.warnings) || !section.warnings.length) {
      throw new Error(`Strategy section ${section.id} needs at least one warning.`);
    }
    if (section.warnings.some((warning) => !String(warning).trim())) {
      throw new Error(`Strategy section ${section.id} contains an empty warning.`);
    }

    if (guide.id === "clock-rabbit") {
      const expectedStart = expectedVideoChapters.get(section.id);
      if (
        !section.chapter?.label ||
        !Number.isInteger(section.chapter.startSeconds) ||
        section.chapter.startSeconds !== expectedStart
      ) {
        throw new Error(`Strategy section ${section.id} has an invalid video chapter.`);
      }
    }

    (section.templates || []).forEach((template) => {
      if (
        !template.id ||
        !template.title ||
        !Array.isArray(template.english) ||
        !template.english.length ||
        template.english.some((line) => !String(line).trim()) ||
        !Array.isArray(template.korean) ||
        template.english.length !== template.korean.length ||
        template.korean.some((line) => !String(line).trim())
      ) {
        throw new Error(`Strategy template ${template.id || "unknown"} is incomplete.`);
      }
      if (speechItemIds.has(template.id)) {
        throw new Error(`Duplicate strategy speech item: ${template.id}.`);
      }
      speechItemIds.add(template.id);
    });
    (section.reasonGroups || []).forEach((group) => {
      if (
        !group.id ||
        !group.keywords ||
        !group.useWhen ||
        !Array.isArray(group.english) ||
        !group.english.length ||
        group.english.some((line) => !String(line).trim()) ||
        !group.korean
      ) {
        throw new Error(`Strategy reason group ${group.id || "unknown"} is incomplete.`);
      }
      if (speechItemIds.has(group.id)) {
        throw new Error(`Duplicate strategy speech item: ${group.id}.`);
      }
      speechItemIds.add(group.id);
    });
  }

  const overviewId = guide.id === "clock-rabbit" ? "video-overview" : "overview";
  const overview = guide.sections.find((section) => section.id === overviewId);
  if (!Array.isArray(overview?.timings) || overview.timings.length !== 7) {
    throw new Error(`${guide.id} overview must contain the seven official timing rows.`);
  }
}

const output = {
  ...data,
  generatedAt: new Date().toISOString(),
  stats: {
    parts: data.parts.length,
    entries: data.parts.reduce((sum, part) => sum + part.entries.length, 0),
    englishLines: data.parts.reduce(
      (sum, part) => sum + part.entries.reduce((count, entry) => count + entry.english.length, 0),
      0,
    ),
  },
};

fs.writeFileSync(outputFile, `window.TOEIC_SPEAKING_DATA = ${JSON.stringify(output, null, 2)};\n`, "utf8");
console.log(
  `Wrote ${outputFile} (${output.stats.parts} parts, ${output.stats.entries} entries, ${output.stats.englishLines} English lines).`,
);
