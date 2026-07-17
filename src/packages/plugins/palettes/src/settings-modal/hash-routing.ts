export function syncHashToState(
  onOpen: (section: string) => void,
  onClose: () => void,
): () => void {
  const update = () => {
    const hash = globalThis.location.hash;
    if (hash.startsWith("#settings")) {
      const parts = hash.split("/");
      const section = parts[1] || "general";
      onOpen(section);
    } else {
      onClose();
    }
  };

  update();
  if (typeof globalThis !== "undefined") {
    globalThis.addEventListener("hashchange", update);
  }
  return () => {
    if (typeof globalThis !== "undefined") {
      globalThis.removeEventListener("hashchange", update);
    }
  };
}

export function updateHashFromState(isOpen: boolean, sectionId: string) {
  if (typeof globalThis === "undefined") return;
  if (isOpen) {
    const newHash = `#settings/${sectionId}`;
    if (globalThis.location.hash !== newHash) {
      history.replaceState(null, "", newHash);
    }
  } else {
    if (globalThis.location.hash.startsWith("#settings")) {
      history.pushState(
        null,
        "",
        globalThis.location.pathname + globalThis.location.search,
      );
    }
  }
}
