import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRubric, sumCriterionScores, defaultEssayRubric } from "../src/lib/rubric.ts";

test("requires named criteria with positive points that add up to the essay total", () => {
  const criteria = [{ title: "Accuracy", description: "Correct facts", maxPoints: 3 }, { title: "Clarity", description: "Easy to follow", maxPoints: 2 }];
  assert.equal(validateRubric(criteria, 5), true);
  assert.equal(validateRubric(criteria, 4), false);
  assert.equal(validateRubric([{ ...criteria[0], title: "" }], 3), false);
  assert.equal(validateRubric([{ ...criteria[0], maxPoints: -1 }], 3), false);
});

test("validates and sums teacher scores against each criterion", () => {
  assert.equal(sumCriterionScores([{ maxPoints: 3, score: 2 }, { maxPoints: 2, score: 1.5 }]), 3.5);
  assert.equal(sumCriterionScores([{ maxPoints: 2, score: 3 }]), null);
  assert.equal(sumCriterionScores([{ maxPoints: 2, score: null }]), null);
});

test("provides three editable default criteria whose points add up", () => {
  const criteria = defaultEssayRubric(5);
  assert.deepEqual(criteria.map(c => c.title), ["Accuracy", "Explanation", "Organization"]);
  assert.deepEqual(criteria.map(c => c.maxPoints), [2, 2, 1]);
  assert.equal(validateRubric(defaultEssayRubric(1), 1), true);
});
