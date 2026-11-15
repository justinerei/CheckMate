import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuestion } from "../src/lib/question-input.ts";

test("validates multiple-choice answers and required choices", () => {
  const data = new FormData();
  data.set("type", "MULTIPLE_CHOICE"); data.set("text", "Question?"); data.set("points", "2");
  data.set("choiceA", "One"); data.set("choiceB", "Two"); data.set("answer", "B");
  assert.equal(parseQuestion(data)?.answer, "B");
  data.set("answer", "C"); assert.equal(parseQuestion(data), null);
});

test("rejects empty identification answers and invalid scores", () => {
  const data = new FormData(); data.set("type", "IDENTIFICATION"); data.set("text", "Name it"); data.set("points", "1");
  assert.equal(parseQuestion(data), null);
  data.set("answer", "Mars, mars planet"); assert.deepEqual(parseQuestion(data)?.acceptedAnswers, ["Mars", "mars planet"]);
  data.set("points", "-1"); assert.equal(parseQuestion(data), null);
});

test("essay rubric points must add up to the question total", () => {
  const data = new FormData(); data.set("type", "ESSAY"); data.set("text", "Explain"); data.set("points", "10"); data.set("lines", "7");
  data.set("rubric", "Accuracy | Correct facts | 5\nClarity | Clear reasoning | 5");
  assert.equal(parseQuestion(data)?.criteria.length, 2);
  data.set("rubric", "Accuracy | Correct facts | 4"); assert.equal(parseQuestion(data), null);
});

test("the editor preserves commas inside identification answers", () => {
  const data = new FormData(); data.set("type", "IDENTIFICATION"); data.set("text", "Where?"); data.set("points", "1");
  data.set("answerDelimiter", "pipe"); data.set("answer", "Manila, Philippines | Manila");
  assert.deepEqual(parseQuestion(data)?.acceptedAnswers, ["Manila, Philippines", "Manila"]);
});
