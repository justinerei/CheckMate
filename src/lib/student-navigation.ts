export function studentResultHref(id: string, origin: { from?: "overview"; classId?: string } = {}) {
  const path = `/student/results/${encodeURIComponent(id)}`;
  return origin.classId ? `${path}?fromClass=${encodeURIComponent(origin.classId)}` : origin.from === "overview" ? `${path}?from=overview` : path;
}

export function studentResultBack(from: unknown, fromClass: unknown, classroomId: string | null) {
  if (typeof fromClass === "string" && fromClass && fromClass === classroomId) return { href: `/student/classes/${encodeURIComponent(fromClass)}`, label: "Back to class", active: "classes" as const };
  if (from === "overview") return { href: "/student", label: "Back to overview", active: "overview" as const };
  return { href: "/student/results", label: "Back to results", active: "results" as const };
}

export function studentJoinBack(from: unknown) {
  return from === "classes" ? "/student/classes" : "/student";
}
