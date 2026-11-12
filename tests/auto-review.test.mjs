import { test } from "node:test";
import assert from "node:assert/strict";
import { automaticDecision } from "../src/lib/auto-review.ts";

test("only unambiguous objective responses with a known mark can be checked automatically", () => {
  const item = { status: "clear", answer: "B", observedStyle: "circle", note: "" };
  assert.equal(automaticDecision([item], "circle", "MULTIPLE_CHOICE"), "FOLLOWED");
  assert.equal(automaticDecision([{ ...item, observedStyle: "box" }], "circle", "MULTIPLE_CHOICE"), "VIOLATION");
  assert.equal(automaticDecision([{ ...item, observedStyle: "triangle" }], "circle", "MULTIPLE_CHOICE"), "VIOLATION");
  assert.equal(automaticDecision([{ ...item, observedStyle: "unknown" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, status: "blank", answer: null }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([{ ...item, status: "multiple" }], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([item, item], "circle", "MULTIPLE_CHOICE"), null);
  assert.equal(automaticDecision([item], "circle", "ESSAY"), null);
  assert.equal(automaticDecision([{ ...item, note: "unclear" }], "circle", "MULTIPLE_CHOICE"), null);
});
