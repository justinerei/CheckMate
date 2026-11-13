import { NextResponse } from "next/server";
import { getTeacher } from "@/lib/teacher";
import { extractPage } from "@/lib/extract-page";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; pageId: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try { if (!request.headers.get("origin") || new URL(request.headers.get("origin")!).host !== request.headers.get("host")) throw new Error(); }
  catch { return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  const { id, pageId } = await params;
  return extractPage(teacher.id, id, pageId);
}
