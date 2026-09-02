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
