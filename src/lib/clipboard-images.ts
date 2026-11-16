export function clipboardImages(items: ArrayLike<Pick<DataTransferItem, "kind" | "type" | "getAsFile">>): File[] {
  return Array.from(items).filter(item => item.kind === "file" && item.type.startsWith("image/")).flatMap(item => {
    const file = item.getAsFile();
    return file ? [file] : [];
  });
}

export function isTextEditingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('input:not([type="file"]), textarea, select, [contenteditable]:not([contenteditable="false"])');
}
