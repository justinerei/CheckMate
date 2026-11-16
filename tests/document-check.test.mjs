import { test } from "node:test";
import assert from "node:assert/strict";
import { documentNeedsReview, documentReviewed, paperDocumentConcern, parseDocumentCheck, parseExtraction } from "../src/lib/extraction.ts";

const question = [{ id: "q1", number: 1, section: 1 }];
const item = { number: 1, section: 1, answer: "A", status: "clear", note: "" };
const page = (kind, items = [item]) => ({ items, document: { kind, reason: "visible content" } });

test("validates classifications and treats missing or malformed classifications as uncertain", () => {
  assert.equal(parseDocumentCheck({ kind: "lyrics" }).kind, "uncertain");
  assert.equal(parseDocumentCheck(null).kind, "uncertain");
  assert.equal(documentNeedsReview(parseDocumentCheck({ kind: "other" })), true);
  assert.equal(documentNeedsReview(parseDocumentCheck({ kind: "supporting" })), false);
});

test("requires manual review for unrelated or uncertain pages even if numbers happen to match", () => {
  assert.match(paperDocumentConcern([page("other")], question, false), /may not be a student paper/);
  assert.match(paperDocumentConcern([page("uncertain")], question, false), /could not be identified/);
  assert.equal(paperDocumentConcern([page("expected")], question, false), null);
});

test("only a recorded teacher page confirmation removes its identification block", () => {
  const uncertain = page("uncertain");
  const confirmed = { ...uncertain, documentReview: { confirmed: true, teacherId: "teacher", reviewedAt: "2026-11-16T00:00:00.000Z" } };
  assert.equal(documentReviewed(confirmed), true);
  assert.equal(paperDocumentConcern([confirmed], question, false), null);
  assert.ok(paperDocumentConcern([uncertain], question, false));
  assert.ok(paperDocumentConcern([{ ...uncertain, documentReview: { confirmed: true } }], question, false));
  assert.match(paperDocumentConcern([{ ...confirmed, items: [] }], question, false), /No readings/);
  assert.equal(parseExtraction(JSON.stringify(confirmed)).documentReview, undefined);
});

test("accepts supporting pages when answers match elsewhere, but flags no matches across the paper", () => {
  assert.equal(paperDocumentConcern([page("supporting", []), page("expected")], question, false), null);
  assert.match(paperDocumentConcern([page("supporting", [])], question, false), /No readings/);
  assert.equal(paperDocumentConcern([{ items: [item] }], question, false), null);
  assert.equal(parseExtraction(JSON.stringify({ items: [item] })).document, undefined);
});
