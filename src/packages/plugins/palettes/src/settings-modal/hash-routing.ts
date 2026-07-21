export function parseSettingsHash(hash: string): string | null {
  if (hash === "#settings") {
    return "general";
  }
  if (hash.startsWith("#settings/")) {
    return hash.slice("#settings/".length) || "general";
  }
  return null;
}

export function formatSettingsHash(sectionId: string): string {
  return `#settings/${sectionId}`;
}
