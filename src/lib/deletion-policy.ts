export function deletionBlocked(pages: { status: string }[]) {
  return pages.some(page => page.status === "PROCESSING");
}
