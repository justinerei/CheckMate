export function isCurrentClient(client: { pendingPhotoDeletion?: { findFirst?: unknown }; quizModule?: { findFirst?: unknown } } | undefined) {
  return typeof client?.pendingPhotoDeletion?.findFirst === "function" && typeof client?.quizModule?.findFirst === "function";
}
