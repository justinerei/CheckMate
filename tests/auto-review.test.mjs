import { test } from "node:test";
import assert from "node:assert/strict";
import { automaticDecision } from "../src/lib/auto-review.ts";
import { objectivePoints } from "../src/lib/scoring.ts";

test("only unambiguous objective responses with a known mark can be checked automatically", () => {
  const item = { status: "clear", answer: "B", observedStyle: "circle", note: "" };
  assert.equal(automaticDecision([item], "circle", "MULTIPLE_CHOICE"), "FOLLOWED");
  assert.equal(automaticDecision([{ ...item, observedStyle: "box" }], "circle", "MULTIPLE_CHOICE"), "VIOLATION");
  assert.equal(automaticDecision([{ ...item, observedStyle: "triangle" }], "circle", "MULTIPLE_CHOICE"), "VIOLATION");
  assert.equal(automaticDecision([{ ...item, observedStyle: "unknown" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, status: "blank", answer: null }], "circle", "MULTIPLE_CHOICE"), "FOLLOWED");
  assert.equal(automaticDecision([{ ...item, status: "multiple" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([item, item], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([item], "circle", "ESSAY"), null);
  assert.equal(automaticDecision([{ ...item, note: "unclear" }], "circle", "MULTIPLE_CHOICE"), null);
});


test("answer style mismatches require a teacher decision", () => {
  const item = { status: "clear", answer: "B", observedStyle: "circle", note: "" };
  assert.equal(automaticDecision([item], "written", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, observedStyle: "box" }], "circle", "MULTIPLE_CHOICE"), "VIOLATION");
  assert.equal(automaticDecision([{ ...item, observedStyle: "underline" }], "written", "MULTIPLE_CHOICE"), null);
});

test("only clear, unambiguous box or triangle marks violate a circle instruction", () => {
  const item = { status: "clear", answer: "B", observedStyle: "box", note: "" };
  assert.equal(automaticDecision([{ ...item, status: "unclear" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, note: "shape unclear" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, note: "The answer is boxed." }], "circle", "MULTIPLE_CHOICE"), "VIOLATION");
  assert.equal(automaticDecision([{ ...item, note: "Possibly a box" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([item, item], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([item], "box", "MULTIPLE_CHOICE"), "FOLLOWED");
  assert.equal(automaticDecision([{ ...item, observedStyle: "unknown" }], "circle", "MULTIPLE_CHOICE"), null);
});

test("automatic violations and clearly blank responses score zero even if the key matches", () => {
  const item = { status: "clear", answer: "B", observedStyle: "box", note: "" };
  const decision = automaticDecision([item], "circle", "MULTIPLE_CHOICE");
  assert.equal(objectivePoints(item.answer, ["B"], 1, decision), 0);
  const blank = { status: "blank", answer: null, note: "" };
  assert.equal(objectivePoints(blank.answer ?? "", ["B"], 1, automaticDecision([blank], "circle", "MULTIPLE_CHOICE")), 0);
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

test("no-erasure rules only penalize clear erasures when the section forbids them", async () => {
  const { forbidsErasures } = await import("../src/lib/auto-review.ts");
  const item = { status: "clear", answer: "B", observedStyle: "circle", erasure: "present", note: "" };
  assert.equal(forbidsErasures("Circle the answer. No erasures."), true);
  assert.equal(forbidsErasures("Erasures are not allowed."), true);
  assert.equal(forbidsErasures("Erasures are allowed."), false);
  assert.equal(forbidsErasures("No erasures required."), false);
  assert.equal(automaticDecision([item], "circle", "MULTIPLE_CHOICE", ["B"], "No erasures."), "VIOLATION");
  assert.equal(automaticDecision([item], "circle", "MULTIPLE_CHOICE", ["B"], ""), "FOLLOWED");
  assert.equal(automaticDecision([{ ...item, erasure: "none" }], "circle", "MULTIPLE_CHOICE", ["B"], "No erasures."), "FOLLOWED");
  assert.equal(automaticDecision([{ ...item, erasure: "uncertain" }], "circle", "MULTIPLE_CHOICE", ["B"], "No erasures."), null);
  assert.equal(automaticDecision([{ ...item, erasure: undefined }], "circle", "MULTIPLE_CHOICE", ["B"], "No erasures."), null);
  assert.equal(automaticDecision([{ ...item, note: "possibly an erasure" }], "circle", "MULTIPLE_CHOICE", ["B"], "No erasures."), null);
  assert.equal(automaticDecision([{ ...item, status: "multiple" }], "circle", "MULTIPLE_CHOICE", ["B"], "No erasures."), null);
  assert.equal(automaticDecision([item], "circle", "ESSAY", ["B"], "No erasures."), null);
  assert.equal(objectivePoints("B", ["B"], 1, automaticDecision([item], "circle", "MULTIPLE_CHOICE", ["B"], "No erasures.")), 0);
});
