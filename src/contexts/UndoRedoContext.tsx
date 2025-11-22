// src/contexts/UndoRedoContext.tsx

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Command } from '../types/commands';

interface UndoRedoState {
  undoStack: Command[];
  redoStack: Command[];
  maxHistorySize: number;
  isExecuting: boolean; // Prevents undo operations from creating new commands
}

interface UndoRedoContextType {
  // Core undo/redo operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Command execution
  executeCommand: (command: Command) => void;
  batchCommands: (commands: Command[], description: string) => void;
  
  // History management
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
  clearHistory: () => void;
  getHistorySize: () => number;
  
  // State flags
  isExecuting: boolean;
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

// Default configuration
const DEFAULT_MAX_HISTORY_SIZE = 50;

interface UndoRedoProviderProps {
  children: ReactNode;
  maxHistorySize?: number;
}

export const UndoRedoProvider: React.FC<UndoRedoProviderProps> = ({ 
  children, 
  maxHistorySize = DEFAULT_MAX_HISTORY_SIZE 
}) => {
  const [state, setState] = useState<UndoRedoState>({
    undoStack: [],
    redoStack: [],
    maxHistorySize,
    isExecuting: false
  });

  // Execute a command and add to undo stack
  const executeCommand = useCallback((command: Command) => {
    if (state.isExecuting) return; // Prevent recursive commands during undo/redo
    
    try {
      // Set executing flag to prevent nested command creation
      setState(prev => ({ ...prev, isExecuting: true }));
      
      // Execute the command
      command.execute();
      
      // Add to undo stack and clear redo stack
      setState(prev => {
        const newUndoStack = [...prev.undoStack, command];
        
        // Trim history if needed
        if (newUndoStack.length > prev.maxHistorySize) {
          newUndoStack.shift(); // Remove oldest command
        }
        
        return {
          ...prev,
          undoStack: newUndoStack,
          redoStack: [], // Clear redo stack when new command is executed
          isExecuting: false
        };
      });
    } catch (error) {
      console.error('Failed to execute command:', error);
      setState(prev => ({ ...prev, isExecuting: false }));
    }
  }, [state.isExecuting]);

  // Batch multiple commands into a single undo operation
  const batchCommands = useCallback((commands: Command[], description: string) => {
    if (commands.length === 0) return;
    
    const batchCommand: Command = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      description,
      execute: () => {
        commands.forEach(cmd => cmd.execute());
      },
      undo: () => {
        // Undo in reverse order
        for (let i = commands.length - 1; i >= 0; i--) {
          commands[i].undo();
        }
      }
    };
    
    executeCommand(batchCommand);
  }, [executeCommand]);

  // Undo the last command
  const undo = useCallback(() => {
    if (state.undoStack.length === 0) return;
    
    const command = state.undoStack[state.undoStack.length - 1];
    
    try {
      setState(prev => ({ ...prev, isExecuting: true }));
      command.undo();
      
      setState(prev => ({
        ...prev,
        undoStack: prev.undoStack.slice(0, -1),
        redoStack: [...prev.redoStack, command],
        isExecuting: false
      }));
    } catch (error) {
      console.error('Failed to undo command:', error);
      setState(prev => ({ ...prev, isExecuting: false }));
    }
  }, [state.undoStack]);

  // Redo the last undone command
  const redo = useCallback(() => {
    if (state.redoStack.length === 0) return;
    
    const command = state.redoStack[state.redoStack.length - 1];
    
    try {
      setState(prev => ({ ...prev, isExecuting: true }));
      command.execute();
      
      setState(prev => ({
        ...prev,
        undoStack: [...prev.undoStack, command],
        redoStack: prev.redoStack.slice(0, -1),
        isExecuting: false
      }));
    } catch (error) {
      console.error('Failed to redo command:', error);
      setState(prev => ({ ...prev, isExecuting: false }));
    }
  }, [state.redoStack]);

  // Get description of the next undo operation
  const getUndoDescription = useCallback(() => {
    if (state.undoStack.length === 0) return null;
    return state.undoStack[state.undoStack.length - 1].description;
  }, [state.undoStack]);

  // Get description of the next redo operation
  const getRedoDescription = useCallback(() => {
    if (state.redoStack.length === 0) return null;
    return state.redoStack[state.redoStack.length - 1].description;
  }, [state.redoStack]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      undoStack: [],
      redoStack: []
    }));
  }, []);

  // Get total history size
  const getHistorySize = useCallback(() => {
    return state.undoStack.length + state.redoStack.length;
  }, [state.undoStack.length, state.redoStack.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const value: UndoRedoContextType = {
    undo,
    redo,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    executeCommand,
    batchCommands,
    getUndoDescription,
    getRedoDescription,
    clearHistory,
    getHistorySize,
    isExecuting: state.isExecuting
  };

  return (
    <UndoRedoContext.Provider value={value}>
      {children}
    </UndoRedoContext.Provider>
  );
};

// Hook to use undo/redo context
export const useUndoRedo = () => {
  const context = useContext(UndoRedoContext);
  if (context === undefined) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider');
  }
  return context;
};