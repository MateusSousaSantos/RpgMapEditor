// src/commands/PaintTilesCommand.ts

import { Command, TileChange } from '../types/commands';
import { TileType } from '../types/textures';
import { generateCommandId, deepCloneTileMatrix, deepCloneTextureMatrix } from './index';

export class PaintTilesCommand implements Command {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly description: string;
  
  private layerIndex: number;
  private changes: TileChange[];
  private previousMatrix: TileType[][];
  private newMatrix: TileType[][];
  private previousTextureMatrix?: string[][];
  private newTextureMatrix?: string[][];
  private updateLayerMatrix?: (layerIndex: number, matrix: TileType[][]) => void;
  private updateLayerTextureMatrix?: (layerIndex: number, textureMatrix: string[][]) => void;

  constructor(
    layerIndex: number,
    changes: TileChange[],
    previousMatrix: TileType[][],
    newMatrix: TileType[][],
    previousTextureMatrix?: string[][],
    newTextureMatrix?: string[][],
    updateLayerMatrix?: (layerIndex: number, matrix: TileType[][]) => void,
    updateLayerTextureMatrix?: (layerIndex: number, textureMatrix: string[][]) => void
  ) {
    this.layerIndex = layerIndex;
    this.changes = changes;
    this.previousMatrix = previousMatrix;
    this.newMatrix = newMatrix;
    this.previousTextureMatrix = previousTextureMatrix;
    this.newTextureMatrix = newTextureMatrix;
    this.updateLayerMatrix = updateLayerMatrix;
    this.updateLayerTextureMatrix = updateLayerTextureMatrix;
    this.id = generateCommandId('paint_tiles');
    this.timestamp = Date.now();
    
    // Generate description based on number of changes
    if (changes.length === 1) {
      this.description = `Paint tile at (${changes[0].row}, ${changes[0].col})`;
    } else {
      this.description = `Paint ${changes.length} tiles`;
    }
  }

  execute(): void {
    if (this.updateLayerMatrix) {
      this.updateLayerMatrix(this.layerIndex, deepCloneTileMatrix(this.newMatrix));
    }
    
    if (this.updateLayerTextureMatrix && this.newTextureMatrix) {
      this.updateLayerTextureMatrix(this.layerIndex, deepCloneTextureMatrix(this.newTextureMatrix));
    }
  }

  undo(): void {
    if (this.updateLayerMatrix) {
      this.updateLayerMatrix(this.layerIndex, deepCloneTileMatrix(this.previousMatrix));
    }
    
    if (this.updateLayerTextureMatrix && this.previousTextureMatrix) {
      this.updateLayerTextureMatrix(this.layerIndex, deepCloneTextureMatrix(this.previousTextureMatrix));
    }
  }

  // Utility methods for command analysis
  getAffectedTileCount(): number {
    return this.changes.length;
  }

  getLayerIndex(): number {
    return this.layerIndex;
  }

  getChanges(): TileChange[] {
    return [...this.changes]; // Return copy to prevent mutation
  }
}

// Factory function for creating paint commands
export const createPaintTilesCommand = (
  layerIndex: number,
  changes: TileChange[],
  previousMatrix: TileType[][],
  newMatrix: TileType[][],
  updateLayerMatrix: (layerIndex: number, matrix: TileType[][]) => void,
  previousTextureMatrix?: string[][],
  newTextureMatrix?: string[][],
  updateLayerTextureMatrix?: (layerIndex: number, textureMatrix: string[][]) => void
): PaintTilesCommand => {
  return new PaintTilesCommand(
    layerIndex,
    changes,
    previousMatrix,
    newMatrix,
    previousTextureMatrix,
    newTextureMatrix,
    updateLayerMatrix,
    updateLayerTextureMatrix
  );
};