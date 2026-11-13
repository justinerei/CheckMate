import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { validateModulePages } from "@/lib/module-content";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; moduleId: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const { id, moduleId } = await params;
  const number = Number(new URL(request.url).searchParams.get("page"));
  if (!Number.isInteger(number) || number < 1 || number > 150) return NextResponse.json({ error: "Invalid page." }, { status: 400 });
  const sourceModule = await db.quizModule.findFirst({ where: { id: moduleId, quizId: id, quiz: { teacherId: teacher.id } } });
  const pages = sourceModule ? validateModulePages(sourceModule.pages) : null;
  const page = pages?.find(item => item.page === number && item.text.length >= 40);
  if (!page) return NextResponse.json({ error: "Source page not found." }, { status: 404 });
  return NextResponse.json({ text: page.text.slice(0, 1600) }, { headers: { "Cache-Control": "no-store" } });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; moduleId: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try { if (!request.headers.get("origin") || new URL(request.headers.get("origin")!).host !== request.headers.get("host")) throw new Error(); }
  catch { return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  const { id, moduleId } = await params;
  const removed = await db.quizModule.deleteMany({ where: { id: moduleId, quizId: id, quiz: { teacherId: teacher.id } } });
  return removed.count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Module not found." }, { status: 404 });
}
