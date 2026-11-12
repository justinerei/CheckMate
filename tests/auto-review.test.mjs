import { test } from "node:test";
import assert from "node:assert/strict";
import { automaticDecision } from "../src/lib/auto-review.ts";

test("only unambiguous objective responses with a known mark can be checked automatically", () => {
  const item = { status: "clear", answer: "B", observedStyle: "circle", note: "" };
  assert.equal(automaticDecision([item], "circle", "MULTIPLE_CHOICE"), "FOLLOWED");
  assert.equal(automaticDecision([{ ...item, observedStyle: "box" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, observedStyle: "triangle" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, observedStyle: "unknown" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, status: "blank", answer: null }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, status: "multiple" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([item, item], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([item], "circle", "ESSAY"), null);
  assert.equal(automaticDecision([{ ...item, note: "unclear" }], "circle", "MULTIPLE_CHOICE"), null);
});


test("answer style mismatches require a teacher decision", () => {
  const item = { status: "clear", answer: "B", observedStyle: "circle", note: "" };
  assert.equal(automaticDecision([item], "written", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, observedStyle: "box" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, observedStyle: "underline" }], "written", "MULTIPLE_CHOICE"), null);
});

test("written words for a letter-only choice key require a teacher decision", () => {
  const item = { status: "clear", answer: "Lungs", observedStyle: "written", note: "" };
  assert.equal(automaticDecision([item], "written", "MULTIPLE_CHOICE", ["B"]), null);
  assert.equal(automaticDecision([item], "written", "IDENTIFICATION", ["Lungs"]), "FOLLOWED");
});

test("format review is independent of unclear text and essay scoring", async () => {
  const { hasInstructionConcern } = await import("../src/lib/auto-review.ts");
  const reading = { status: "unclear", answer: "B", observedStyle: "written", note: "Faint letter" };
  assert.equal(hasInstructionConcern([reading], "written", "MULTIPLE_CHOICE", ["B"]), false);
  assert.equal(hasInstructionConcern([reading], "text", "ESSAY"), false);
  assert.equal(hasInstructionConcern([reading, { ...reading, observedStyle: "circle" }], "written", "MULTIPLE_CHOICE"), true);
  assert.equal(hasInstructionConcern([{ ...reading, observedStyle: "unknown", markShape: "box" }], "written", "MULTIPLE_CHOICE"), true);
});
