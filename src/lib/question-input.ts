type Kind = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "IDENTIFICATION" | "ESSAY";
export function parseQuestion(form: FormData) {
  const field = (name: string) => String(form.get(name) ?? "").trim();
  const type = field("type") as Kind;
  const text = field("text");
  const points = Number(field("points"));
  if (!["MULTIPLE_CHOICE", "TRUE_FALSE", "IDENTIFICATION", "ESSAY"].includes(type) || !text || text.length > 2000 || !field("points") || !Number.isFinite(points) || points <= 0 || points > 9999 || !/^\d+(\.\d{1,2})?$/.test(field("points"))) return null;
  const choices = ["A", "B", "C", "D"].map(label => ({ label, text: field(`choice${label}`) })).filter(choice => choice.text);
  const answer = field("answer");
  let acceptedAnswers: string[] = [];
  let criteria: { title: string; description: string; maxPoints: number }[] = [];
  if (type === "MULTIPLE_CHOICE") {
    if (choices.length < 2 || !choices.some(choice => choice.label === answer)) return null;
    acceptedAnswers = [answer];
  } else if (type === "TRUE_FALSE") {
    if (!["T", "F"].includes(answer)) return null;
    acceptedAnswers = [answer];
  } else if (type === "IDENTIFICATION") {
    acceptedAnswers = answer.split(",").map(s => s.trim()).filter(Boolean);
    if (!acceptedAnswers.length || acceptedAnswers.some(s => s.length > 200)) return null;
  } else {
    criteria = field("rubric").split("\n").filter(line => line.trim()).map(line => {
      const [title, description, rawPoints, ...rest] = line.split("|").map(s => s.trim());
      return { title: title ?? "", description: description ?? "", maxPoints: rest.length || !/^\d+(\.\d{1,2})?$/.test(rawPoints ?? "") ? NaN : Number(rawPoints) };
    });
    if (!criteria.length || criteria.some(c => !c.title || !c.description || !Number.isFinite(c.maxPoints) || c.maxPoints <= 0) || Math.round(criteria.reduce((n, c) => n + c.maxPoints, 0) * 100) !== Math.round(points * 100)) return null;
  }
  const essayLineCount = type === "ESSAY" ? Number(field("lines")) : null;
  if (type === "ESSAY" && (!Number.isInteger(essayLineCount) || !essayLineCount || essayLineCount < 1 || essayLineCount > 30)) return null;
  return { type, text, points, choices, answer, acceptedAnswers, criteria, essayLineCount, besideNext: form.get("besideNext") === "on" };
}
