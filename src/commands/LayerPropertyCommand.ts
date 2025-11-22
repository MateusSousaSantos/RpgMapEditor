// src/commands/LayerPropertyCommand.ts

import { Command } from '../types/commands';
import { generateCommandId } from './index';

export type LayerProperty = 'name' | 'visible' | 'opacity';

export class LayerPropertyCommand implements Command {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly description: string;
  
  private layerIndex: number;
  private property: LayerProperty;
  private oldValue: any;
  private newValue: any;
  private updateFunction?: (index: number, value: any) => void;

  constructor(
    layerIndex: number,
    property: LayerProperty,
    oldValue: any,
    newValue: any,
    updateFunction?: (index: number, value: any) => void
  ) {
    this.layerIndex = layerIndex;
    this.property = property;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.updateFunction = updateFunction;
    
    this.id = generateCommandId('layer_property');
    this.timestamp = Date.now();
    this.description = `Change layer ${property} from "${oldValue}" to "${newValue}"`;
  }

  execute(): void {
    if (this.updateFunction) {
      this.updateFunction(this.layerIndex, this.newValue);
    }
  }

  undo(): void {
    if (this.updateFunction) {
      this.updateFunction(this.layerIndex, this.oldValue);
    }
  }

  getLayerIndex(): number {
    return this.layerIndex;
  }

  getProperty(): LayerProperty {
    return this.property;
  }
}

// Factory functions for different layer properties
export const createLayerNameCommand = (
  layerIndex: number,
  oldName: string,
  newName: string,
  updateLayerName: (index: number, name: string) => void
): LayerPropertyCommand => {
  return new LayerPropertyCommand(layerIndex, 'name', oldName, newName, updateLayerName);
};

export const createLayerVisibilityCommand = (
  layerIndex: number,
  oldVisible: boolean,
  newVisible: boolean,
  updateLayerVisibility: (index: number, visible: boolean) => void
): LayerPropertyCommand => {
  return new LayerPropertyCommand(layerIndex, 'visible', oldVisible, newVisible, updateLayerVisibility);
};

export const createLayerOpacityCommand = (
  layerIndex: number,
  oldOpacity: number,
  newOpacity: number,
  updateLayerOpacity: (index: number, opacity: number) => void
): LayerPropertyCommand => {
  return new LayerPropertyCommand(layerIndex, 'opacity', oldOpacity, newOpacity, updateLayerOpacity);
};