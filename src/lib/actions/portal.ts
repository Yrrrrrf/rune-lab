/**
 * Svelte action to teleport a DOM element to a different target (e.g. body)
 */
export function portal(
  node: HTMLElement,
  target: string | HTMLElement = "body",
) {
  let targetNode: HTMLElement | null;
  let isTeleported = false;

  function update(newTarget: string | HTMLElement) {
    if (typeof newTarget === "string") {
      targetNode = document.querySelector(newTarget);
    } else {
      targetNode = newTarget;
    }

    if (targetNode) {
      targetNode.appendChild(node);
      isTeleported = true;
    }
  }

  update(target);

  return {
    update,
    destroy() {
      if (isTeleported && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    },
  };
}
