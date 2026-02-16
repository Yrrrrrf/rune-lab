/**
 * Svelte action to teleport a DOM element to a different target (e.g. body)
 */
export function portal(
  node: HTMLElement,
  target: string | HTMLElement = "body",
) {
  let targetNode: HTMLElement | null;

  function update(newTarget: string | HTMLElement) {
    if (typeof newTarget === "string") {
      targetNode = document.querySelector(newTarget);
    } else {
      targetNode = newTarget;
    }

    if (targetNode) {
      targetNode.appendChild(node);
    }
  }

  update(target);

  return {
    update,
    destroy() {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    },
  };
}
