import test from "node:test";
import assert from "node:assert/strict";
import { makeSuggestionDraft, restoreSuggestionDrafts } from "../src/lib/suggestion-drafts.ts";

const suggestion = { questionId: "q1", text: "Original?", choices: ["a","b","c","d"], answer: "B", sourceModuleId: "m1", sourceName: "Module", sourcePage: 1 };
const context = { slots: [{ id: "q1", type: "MULTIPLE_CHOICE", text: "" }], modules: [{ id: "m1", pages: [{ page: 1, readable: true }] }] };

test("restore preserves partially edited question drafts", () => {
  const draft = makeSuggestionDraft(suggestion, "MULTIPLE_CHOICE", "2");
  draft.edit.text = ""; draft.edit.choices[1] = "Changed"; draft.edit.points = "";
  const result = restoreSuggestionDrafts(JSON.stringify({ version: 1, drafts: { q1: draft } }), context);
  assert.equal(result.q1.edit.text, ""); assert.equal(result.q1.edit.choices[1], "Changed"); assert.equal(result.q1.edit.points, "");
});

test("restoration ignores saved, removed, changed, or missing-source drafts", () => {
  const draft = makeSuggestionDraft(suggestion, "MULTIPLE_CHOICE", "1");
  const raw = JSON.stringify({ version: 1, drafts: { q1: draft } });
  assert.deepEqual(Object.keys(restoreSuggestionDrafts(raw, { ...context, slots: [{ id: "q1", type: "MULTIPLE_CHOICE", text: "Saved question" }] })), []);
  assert.deepEqual(Object.keys(restoreSuggestionDrafts(raw, { ...context, slots: [{ id: "q1", type: "ESSAY", text: "" }] })), []);
  assert.deepEqual(Object.keys(restoreSuggestionDrafts(raw, { ...context, modules: [] })), []);
  assert.deepEqual(Object.keys(restoreSuggestionDrafts("not json", context)), []);
});

test("essay drafts retain rubric edits and line count", () => {
  const draft = makeSuggestionDraft({ ...suggestion, questionId: "q2", choices: [], answer: "" }, "ESSAY", "3", [{ title: "Accuracy", description: "Original", points: "3" }]);
  draft.edit.criteria[0].description = "My rubric"; draft.edit.lines = "12";
  const result = restoreSuggestionDrafts(JSON.stringify({ version: 1, drafts: { q2: draft } }), { slots: [{ id: "q2", type: "ESSAY", text: "" }], modules: context.modules });
  assert.equal(result.q2.edit.criteria[0].description, "My rubric"); assert.equal(result.q2.edit.lines, "12");
});

test("restores all drafts even when a quiz has more than 200 manual slots", () => {
  const drafts = {}; const slots = [];
  for (let n = 0; n < 205; n++) { const id = `q${n}`; drafts[id] = makeSuggestionDraft({ ...suggestion, questionId: id }, "MULTIPLE_CHOICE", "1"); slots.push({ id, type: "MULTIPLE_CHOICE", text: "" }); }
  assert.equal(Object.keys(restoreSuggestionDrafts(JSON.stringify({ version: 1, drafts }), { slots, modules: context.modules })).length, 205);
});
