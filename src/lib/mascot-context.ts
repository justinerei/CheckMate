export function batchMascotState(kind: "reading" | "queued" | "attention" | "rate_limit") {
  return kind === "reading" ? "thinking" : kind === "queued" ? "ready" : "concerned";
}
