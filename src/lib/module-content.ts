export type ModulePage = { page: number; text: string };
export type SourceModule = { id: string; name: string; pages: ModulePage[] };
export type SourceExcerpt = { id: string; moduleId: string; name: string; page: number; text: string };
export const MAX_MODULES = 3;
export const MAX_PDF_BYTES = 10_000_000;
export const MAX_MODULE_PAGES = 150;
export const MAX_MODULE_CHARS = 250_000;
export const MAX_PAGE_CHARS = 8_000;
export const MAX_GENERATE_COUNT = 5;
export function validateModulePages(value: unknown): ModulePage[] | null {
  if (!Array.isArray(value) || !value.length || value.length > MAX_MODULE_PAGES) return null;
  let length = 0;
  const pages: ModulePage[] = [];
  for (let i = 0; i < value.length; i++) {
    const row = value[i];
    if (!row || row.page !== i + 1 || typeof row.text !== "string" || row.text.length > MAX_PAGE_CHARS) return null;
    length += row.text.length;
    if (length > MAX_MODULE_CHARS) return null;
    pages.push({ page: row.page, text: row.text.trim() });
  }
  return pages.some(page => page.text.length >= 40) ? pages : null;
}
function rank(page: ModulePage) {
  const heading = page.text.slice(0, 180);
  if (/^\s*(?:activity|activities|exercise|assessment|reflection|references|answer key)\b/i.test(heading)) return 2;
  if (/\b(?:lesson|discussion|overview|concept|topic|unit|chapter)\b/i.test(heading)) return 0;
  return 1;
}
/** Sample bounded excerpts across modules. This is heuristic, not a guarantee of coverage. */
export function selectExcerpts(modules: SourceModule[], excluded: string[], rotation: number): SourceExcerpt[] {
  const candidates = modules.map(module => ({ module, pages: module.pages.filter(page => page.text.trim().length >= 40 && !excluded.includes(`${module.id}:${page.page}`)).sort((a, b) => rank(a) - rank(b) || a.page - b.page) })).filter(group => group.pages.length);
  const result: SourceExcerpt[] = [];
  for (let round = 0; round < 6 && result.length < 6; round++) {
    for (const group of candidates) {
      const index = (Math.max(0, rotation) + Math.floor(round * group.pages.length / 6)) % group.pages.length;
      const page = group.pages[index];
      if (!result.some(source => source.moduleId === group.module.id && source.page === page.page)) result.push({ id: `S${result.length + 1}`, moduleId: group.module.id, name: group.module.name, page: page.page, text: page.text.slice(0, 1600) });
      if (result.length === 6) break;
    }
  }
  return result;
}
export function pageHeading(text: string): string {
  const lines = text.split(/\n+/).map(line => line.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 40);
  const genericMarker = /^(?:(?:[a-z]+\s+)?(?:learning\s+)?modules?|lesson|unit|chapter)\s*(?:no\.?\s*|#\s*)?\d+[a-z]?\s*$/i;
  const boilerplate = /^(?:page\s*)?\d+\s*$|^(?:learning objectives?|objectives?|lesson|practice|activities|activity|reflection|assessment|references|answer key)\s*:?[\s]*$/i;
  const candidate = lines.find(line => line.length >= 4 && line.length <= 90 && !genericMarker.test(line) && !boilerplate.test(line) && !/^[•●▪*\-–—]|^\d+[.)]\s/.test(line) && !/[.!]$/.test(line));
  const fallbackMarker = lines.find(line => /^(?:lesson|unit|chapter)\s*\d+[a-z]?\s*$/i.test(line));
  const fallback = lines.find(line => !genericMarker.test(line) && !boilerplate.test(line));
  return (candidate || fallbackMarker || fallback || lines[0] || "No readable text").slice(0, 90);
}
export function moduleSummary(module: SourceModule) {
  return { id: module.id, name: module.name, pages: module.pages.map(page => ({ page: page.page, readable: page.text.length >= 40, heading: pageHeading(page.text) })) };
}
export type ModuleSummary = ReturnType<typeof moduleSummary>;
