export function reportDateRange(preset: "7" | "30" | "month", now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const start = new Date(`${today}T00:00:00Z`);
  if (preset === "month") start.setUTCDate(1);
  else start.setUTCDate(start.getUTCDate() - (Number(preset) - 1));
  return { from: start.toISOString().slice(0, 10), to: today };
}

export function formatReportPeriod(value: string, interval: string) {
  const date = new Date(`${value}${interval === "month" ? "-01" : ""}T00:00:00Z`);
  return new Intl.DateTimeFormat("en", interval === "month" ? { month: "long", year: "numeric", timeZone: "UTC" } : { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
