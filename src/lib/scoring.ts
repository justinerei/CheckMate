export function normalizeAnswer(value: string) { return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US"); }
export function matchesAnswer(value: string, accepted: string[]) { const normalized = normalizeAnswer(value); return normalized !== "" && accepted.some(answer => normalizeAnswer(answer) === normalized); }
