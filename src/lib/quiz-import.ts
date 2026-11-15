export const importTypes = ["MULTIPLE_CHOICE", "TRUE_FALSE", "IDENTIFICATION", "ESSAY"] as const;
export type ImportType = typeof importTypes[number];
export type ImportRow = { number: number; text: string; type: ImportType; choices: { label: string; text: string }[]; sectionTitle: string; directions: string; answer: string };
export type ImportSection = { title: string; directions: string; rows: ImportRow[] };

export function groupImportedSections(rows: ImportRow[]): ImportSection[] {
  const groups: ImportSection[] = [];
  for (const row of rows) {
    const current = groups[groups.length - 1];
    if (!current || (row.sectionTitle && row.sectionTitle !== current.title) || (row.directions && current.directions && row.directions !== current.directions)) {
      groups.push({ title: row.sectionTitle || current?.title || "Imported questions", directions: row.directions, rows: [row] });
    } else {
      if (!current.directions && row.directions) current.directions = row.directions;
      current.rows.push(row);
    }
  }
  return groups;
}

export function parseImportedQuestions(input: unknown): ImportRow[] | null {
  if (!input || typeof input !== "object" || !("questions" in input) || !Array.isArray(input.questions) || input.questions.length > 200) return null;
  const rows: ImportRow[] = [];
  for (const raw of input.questions) {
    if (!raw || typeof raw !== "object" || !Number.isInteger(raw.number) || raw.number < 1 || raw.number > 500 || typeof raw.text !== "string" || !raw.text.trim() || raw.text.length > 2000 || !importTypes.includes(raw.type) || !Array.isArray(raw.choices) || raw.choices.length > 4) return null;
    if (raw.choices.some((choice: unknown) => !choice || typeof choice !== "object" || !("label" in choice) || !("text" in choice) || typeof choice.label !== "string" || !["A", "B", "C", "D"].includes(choice.label) || typeof choice.text !== "string" || !choice.text.trim() || choice.text.length > 500)) return null;
    const choices = raw.choices.map((choice: { label: string; text: string }) => ({ label: choice.label, text: choice.text.trim() }));
    if (new Set(choices.map((choice: { label: string }) => choice.label)).size !== choices.length || (raw.type !== "MULTIPLE_CHOICE" && choices.length)) return null;
    if ((raw.sectionTitle !== undefined && (typeof raw.sectionTitle !== "string" || raw.sectionTitle.length > 120)) || (raw.directions !== undefined && (typeof raw.directions !== "string" || raw.directions.length > 1000))) return null;
    rows.push({ number: raw.number, text: raw.text.trim(), type: raw.type, choices, sectionTitle: raw.sectionTitle?.trim() ?? "", directions: raw.directions?.trim() ?? "", answer: "" });
  }
  return rows;
}

export function applyImportedKey(rows: ImportRow[], items: { number: number; answer: string; uncertain: boolean }[]): ImportRow[] {
  return rows.map(row => {
    const matches = items.filter(item => item.number === row.number);
    if (rows.filter(item => item.number === row.number).length !== 1 || matches.length !== 1 || matches[0].uncertain || row.type === "ESSAY") return { ...row, answer: "" };
    let answer = matches[0].answer.trim();
    if (row.type === "TRUE_FALSE" && ["TRUE", "FALSE"].includes(answer.toUpperCase())) answer = answer[0];
    if (row.type === "IDENTIFICATION") answer = answer.split("|").map(value => value.trim()).filter(Boolean).join(" | ");
    const valid = row.type === "MULTIPLE_CHOICE" ? row.choices.length >= 2 && row.choices.some(choice => choice.label === answer.toUpperCase()) : row.type === "TRUE_FALSE" ? ["T", "F"].includes(answer.toUpperCase()) : !!answer && answer.length <= 200;
    return { ...row, answer: valid ? row.type === "IDENTIFICATION" ? answer : answer.toUpperCase() : "" };
  });
}

export function parseImportedDraft(input: unknown): ImportRow[] | null {
  if (!Array.isArray(input) || !input.length) return null;
  const rows = parseImportedQuestions({ questions: input });
  if (!rows) return null;
  for (let i = 0; i < rows.length; i++) {
    const answer = input[i]?.answer;
    if (typeof answer !== "string" || answer.length > 500 || (rows[i].type === "ESSAY" && answer.trim())) return null;
    const value = answer.trim();
    if (value && ((rows[i].type === "MULTIPLE_CHOICE" && (rows[i].choices.length < 2 || !rows[i].choices.some(choice => choice.label === value.toUpperCase()))) || (rows[i].type === "TRUE_FALSE" && !["T", "F"].includes(value.toUpperCase())) || (rows[i].type === "IDENTIFICATION" && value.split("|").some((part: string) => !part.trim() || part.trim().length > 200)))) return null;
    rows[i].answer = rows[i].type === "IDENTIFICATION" ? value : value.toUpperCase();
  }
  return rows;
}
