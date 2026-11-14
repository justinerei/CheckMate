import test from "node:test";
import assert from "node:assert/strict";
import { resultsCsv } from "../src/lib/results-csv.ts";

test("exports finalized results with spreadsheet-safe names and CSV escaping", () => {
  const csv = resultsCsv([
    { name: '  =HYPERLINK("evil")', score: '8.5', maximum: '10', finalizedAt: new Date('2026-11-20T01:02:03Z') },
    { name: 'Dela Cruz, Ana', score: '0', maximum: '10', finalizedAt: null },
    { name: 'A\nB', score: '9', maximum: '10', finalizedAt: null },
  ]);
  assert.equal(csv, '\uFEFFStudent name,Score,Maximum score,Finalized at (UTC)\r\n"\'  =HYPERLINK(""evil"")",8.5,10,2026-11-20T01:02:03.000Z\r\n"Dela Cruz, Ana",0,10,\r\n"A\nB",9,10,\r\n');
});

test("neutralizes formula prefixes even after spaces or tabs", () => {
  for (const name of ['+1', '-1', '@sum', '\t=1', '\r=1']) assert.ok(resultsCsv([{ name, score:'1', maximum:'1', finalizedAt:null }]).includes("'"));
});
