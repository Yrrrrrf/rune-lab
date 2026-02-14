/**
 * Command Palette Store
 */
export interface Command {
  id: string;
  title: string;
  category?: string;
  icon?: string;
  action?: () => void;
  children?: Command[];
}

class CommandStore {
  commands = $state<Command[]>([]);

  /**
   * Register a new command
   */
  register(command: Command) {
    if (this.commands.find((c) => c.id === command.id)) return;
    this.commands.push(command);
  }

  /**
   * Remove a command
   */
  unregister(id: string) {
    this.commands = this.commands.filter((c) => c.id !== id);
  }

  /**
   * Search commands
   */
  search(query: string, parentId?: string): Command[] {
    const targetList = parentId
      ? this.findCommandById(parentId, this.commands)?.children ?? []
      : this.commands;

    if (!query) return targetList;

    const q = query.toLowerCase();
    return targetList.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q)
    );
  }

  private findCommandById(id: string, list: Command[]): Command | undefined {
    for (const cmd of list) {
      if (cmd.id === id) return cmd;
      if (cmd.children) {
        const found = this.findCommandById(id, cmd.children);
        if (found) return found;
      }
    }
    return undefined;
  }
}

export const commandStore = new CommandStore();
