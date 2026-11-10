import { db } from "@/lib/db";
import { getTeacher } from "@/lib/teacher";
import { deletePhoto, writePhoto } from "@/lib/private-photos";
import { imageFormat, MAX_PHOTO_BYTES, MAX_REQUEST_BYTES, validPageNumber } from "@/lib/submission-upload";
import sharp from "sharp";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const origin = request.headers.get("origin");
  try { if (!origin || new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  catch { return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  const length = request.headers.get("content-length");
  if (!length || !/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES) return NextResponse.json({ error: "Photo must be no larger than 8 MB." }, { status: 413 });
  const { id } = await params;
  const submission = await db.submission.findFirst({ where: { id, teacherId: teacher.id, quiz: { teacherId: teacher.id }, status: "DRAFT" }, select: { expectedPages: true } });
  if (!submission?.expectedPages) return NextResponse.json({ error: "Submission is unavailable or already confirmed." }, { status: 404 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Could not read the uploaded photo." }, { status: 400 }); }
  const file = form.get("photo");
  const pageNumber = validPageNumber(String(form.get("pageNumber") ?? ""), submission.expectedPages);
  if (!(file instanceof File) || !pageNumber || file.size < 1 || file.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: "Choose a JPEG or PNG photo up to 8 MB and a valid page number." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = imageFormat(bytes);
  if (!format) return NextResponse.json({ error: "Only JPEG and PNG photos are supported." }, { status: 400 });
  try {
    const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" });
    const meta = await image.metadata();
    if (meta.format !== (format === "jpg" ? "jpeg" : "png") || !meta.width || !meta.height || (meta.pages ?? 1) > 1) throw new Error("Invalid image");
    await image.stats();
  } catch { return NextResponse.json({ error: "This photo could not be read. Try another JPEG or PNG." }, { status: 400 }); }
  let name: string;
  try { name = await writePhoto(bytes, format); } catch { return NextResponse.json({ error: "Could not save the photo. Please retry." }, { status: 500 }); }
  try {
    const saved = await db.$transaction(async tx => {
      const current = await tx.submission.findFirst({ where: { id, teacherId: teacher.id, quiz: { teacherId: teacher.id }, status: "DRAFT" }, select: { expectedPages: true } });
      if (!current?.expectedPages || pageNumber > current.expectedPages) return false;
      const existing = await tx.submissionPage.findUnique({ where: { submissionId_pageNumber: { submissionId: id, pageNumber } }, select: { id: true } });
      if (existing) return false;
      await tx.submissionPage.create({ data: { submissionId: id, pageNumber, filePath: name } });
      return true;
    }, { isolationLevel: "Serializable" });
    if (!saved) { await deletePhoto(name).catch(() => {}); return NextResponse.json({ error: "This page is already uploaded or the submission is locked. Refresh to check." }, { status: 409 }); }
  } catch { await deletePhoto(name).catch(() => {}); return NextResponse.json({ error: "Could not save this page. Refresh and retry." }, { status: 409 }); }
  return NextResponse.json({ ok: true });
}
