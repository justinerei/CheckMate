export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items;
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}
export function isValidSectionOrder(order: unknown, expected: unknown, current: string[]): boolean {
  if (!Array.isArray(order) || !Array.isArray(expected) || !order.length || order.length > 500 || order.length !== current.length || expected.length !== current.length) return false;
  if (order.some(id => typeof id !== "string" || !id || id.length > 200) || expected.some(id => typeof id !== "string") || new Set(order).size !== order.length) return false;
  return current.every((id, index) => id === expected[index]) && order.every(id => current.includes(id));
}
