import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Node's type stripping does not resolve extensionless TypeScript imports.
const source = await readFile(new URL("../src/lib/section-rubric.ts", import.meta.url), "utf8");
const rubricUrl = new URL("../src/lib/rubric.ts", import.meta.url).href;
const compiled = ts.transpileModule(source.replace('"./rubric"', JSON.stringify(rubricUrl)), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { sectionRubric, parseSharedRubric } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`);

test("detects distinct saved essay rubrics without changing either", () => {
  const criterion = (points) => [{ title: "Accuracy", description: "Correctness", maxPoints: points }];
  const essays = [{ type: "ESSAY", points: 2, rubricCriteria: criterion(2) }, { type: "ESSAY", points: 3, rubricCriteria: criterion(3) }];
  assert.equal(sectionRubric(essays, 1).differs, true);
  assert.equal(essays[1].rubricCriteria[0].maxPoints, 3);
  assert.equal(sectionRubric([{ ...essays[0] }, { ...essays[0] }], 1).differs, false);
});

test("accepts complete shared rubric criteria and rejects invalid points", () => {
  assert.deepEqual(parseSharedRubric(JSON.stringify([{ title: "Accuracy", description: "Correct facts", points: "2" }])), [{ title: "Accuracy", description: "Correct facts", maxPoints: 2 }]);
  assert.equal(parseSharedRubric(JSON.stringify([{ title: "Accuracy", description: "Correct facts", points: "0" }])), null);
  assert.equal(parseSharedRubric(JSON.stringify([{ title: "", description: "Correct facts", points: "2" }])), null);
});
