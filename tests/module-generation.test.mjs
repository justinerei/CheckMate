import { test } from "node:test";
import assert from "node:assert/strict";
import { validateModulePages, selectExcerpts, moduleSummary, pageHeading, MAX_PAGE_CHARS } from "../src/lib/module-content.ts";
import { parseSuggestedQuestions } from "../src/lib/suggested-questions.ts";
const page = (n, text = `Lesson ${n}\n` + "Useful lesson content. ".repeat(10)) => ({ page:n, text });

test("accepts bounded text pages and rejects scanned-only, missing, oversized, or unordered input", () => {
  assert.equal(validateModulePages([page(1), page(2)])?.length, 2);
  assert.equal(validateModulePages([page(1, "")]), null);
  assert.equal(validateModulePages([page(2)]), null);
  assert.equal(validateModulePages([page(1, "x".repeat(MAX_PAGE_CHARS + 1))]), null);
  assert.equal(validateModulePages(null), null);
});
test("samples bounded pages across selected modules and honors exclusions", () => {
  const modules = [{ id:"a", name:"A.pdf", pages:Array.from({length:12},(_,i)=>page(i+1)) }, { id:"b", name:"B.pdf", pages:[page(1),page(2)] }];
  const excerpts = selectExcerpts(modules,["a:1"],0);
  assert.ok(excerpts.length <= 6);
  assert.ok(excerpts.some(item=>item.moduleId==='a') && excerpts.some(item=>item.moduleId==='b'));
  assert.ok(excerpts.every(item=>item.text.length<=1600 && !(item.moduleId==='a'&&item.page===1)));
  assert.equal(selectExcerpts(modules,modules.flatMap(m=>m.pages.map(p=>`${m.id}:${p.page}`)),0).length,0);
  assert.ok(moduleSummary(modules[0]).pages[0].heading.includes('Lesson'));
});
test("prefers lesson titles over repeated headers, page numbers, and generic labels", () => {
  assert.equal(pageHeading("ENGLISH LEARNING MODULES 1\nENGLISH MODULE 01\nSubject-Verb Agreement\nLEARNING OBJECTIVE\nChoose the correct verb."), "Subject-Verb Agreement");
  assert.equal(pageHeading("ENGLISH LEARNING MODULES 2\nENGLISH MODULE 02\nSimple Past Tense\nLEARNING OBJECTIVE\nUse the simple past."), "Simple Past Tense");
  assert.equal(pageHeading("Page 3\nLesson 2: Parts of Speech\nA noun is a word."), "Lesson 2: Parts of Speech");
  assert.equal(pageHeading("Lesson 1\nUseful lesson content."), "Lesson 1");
  assert.equal(pageHeading(""), "No readable text");
});
test("only accepts complete suggestions with valid answers and supplied source IDs", () => {
  const sources=[{id:'S1',moduleId:'m',name:'Module.pdf',page:2}];
  const item={text:'Which is correct?',choices:['one','two','three','four'],answer:'B',source:'S1'};
  const result=parseSuggestedQuestions({questions:[item]},['q1'],'MULTIPLE_CHOICE',sources);
  assert.equal(result?.[0].sourcePage,2);
  assert.equal(result?.[0].questionId,'q1');
  assert.equal(parseSuggestedQuestions({questions:[{...item,source:'S9'}]},['q1'],'MULTIPLE_CHOICE',sources),null);
  assert.equal(parseSuggestedQuestions({questions:[{...item,answer:'X'}]},['q1'],'MULTIPLE_CHOICE',sources),null);
  assert.equal(parseSuggestedQuestions({questions:[{...item,choices:['one']}]},['q1'],'MULTIPLE_CHOICE',sources),null);
  assert.equal(parseSuggestedQuestions({questions:[{...item,choices:['one','One','three','four']}]},['q1'],'MULTIPLE_CHOICE',sources),null);
  assert.equal(parseSuggestedQuestions({questions:[{...item,answer:'True'}]},['q1'],'TRUE_FALSE',sources),null);
  assert.equal(parseSuggestedQuestions({questions:[{...item,answer:'T'}]},['q1'],'TRUE_FALSE',sources)?.[0].answer,'T');
  assert.equal(parseSuggestedQuestions({questions:[{...item,answer:''}]},['q1'],'IDENTIFICATION',sources),null);
  assert.equal(parseSuggestedQuestions({questions:[{...item,answer:''}]},['q1'],'ESSAY',sources)?.[0].answer,'');
  assert.equal(parseSuggestedQuestions({questions:[]},['q1'],'ESSAY',sources),null);
});
