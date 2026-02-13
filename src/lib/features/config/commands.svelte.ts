/**
 * Command Palette Store
 */
export interface Command {
  id: string;
  title: string;
  category?: string;
  icon?: string;
  action: () => void;
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
  search(query: string): Command[] {
    if (!query) return this.commands;
    const q = query.toLowerCase();
    return this.commands.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q)
    );
  }
}

export const commandStore = new CommandStore();
