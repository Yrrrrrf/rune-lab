export function syncHashToState(
  onOpen: (section: string) => void,
  onClose: () => void,
): () => void {
  const update = () => {
    const hash = window.location.hash;
    if (hash.startsWith("#settings")) {
      const parts = hash.split("/");
      const section = parts[1] || "general";
      onOpen(section);
    } else {
      onClose();
    }
  };

  update();
  if (typeof window !== "undefined") {
    window.addEventListener("hashchange", update);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("hashchange", update);
    }
  };
}

export function updateHashFromState(isOpen: boolean, sectionId: string) {
  if (typeof window === "undefined") return;
  if (isOpen) {
    const newHash = `#settings/${sectionId}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, "", newHash);
    }
  } else {
    if (window.location.hash.startsWith("#settings")) {
      history.pushState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }
}
