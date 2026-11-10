import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { deletePhoto, readPhoto } from "@/lib/private-photos";
import { privatePhotoPath } from "@/lib/submission-upload";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; pageId: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return new Response(null, { status: 401 });
  const { id, pageId } = await params;
  const page = await db.submissionPage.findFirst({ where: { id: pageId, submissionId: id, submission: { teacherId: teacher.id, quiz: { teacherId: teacher.id } } }, select: { filePath: true } });
  if (!page || !privatePhotoPath(page.filePath)) return new Response(null, { status: 404 });
  try {
    const data = await readPhoto(page.filePath);
    return new Response(data, { headers: { "Content-Type": page.filePath.endsWith(".png") ? "image/png" : "image/jpeg", "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
  } catch { return new Response(null, { status: 404 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; pageId: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const origin = request.headers.get("origin");
  try { if (!origin || new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  catch { return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  const { id, pageId } = await params;
  let filePath: string | null = null;
  try {
    filePath = await db.$transaction(async tx => {
      const page = await tx.submissionPage.findFirst({ where: { id: pageId, submissionId: id, submission: { teacherId: teacher.id, quiz: { teacherId: teacher.id }, status: "DRAFT" } }, select: { filePath: true } });
      if (!page || !privatePhotoPath(page.filePath)) return null;
      const deleted = await tx.submissionPage.deleteMany({ where: { id: pageId, submissionId: id, submission: { teacherId: teacher.id, status: "DRAFT" } } });
      return deleted.count ? page.filePath : null;
    }, { isolationLevel: "Serializable" });
  } catch { return NextResponse.json({ error: "Could not remove the page. Refresh and try again." }, { status: 409 }); }
  if (!filePath) return NextResponse.json({ error: "Page is unavailable or submission is locked." }, { status: 404 });
  try { await deletePhoto(filePath); } catch { console.error("Could not remove a private submission photo after deleting its record."); }
  return NextResponse.json({ ok: true });
}
