export function mutedNotificationKinds(value: string | null): Set<string> {
  return new Set(value === null ? ["account", "quiz"] : value.split(",").filter(Boolean));
}
