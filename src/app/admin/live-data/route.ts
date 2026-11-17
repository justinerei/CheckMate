import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { getAdmin } from "../require-admin";
import type { AdminLiveData, AdminNotification } from "./types";

const dayMs = 86_400_000;
const manilaOffset = 8 * 3_600_000;
const dateKey = (time: number) => new Date(time + manilaOffset).toISOString().slice(0, 10);
const countLabel = (count: number, singular: string) => `${count} ${singular}${count === 1 ? "" : "s"}`;
const headers = { "Cache-Control": "private, no-store" };

function groupId(kind: string, members: string[]) {
  return `${kind}:${createHash("sha256").update(members.sort().join(",")).digest("hex")}`;
}

export async function GET(request: Request) {
  if (!(await getAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  const overview = new URL(request.url).searchParams.get("overview") === "1";
  const now = new Date();
  const today = dateKey(now.getTime());
  const midnight = Date.parse(`${today}T00:00:00+08:00`);
  const weekStart = new Date(midnight - 6 * dayMs);

  const [accounts, locked, failed, quizzes, pages, finalized] = await Promise.all([
    db.user.findMany({
      where: { role: { in: ["TEACHER", "STUDENT"] }, createdAt: { gte: weekStart } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    db.user.findMany({
      where: { role: { in: ["TEACHER", "STUDENT"] }, lockedUntil: { gt: now } },
      select: { id: true, lockedUntil: true },
    }),
    db.submissionPage.findMany({
      where: { status: "FAILED", retryAt: null, submission: { batchId: { not: null }, status: "IN_REVIEW" } },
      select: { id: true },
    }),
    db.quiz.count({ where: { createdAt: { gte: new Date(midnight), lt: new Date(midnight + dayMs) } } }),
    overview ? db.submissionPage.groupBy({
      by: ["status"], where: { status: { in: ["PENDING", "PROCESSING"] } }, _count: { _all: true },
    }) : [],
    overview ? db.$queryRaw<{ date: string; count: number }[]>`
      SELECT ("finalizedAt" + interval '8 hours')::date::text AS date, count(*)::int AS count
      FROM "Submission"
      WHERE status = 'FINALIZED' AND "finalizedAt" >= ${weekStart} AND "finalizedAt" <= ${now}
      GROUP BY 1` : [],
  ]);

  const notifications: AdminNotification[] = [];
  if (locked.length) notifications.push({
    id: groupId("locked", locked.map(user => `${user.id}:${user.lockedUntil?.toISOString()}`)),
    kind: "locked", title: "Locked accounts",
    detail: `${countLabel(locked.length, "account")} currently locked.`,
    href: "/admin/accounts?status=LOCKED",
  });
  if (failed.length) notifications.push({
    id: groupId("failed", failed.map(page => page.id)),
    kind: "failed", title: "Failed checks",
    detail: `${countLabel(failed.length, "page")} ready to retry.`,
    href: "/admin/queue?status=FAILED",
  });
  for (const account of accounts) notifications.push({
    id: `account:${account.id}`, kind: "account",
    title: account.role === "TEACHER" ? "New teacher account" : "New student account",
    detail: account.name, href: `/admin/accounts?q=${encodeURIComponent(account.email)}`,
    date: account.createdAt.toISOString(),
  });
  if (quizzes) notifications.push({
    id: `quiz:${today}`, kind: "quiz", title: "Daily quiz summary",
    detail: `${quizzes} new ${quizzes === 1 ? "quiz" : "quizzes"} created today.`, href: "/admin",
  });

  const data: AdminLiveData = { notifications };
  if (overview) {
    const totals = new Map(finalized.map(day => [day.date, day.count]));
    data.overview = {
      waiting: pages.find(page => page.status === "PENDING")?._count._all ?? 0,
      processing: pages.find(page => page.status === "PROCESSING")?._count._all ?? 0,
      failed: failed.length,
      activity: Array.from({ length: 7 }, (_, index) => {
        const date = dateKey(weekStart.getTime() + index * dayMs);
        return { date, count: totals.get(date) ?? 0 };
      }),
    };
  }
  return Response.json(data, { headers });
}
