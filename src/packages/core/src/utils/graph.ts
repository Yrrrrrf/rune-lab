export interface GraphNode {
  id: string;
  dependsOn?: string[];
}

export function topologicalSort<T extends GraphNode>(nodes: T[]): T[] {
  const sorted: T[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>(); // cycle detection

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  function visit(node: T) {
    if (visited.has(node.id)) return;
    if (visiting.has(node.id)) {
      throw new Error(
        `[Graph] Circular dependency detected involving "${node.id}"`,
      );
    }

    visiting.add(node.id);

    for (const depId of node.dependsOn ?? []) {
      const dep = nodeMap.get(depId);
      if (dep) {
        visit(dep);
      }
    }

    visiting.delete(node.id);
    visited.add(node.id);
    sorted.push(node);
  }

  for (const node of nodes) {
    visit(node);
  }

  return sorted;
}
