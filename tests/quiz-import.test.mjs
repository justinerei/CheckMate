import { test } from "node:test";
import assert from "node:assert/strict";
import { parseImportedQuestions, applyImportedKey } from "../src/lib/quiz-import.ts";

test("keeps printed questions and choices without inventing answers", () => {
  const rows = parseImportedQuestions({ questions: [{ number: 1, text: "What is 2 + 2?", type: "MULTIPLE_CHOICE", choices: [{ label: "A", text: "3" }, { label: "B", text: "4" }], sectionTitle: "Math", directions: "Choose one" }] });
  assert.equal(rows?.[0].answer, "");
  assert.equal(rows?.[0].choices[1].text, "4");
  assert.equal(rows?.[0].sectionTitle, "Math");
  assert.equal(parseImportedQuestions({ questions: [{ number: 1, text: "", type: "ESSAY", choices: [] }] }), null);
});

test("only matches clear, unambiguous answer key entries by question number", () => {
  const rows = parseImportedQuestions({ questions: [{ number: 1, text: "Example?", type: "MULTIPLE_CHOICE", choices: [{ label: "A", text: "yes" }, { label: "B", text: "no" }] }, { number: 2, text: "True?", type: "TRUE_FALSE", choices: [] }] });
  assert.equal(applyImportedKey(rows, [{ number: 1, answer: "B", uncertain: false }, { number: 2, answer: "T", uncertain: true }])[0].answer, "B");
  assert.equal(applyImportedKey(rows, [{ number: 2, answer: "T", uncertain: true }])[1].answer, "");
  assert.equal(applyImportedKey(rows, [{ number: 1, answer: "A", uncertain: false }, { number: 1, answer: "B", uncertain: false }])[0].answer, "");
  assert.equal(applyImportedKey(rows, [{ number: 1, answer: "D", uncertain: false }])[0].answer, "");
  assert.equal(applyImportedKey([rows[0], { ...rows[0] }], [{ number: 1, answer: "B", uncertain: false }])[0].answer, "");
  assert.equal(applyImportedKey([{ ...rows[0], choices: [{ label: "B", text: "no" }] }], [{ number: 1, answer: "B", uncertain: false }])[0].answer, "");
});

test("validates editable drafts while allowing answers to be missing", async () => {
  const { parseImportedDraft } = await import("../src/lib/quiz-import.ts");
  const row = { number: 1, text: "Question?", type: "MULTIPLE_CHOICE", choices: [{ label: "A", text: "One" }, { label: "B", text: "Two" }], answer: "", sectionTitle: "", directions: "" };
  assert.equal(parseImportedDraft([row])?.[0].answer, "");
  assert.equal(parseImportedDraft([{ ...row, answer: "B" }])?.[0].answer, "B");
  assert.equal(parseImportedDraft([{ ...row, answer: "D" }]), null);
  assert.equal(parseImportedDraft([{ ...row, choices: [], answer: "A" }]), null);
});

test("normalizes clear true/false and identification answer-key entries", async () => {
  const rows = parseImportedQuestions({ questions: [{ number: 1, text: "A statement", type: "TRUE_FALSE", choices: [] }, { number: 2, text: "Name it", type: "IDENTIFICATION", choices: [] }] });
  const result = applyImportedKey(rows, [{ number: 1, answer: "True", uncertain: false }, { number: 2, answer: "Mars | Red Planet", uncertain: false }]);
  assert.equal(result[0].answer, "T");
  assert.equal(result[1].answer, "Mars | Red Planet");
  const comma = applyImportedKey(rows, [{ number: 2, answer: "Manila, Philippines", uncertain: false }]);
  assert.equal(comma[1].answer, "Manila, Philippines");
  const { parseImportedDraft } = await import("../src/lib/quiz-import.ts");
  assert.equal(parseImportedDraft(comma)?.[1].answer, "Manila, Philippines");
});

test("keeps section boundaries and carries later visible instructions into each section", async () => {
  const { groupImportedSections, parseImportedDraft } = await import("../src/lib/quiz-import.ts");
  const rows = parseImportedDraft([
    { number: 1, text: "One", type: "IDENTIFICATION", choices: [], answer: "", sectionTitle: "Part A", directions: "" },
    { number: 2, text: "Two", type: "IDENTIFICATION", choices: [], answer: "", sectionTitle: "", directions: "Write answers" },
    { number: 3, text: "Three", type: "ESSAY", choices: [], answer: "", sectionTitle: "Part B", directions: "Explain" },
  ]);
  const groups = groupImportedSections(rows);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].directions, "Write answers");
  assert.equal(groups[0].rows.length, 2);
  assert.equal(groups[1].title, "Part B");
});
