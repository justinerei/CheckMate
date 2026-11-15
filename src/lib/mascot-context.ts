export function batchMascotState(kind: "reading" | "queued" | "attention" | "rate_limit") {
  return kind === "reading" ? "focused" : kind === "queued" ? "ready" : "concerned";
}
