export type AdminAccountFilterItem = { name: string; email: string; role: string; enabled: boolean };

export function filterAdminAccounts<T extends AdminAccountFilterItem>(users: T[], query: string, role: string, status: string): T[] {
  const term = query.trim().toLocaleLowerCase();
  return users.filter(user => (!term || `${user.name} ${user.email}`.toLocaleLowerCase().includes(term)) && (role === "ALL" || user.role === role) && (status === "ALL" || user.enabled === (status === "ACTIVE")));
}
