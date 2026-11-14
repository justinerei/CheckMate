import test from "node:test";
import assert from "node:assert/strict";
import { matchesSearch, matchesPaperFilter } from "../src/lib/list-filter.ts";

test("search is case-insensitive, handles whitespace and matches any supplied name", () => {
  assert.equal(matchesSearch(["Science Quiz"], "  SCIENCE  "), true);
  assert.equal(matchesSearch(["Maria S.", "Maria Santos"], "santos"), true);
  assert.equal(matchesSearch(["Unnamed paper"], "maria"), false);
  assert.equal(matchesSearch(["Quiz"], "  "), true);
});

test("paper status filters include drafts and reviews only in progress", () => {
  assert.equal(matchesPaperFilter("DRAFT", "progress"), true);
  assert.equal(matchesPaperFilter("IN_REVIEW", "progress"), true);
  assert.equal(matchesPaperFilter("FINALIZED", "progress"), false);
  assert.equal(matchesPaperFilter("FINALIZED", "finalized"), true);
  assert.equal(matchesPaperFilter("IN_REVIEW", "finalized"), false);
  assert.equal(matchesPaperFilter("IN_REVIEW", "all"), true);
});
