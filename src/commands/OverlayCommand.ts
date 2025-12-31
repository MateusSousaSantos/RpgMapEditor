// src/commands/OverlayCommand.ts

import { Command } from '../types/commands';

/**
 * Command for managing overlay tiles with undo/redo support
 */
export class OverlayCommand implements Command {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly description: string;
  
  private layerIndex: number;
  private previousOverlayMatrix: string[][][];
  private newOverlayMatrix: string[][][];
  private updateLayerOverlayMatrix?: (layerIndex: number, overlayMatrix: string[][][]) => void;

  constructor(
    layerIndex: number,
    row: number,
    col: number,
    previousOverlayMatrix: string[][][],
    newOverlayMatrix: string[][][],
    updateLayerOverlayMatrix?: (layerIndex: number, overlayMatrix: string[][][]) => void,
    isRemoval: boolean = false
  ) {
    this.id = `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = Date.now();
    this.description = isRemoval 
      ? `Remove overlay at (${row}, ${col})`
      : `Add overlay at (${row}, ${col})`;
    
    this.layerIndex = layerIndex;
    this.previousOverlayMatrix = previousOverlayMatrix;
    this.newOverlayMatrix = newOverlayMatrix;
    this.updateLayerOverlayMatrix = updateLayerOverlayMatrix;
  }

  execute(): void {
    if (this.updateLayerOverlayMatrix) {
      this.updateLayerOverlayMatrix(this.layerIndex, this.newOverlayMatrix);
    }
  }

  undo(): void {
    if (this.updateLayerOverlayMatrix) {
      this.updateLayerOverlayMatrix(this.layerIndex, this.previousOverlayMatrix);
    }
  }
}
