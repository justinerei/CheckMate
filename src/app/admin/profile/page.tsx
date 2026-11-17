import { connection } from "next/server";
import AccountProfile, { AccountProfileHeading } from "@/app/account-profile";
import AdminShell from "../admin-shell";
import { requireAdmin } from "../require-admin";
import NotificationPreferences from "../notification-preferences";

export const instant = false;

export default async function AdminProfile() {
  await connection();
  const admin = await requireAdmin();

  return <AdminShell admin={admin} active="/admin/profile" heading={<AccountProfileHeading />}>
    <AccountProfile user={admin} role="Administrator" showHeading={false}>
      <NotificationPreferences adminId={admin.id} />
    </AccountProfile>
  </AdminShell>;
}
