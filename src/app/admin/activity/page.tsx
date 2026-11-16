import { connection } from "next/server";
import { db } from "@/lib/db";
import AdminShell from "../admin-shell";
import ActivityHistory from "../activity-history";
import { requireAdmin } from "../require-admin";
import styles from "../admin.module.css";

export const instant = false;

export default async function ActivityPage() {
  await connection();
  const admin = await requireAdmin();
  const events = await db.adminActivity.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, action: true, reason: true, createdAt: true, actor: { select: { name: true, email: true } }, target: { select: { name: true, email: true } } },
  });
  return <AdminShell email={admin.email} active="/admin/activity" title="Activity." description="Review account and checking actions.">
    <section className={styles.section}><ActivityHistory events={events.map(event => ({ ...event, createdAt: event.createdAt.toISOString() }))} /></section>
  </AdminShell>;
}
