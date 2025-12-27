// src/commands/BatchCommand.ts
import { Command } from '../types/commands';
import { generateCommandId } from './index';

/**
 * BatchCommand groups multiple commands into a single undo/redo operation.
 * 
 * Use cases:
 * - Flood fill operations (multiple tile paints)
 * - Large area selections (box paint with many tiles)
 * - Paste operations (multiple props/tiles at once)
 * - Multi-layer operations
 * 
 * Benefits:
 * - Cleaner undo/redo history
 * - Single undo reverts entire operation
 * - Better performance (single history entry)
 */
export class BatchCommand implements Command {
  id: string;
  timestamp: number;
  type: 'batch' = 'batch';
  description: string;
  private commands: Command[];
  private executed: boolean = false;

  constructor(commands: Command[], description?: string) {
    this.id = generateCommandId('batch');
    this.timestamp = Date.now();
    this.commands = commands;
    
    // Generate description from child commands if not provided
    if (description) {
      this.description = description;
    } else {
      this.description = this.generateDescription();
    }
  }

  /**
   * Generate a human-readable description from child commands
   */
  private generateDescription(): string {
    if (this.commands.length === 0) {
      return 'Batch operation (empty)';
    }

    if (this.commands.length === 1) {
      return this.commands[0].description;
    }

    // Count commands by description for grouping
    const descCount = new Map<string, number>();
    this.commands.forEach(cmd => {
      const desc = cmd.description || 'unknown';
      descCount.set(desc, (descCount.get(desc) || 0) + 1);
    });

    // Build description
    if (descCount.size === 1) {
      const [[desc, count]] = Array.from(descCount.entries());
      return count === 1 ? desc : `${count}× ${desc}`;
    }

    // Multiple different operations
    return `Batch: ${this.commands.length} operations`;
  }

  /**
   * Execute all commands in order
   */
  execute(): void {
    if (this.executed) {
      throw new Error('BatchCommand already executed');
    }

    for (const command of this.commands) {
      command.execute();
    }

    this.executed = true;
  }

  /**
   * Undo all commands in reverse order
   */
  undo(): void {
    if (!this.executed) {
      throw new Error('Cannot undo BatchCommand that has not been executed');
    }

    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }

    this.executed = false;
  }

  /**
   * Get the number of commands in this batch
   */
  get commandCount(): number {
    return this.commands.length;
  }

  /**
   * Get the child commands (read-only)
   */
  getCommands(): readonly Command[] {
    return this.commands;
  }

  /**
   * Check if batch is empty
   */
  isEmpty(): boolean {
    return this.commands.length === 0;
  }
}

/**
 * Factory function to create a BatchCommand
 */
export const createBatchCommand = (
  commands: Command[],
  description?: string
): BatchCommand => {
  return new BatchCommand(commands, description);
};
