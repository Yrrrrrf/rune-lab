export function resizeWidth(
  node: HTMLElement,
  callback: (width: number) => void,
) {
  if (typeof ResizeObserver === "undefined") return;
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      callback(entry.contentRect.width);
    }
  });
  observer.observe(node);
  return {
    destroy() {
      observer.disconnect();
    },
  };
}
