// src/commands/GridConfigCommand.ts

import { Command } from '../types/commands';
import { generateCommandId } from './index';

export type GridProperty = 'visible' | 'opacity' | 'strokeWidth' | 'stroke' | 'renderOrder';

export class GridConfigCommand implements Command {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly description: string;
  
  private property: GridProperty;
  private oldValue: any;
  private newValue: any;
  private updateFunction?: (value: any) => void;

  constructor(
    property: GridProperty,
    oldValue: any,
    newValue: any,
    updateFunction?: (value: any) => void
  ) {
    this.property = property;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.updateFunction = updateFunction;
    
    this.id = generateCommandId('grid_config');
    this.timestamp = Date.now();
    this.description = `Change grid ${property} from "${oldValue}" to "${newValue}"`;
  }

  execute(): void {
    if (this.updateFunction) {
      this.updateFunction(this.newValue);
    }
  }

  undo(): void {
    if (this.updateFunction) {
      this.updateFunction(this.oldValue);
    }
  }

  getProperty(): GridProperty {
    return this.property;
  }
}

// Factory functions for different grid properties
export const createGridVisibilityCommand = (
  oldVisible: boolean,
  newVisible: boolean,
  updateGridVisibility: (visible: boolean) => void
): GridConfigCommand => {
  return new GridConfigCommand('visible', oldVisible, newVisible, updateGridVisibility);
};

export const createGridOpacityCommand = (
  oldOpacity: number,
  newOpacity: number,
  updateGridOpacity: (opacity: number) => void
): GridConfigCommand => {
  return new GridConfigCommand('opacity', oldOpacity, newOpacity, updateGridOpacity);
};

export const createGridStrokeWidthCommand = (
  oldStrokeWidth: number,
  newStrokeWidth: number,
  updateGridStrokeWidth: (strokeWidth: number) => void
): GridConfigCommand => {
  return new GridConfigCommand('strokeWidth', oldStrokeWidth, newStrokeWidth, updateGridStrokeWidth);
};

export const createGridStrokeCommand = (
  oldStroke: string,
  newStroke: string,
  updateGridStroke: (stroke: string) => void
): GridConfigCommand => {
  return new GridConfigCommand('stroke', oldStroke, newStroke, updateGridStroke);
};

export const createGridRenderOrderCommand = (
  oldRenderOrder: 'background' | 'foreground',
  newRenderOrder: 'background' | 'foreground',
  updateGridRenderOrder: (renderOrder: 'background' | 'foreground') => void
): GridConfigCommand => {
  return new GridConfigCommand('renderOrder', oldRenderOrder, newRenderOrder, updateGridRenderOrder);
};