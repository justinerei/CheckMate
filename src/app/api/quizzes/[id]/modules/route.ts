import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { MAX_MODULES, moduleSummary, validateModulePages } from "@/lib/module-content";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try { if (!request.headers.get("origin") || new URL(request.headers.get("origin")!).host !== request.headers.get("host")) throw new Error(); }
  catch { return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  if (Number(request.headers.get("content-length") || 0) > 1_500_000) return NextResponse.json({ error: "The extracted module text is too large." }, { status: 413 });
  const { id } = await params;
  try {
    const input = await request.json();
    const name = typeof input?.name === "string" ? input.name.trim() : "";
    const pages = validateModulePages(input?.pages);
    if (!name || name.length > 120 || !pages) return NextResponse.json({ error: "This PDF has no usable text or exceeds the module limits. Try a text-based PDF or split it into smaller files." }, { status: 400 });
    const result = await db.$transaction(async tx => {
      const quiz = await tx.quiz.findFirst({ where: { id, teacherId: teacher.id, source: "BUILT" }, include: { _count: { select: { submissions: true, modules: true } } } });
      if (!quiz || quiz._count.submissions) return { error: "This quiz is unavailable or locked." };
      if (quiz._count.modules >= MAX_MODULES) return { error: `Add at most ${MAX_MODULES} modules to a quiz.` };
      const savedModule = await tx.quizModule.create({ data: { quizId: id, name, pages } });
      return { module: moduleSummary({ id: savedModule.id, name: savedModule.name, pages }) };
    }, { isolationLevel: "Serializable" });
    return result.error ? NextResponse.json({ error: result.error }, { status: 400 }) : NextResponse.json(result);
  } catch { return NextResponse.json({ error: "Could not save this module. Please try again." }, { status: 400 }); }
}
