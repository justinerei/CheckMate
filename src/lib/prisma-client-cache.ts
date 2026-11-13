export function isCurrentClient(client: { pendingPhotoDeletion?: { findFirst?: unknown } } | undefined) {
  return typeof client?.pendingPhotoDeletion?.findFirst === "function";
}
