export function isCurrentClient(client: { pendingPhotoDeletion?: { findFirst?: unknown }; quizModule?: { findFirst?: unknown }; quiz?: { fields?: { archivedAt?: unknown } }; quizSection?: { fields?: { questionLayout?: unknown } } } | undefined) {
  return typeof client?.pendingPhotoDeletion?.findFirst === "function" && typeof client?.quizModule?.findFirst === "function" && client?.quiz?.fields?.archivedAt != null && client?.quizSection?.fields?.questionLayout != null;
}
