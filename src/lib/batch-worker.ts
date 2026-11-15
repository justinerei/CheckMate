import { Client } from "pg";
import { db } from "@/lib/db";
import { extractPage } from "@/lib/extract-page";
import { deletePhoto } from "@/lib/private-photos";

// A database advisory lock serializes batch requests across server processes.
async function processNext() {
  if (!process.env.DATABASE_URL) return;
  const lock = new Client({ connectionString: process.env.DATABASE_URL });
  await lock.connect();
  let held = false;
  try {
    const result = await lock.query("SELECT pg_try_advisory_lock(731828491) AS held");
    held = result.rows[0].held;
    if (!held) return;
    const cleanup = await db.pendingPhotoDeletion.findFirst({ orderBy: { createdAt: "asc" } });
    if (cleanup) {
      let removed = false;
      try { await deletePhoto(cleanup.filePath); removed = true; }
      catch (error) { removed = (error as NodeJS.ErrnoException).code === "ENOENT"; }
      if (removed) await db.pendingPhotoDeletion.deleteMany({ where: { filePath: cleanup.filePath } });
    }
    if (!process.env.GROQ_API_KEY) return;
    const now = new Date();
    const waiting = await db.submissionPage.findFirst({ where: { submission: { batchId: { not: null }, status: "IN_REVIEW" }, status: "FAILED", retryAt: { gt: now } }, select: { id: true } });
    if (waiting) return;
    const page = await db.submissionPage.findFirst({
      where: { submission: { batchId: { not: null }, status: "IN_REVIEW" }, OR: [{ status: "PENDING" }, { status: "FAILED", retryAt: { lte: now } }, { status: "PROCESSING", processingStartedAt: { lt: new Date(now.getTime() - 180000) } }] },
      orderBy: { createdAt: "asc" },
      select: { id: true, submissionId: true, submission: { select: { teacherId: true } } },
    });
    if (page) await extractPage(page.submission.teacherId, page.submissionId, page.id);
  } finally {
    if (held) await lock.query("SELECT pg_advisory_unlock(731828491)");
    await lock.end();
  }
}

const worker = globalThis as typeof globalThis & { checkMateWorker?: boolean };
export function startBatchWorker() {
  if (worker.checkMateWorker) return;
  worker.checkMateWorker = true;
  const tick = async () => {
    try { await processNext(); } catch { /* Retry on the next tick after transient database errors. */ }
    setTimeout(tick, 3000);
  };
  void tick();
}
