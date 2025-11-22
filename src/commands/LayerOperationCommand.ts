// src/commands/LayerOperationCommand.ts

import { Command, LayerSnapshot } from '../types/commands';
import { EnhancedLayer } from '../types/map';
import { generateCommandId } from './index';

export type LayerOperation = 'add' | 'remove' | 'duplicate' | 'move';

export class LayerOperationCommand implements Command {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly description: string;
  
  private operation: LayerOperation;
  private layerIndex: number;
  private secondaryIndex?: number; // For move operations
  private layerSnapshot?: LayerSnapshot;
  private layersSnapshot?: EnhancedLayer[];
  private addLayerFunction?: (name: string, insertIndex?: number) => void;
  private removeLayerFunction?: (index: number) => void;
  private duplicateLayerFunction?: (index: number) => void;
  private moveLayerFunction?: (fromIndex: number, toIndex: number) => void;
  private setLayersFunction?: (layers: EnhancedLayer[]) => void;

  constructor(
    operation: LayerOperation,
    layerIndex: number,
    layersSnapshot: EnhancedLayer[],
    setLayersFunction: (layers: EnhancedLayer[]) => void,
    secondaryIndex?: number,
    addLayerFunction?: (name: string, insertIndex?: number) => void,
    removeLayerFunction?: (index: number) => void,
    duplicateLayerFunction?: (index: number) => void,
    moveLayerFunction?: (fromIndex: number, toIndex: number) => void
  ) {
    this.operation = operation;
    this.layerIndex = layerIndex;
    this.secondaryIndex = secondaryIndex;
    this.layersSnapshot = [...layersSnapshot]; // Deep clone
    this.setLayersFunction = setLayersFunction;
    this.addLayerFunction = addLayerFunction;
    this.removeLayerFunction = removeLayerFunction;
    this.duplicateLayerFunction = duplicateLayerFunction;
    this.moveLayerFunction = moveLayerFunction;
    
    // Store specific layer snapshot for operations that affect a single layer
    if (layerIndex >= 0 && layerIndex < layersSnapshot.length) {
      const layer = layersSnapshot[layerIndex];
      this.layerSnapshot = {
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        matrix: layer.matrix.map(row => [...row]),
        textureMatrix: layer.textureMatrix?.map(row => [...row])
      };
    }
    
    this.id = generateCommandId('layer_operation');
    this.timestamp = Date.now();
    this.description = this.getDescription();
  }

  private getDescription(): string {
    switch (this.operation) {
      case 'add':
        return `Add new layer`;
      case 'remove':
        return `Remove layer ${this.layerIndex + 1}`;
      case 'duplicate':
        return `Duplicate layer ${this.layerIndex + 1}`;
      case 'move':
        return `Move layer from ${this.layerIndex + 1} to ${(this.secondaryIndex || 0) + 1}`;
      default:
        return `Layer operation: ${this.operation}`;
    }
  }

  execute(): void {
    switch (this.operation) {
      case 'add':
        if (this.addLayerFunction && this.layerSnapshot) {
          this.addLayerFunction(this.layerSnapshot.name, this.layerIndex);
        }
        break;
      case 'remove':
        if (this.removeLayerFunction) {
          this.removeLayerFunction(this.layerIndex);
        }
        break;
      case 'duplicate':
        if (this.duplicateLayerFunction) {
          this.duplicateLayerFunction(this.layerIndex);
        }
        break;
      case 'move':
        if (this.moveLayerFunction && this.secondaryIndex !== undefined) {
          this.moveLayerFunction(this.layerIndex, this.secondaryIndex);
        }
        break;
    }
  }

  undo(): void {
    // For undo operations, we restore the complete layers snapshot
    if (this.setLayersFunction && this.layersSnapshot) {
      // Create deep clone of the snapshot
      const restoredLayers: EnhancedLayer[] = this.layersSnapshot.map(layer => ({
        ...layer,
        matrix: layer.matrix.map(row => [...row]),
        textureMatrix: layer.textureMatrix?.map(row => [...row])
      }));
      
      this.setLayersFunction(restoredLayers);
    }
  }

  getOperation(): LayerOperation {
    return this.operation;
  }

  getLayerIndex(): number {
    return this.layerIndex;
  }

  getSecondaryIndex(): number | undefined {
    return this.secondaryIndex;
  }
}

// Factory functions for different layer operations
export const createAddLayerCommand = (
  insertIndex: number,
  layersSnapshot: EnhancedLayer[],
  addLayerFunction: (name: string, insertIndex?: number) => void,
  setLayersFunction: (layers: EnhancedLayer[]) => void
): LayerOperationCommand => {
  return new LayerOperationCommand(
    'add',
    insertIndex,
    layersSnapshot,
    setLayersFunction,
    undefined,
    addLayerFunction
  );
};

export const createRemoveLayerCommand = (
  layerIndex: number,
  layersSnapshot: EnhancedLayer[],
  removeLayerFunction: (index: number) => void,
  setLayersFunction: (layers: EnhancedLayer[]) => void
): LayerOperationCommand => {
  return new LayerOperationCommand(
    'remove',
    layerIndex,
    layersSnapshot,
    setLayersFunction,
    undefined,
    undefined,
    removeLayerFunction
  );
};

export const createDuplicateLayerCommand = (
  layerIndex: number,
  layersSnapshot: EnhancedLayer[],
  duplicateLayerFunction: (index: number) => void,
  setLayersFunction: (layers: EnhancedLayer[]) => void
): LayerOperationCommand => {
  return new LayerOperationCommand(
    'duplicate',
    layerIndex,
    layersSnapshot,
    setLayersFunction,
    undefined,
    undefined,
    undefined,
    duplicateLayerFunction
  );
};

export const createMoveLayerCommand = (
  fromIndex: number,
  toIndex: number,
  layersSnapshot: EnhancedLayer[],
  moveLayerFunction: (fromIndex: number, toIndex: number) => void,
  setLayersFunction: (layers: EnhancedLayer[]) => void
): LayerOperationCommand => {
  return new LayerOperationCommand(
    'move',
    fromIndex,
    layersSnapshot,
    setLayersFunction,
    toIndex,
    undefined,
    undefined,
    undefined,
    moveLayerFunction
  );
};