export function needsReviewConfirmation(dirty: boolean, current: string, destination: string) {
  return dirty && current !== destination;
}
