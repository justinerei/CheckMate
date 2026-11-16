type AdminTransaction = {
  user: { updateMany(args: { where: { id: string; role: { in: ("TEACHER" | "STUDENT")[] }; enabled: boolean }; data: { enabled: boolean } }): Promise<{ count: number }> };
  adminActivity: { create(args: { data: { actorId: string; targetId: string; action: string } }): Promise<unknown> };
};

export async function changeAccountAccess(tx: AdminTransaction, actorId: string, targetId: string, enabled: boolean) {
  const result = await tx.user.updateMany({ where: { id: targetId, role: { in: ["TEACHER", "STUDENT"] }, enabled: !enabled }, data: { enabled } });
  if (result.count !== 1) return false;
  await tx.adminActivity.create({ data: { actorId, targetId, action: enabled ? "ACCOUNT_ENABLED" : "ACCOUNT_DISABLED" } });
  return true;
}
