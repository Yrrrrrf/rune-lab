import { Either } from "effect";

export interface GraphNode {
  id: string;
  dependsOn?: string[];
}

export function topologicalSort<T extends GraphNode>(
  nodes: T[],
): Either.Either<T[], { cycle: string[] }> {
  const sorted: T[] = [];
  const visited = new Set<string>();
  const visiting: string[] = [];
  let cycleFound: string[] | null = null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  function visit(node: T): boolean {
    if (visited.has(node.id)) return true;
    const cycleIdx = visiting.indexOf(node.id);
    if (cycleIdx !== -1) {
      cycleFound = [...visiting.slice(cycleIdx), node.id];
      return false;
    }

    visiting.push(node.id);

    for (const depId of node.dependsOn ?? []) {
      const dep = nodeMap.get(depId);
      if (dep) {
        if (!visit(dep)) return false;
      }
    }

    visiting.pop();
    visited.add(node.id);
    sorted.push(node);
    return true;
  }

  for (const node of nodes) {
    if (!visit(node)) {
      return Either.left({ cycle: cycleFound ?? [node.id] });
    }
  }

  return Either.right(sorted);
}
