export function printDocumentTitle(title: string, kind: "quiz" | "answer-key") {
  const name = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().replace(/[. ]+$/g, "").slice(0, 120).trim() || "Untitled quiz";
  return `${name} - ${kind === "quiz" ? "Quiz" : "Answer Key"}`;
}
