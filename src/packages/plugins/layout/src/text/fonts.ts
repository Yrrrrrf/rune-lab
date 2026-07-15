export function resolveFontShorthand(themeName: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "14px sans-serif";
  }

  // Create temporary container element to fetch CSS variables of theme
  const el = document.createElement("div");
  el.setAttribute("data-theme", themeName);
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);

  const style = window.getComputedStyle(el);
  const fontSize = style.fontSize || "14px";
  const fontFamily = style.fontFamily || "sans-serif";
  document.body.removeChild(el);

  return `${fontSize} ${fontFamily}`;
}
