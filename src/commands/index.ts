// src/commands/index.ts

// Utility functions for command system
export const generateCommandId = (type: string): string => {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const deepCloneMatrix = <T>(matrix: T[][]): T[][] => {
  return matrix.map(row => [...row]);
};

export const deepCloneTileMatrix = (matrix: import('../types/textures').TileType[][]): import('../types/textures').TileType[][] => {
  return matrix.map(row => [...row]);
};

export const deepCloneTextureMatrix = (matrix: string[][]): string[][] => {
  return matrix.map(row => [...row]);
};

// Re-export all command classes and factory functions
export * from './PaintTilesCommand';
export * from './LayerPropertyCommand';
export * from './LayerOperationCommand';
export * from './GridConfigCommand';