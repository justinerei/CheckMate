import type { SuggestedQuestion } from "./suggested-questions";
export type DraftCriterion = { title: string; description: string; points: string };
export type DraftEdit = { text: string; choices: string[]; answer: string; points: string; criteria: DraftCriterion[]; lines: string };
export type SuggestionDraft = { suggestion: SuggestedQuestion; type: string; edit: DraftEdit; revision: number };
type Context = { slots: { id: string; type: string; text: string }[]; modules: { id: string; pages: { page: number; readable: boolean }[] }[] };

export function makeSuggestionDraft(suggestion: SuggestedQuestion, type: string, points: string, criteria: DraftCriterion[] = []): SuggestionDraft {
  return { suggestion, type, revision: Date.now(), edit: { text: suggestion.text, choices: [...suggestion.choices], answer: suggestion.answer, points, criteria, lines: "7" } };
}

export function restoreSuggestionDrafts(raw: string, context: Context): Record<string, SuggestionDraft> {
  const restored: Record<string, SuggestionDraft> = Object.create(null);
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !value.drafts || typeof value.drafts !== "object" || Array.isArray(value.drafts)) return restored;
    for (const [id, candidate] of Object.entries(value.drafts)) {
      if (!candidate || typeof candidate !== "object") continue;
      const draft = candidate as SuggestionDraft;
      const slot = context.slots.find(item => item.id === id && !item.text.trim() && item.type === draft.type);
      const source = draft.suggestion;
      const page = source && context.modules.find(item => item.id === source.sourceModuleId)?.pages.find(item => item.page === source.sourcePage && item.readable);
      const edit = draft.edit;
      if (!slot || !page || source.questionId !== id || typeof source.text !== "string" || typeof source.sourceName !== "string" || typeof source.answer !== "string" || !Array.isArray(source.choices) || !source.choices.every(x => typeof x === "string") || !edit || typeof edit.text !== "string" || edit.text.length > 2000 || typeof edit.answer !== "string" || edit.answer.length > 1000 || typeof edit.points !== "string" || edit.points.length > 512 || typeof edit.lines !== "string" || edit.lines.length > 512 || !Array.isArray(edit.choices) || edit.choices.length > 4 || !edit.choices.every(x => typeof x === "string" && x.length <= 500) || !Array.isArray(edit.criteria) || edit.criteria.length > 20 || !edit.criteria.every(x => x && typeof x.title === "string" && x.title.length <= 120 && typeof x.description === "string" && x.description.length <= 500 && typeof x.points === "string" && x.points.length <= 512)) continue;
      restored[id] = { ...draft, revision: Number.isSafeInteger(draft.revision) ? draft.revision : 0 };
    }
  } catch { /* Ignore invalid or obsolete local draft data. */ }
  return restored;
}
