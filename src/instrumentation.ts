export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBatchWorker } = await import("@/lib/batch-worker");
    startBatchWorker();
  }
}
