import { connection } from "next/server";
import AccountProfile from "@/app/account-profile";
import AdminShell from "../admin-shell";
import { requireAdmin } from "../require-admin";

export const instant = false;

export default async function AdminProfile() {
  await connection();
  const admin = await requireAdmin();

  return <AdminShell admin={admin} active="/admin/profile">
    <AccountProfile user={admin} role="Administrator" />
  </AdminShell>;
}
