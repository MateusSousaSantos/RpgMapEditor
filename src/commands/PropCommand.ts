// src/commands/PropCommand.ts

import { Command } from '../types/commands';
import { Prop } from '../types/props';
import { generateCommandId } from './index';

export class AddPropCommand implements Command {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly description: string;
  
  private layerIndex: number;
  private prop: Prop;
  private updateLayerProps?: (layerIndex: number, updater: (props: Prop[]) => Prop[]) => void;

  constructor(
    layerIndex: number,
    prop: Prop,
    updateLayerProps?: (layerIndex: number, updater: (props: Prop[]) => Prop[]) => void
  ) {
    this.layerIndex = layerIndex;
    this.prop = prop;
    this.updateLayerProps = updateLayerProps;
    this.id = generateCommandId('add_prop');
    this.timestamp = Date.now();
    this.description = `Add prop '${prop.type}' at (${Math.round(prop.x)}, ${Math.round(prop.y)})`;
  }

  execute(): void {
    if (this.updateLayerProps) {
      this.updateLayerProps(this.layerIndex, (props) => [...props, this.prop]);
    }
  }

  undo(): void {
    if (this.updateLayerProps) {
      this.updateLayerProps(this.layerIndex, (props) => 
        props.filter(p => p.id !== this.prop.id)
      );
    }
  }
}

export class RemovePropCommand implements Command {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly description: string;
  
  private layerIndex: number;
  private prop: Prop;
  private propIndex: number;
  private updateLayerProps?: (layerIndex: number, updater: (props: Prop[]) => Prop[]) => void;

  constructor(
    layerIndex: number,
    prop: Prop,
    propIndex: number,
    updateLayerProps?: (layerIndex: number, updater: (props: Prop[]) => Prop[]) => void
  ) {
    this.layerIndex = layerIndex;
    this.prop = prop;
    this.propIndex = propIndex;
    this.updateLayerProps = updateLayerProps;
    this.id = generateCommandId('remove_prop');
    this.timestamp = Date.now();
    this.description = `Remove prop '${prop.type}' from (${Math.round(prop.x)}, ${Math.round(prop.y)})`;
  }

  execute(): void {
    if (this.updateLayerProps) {
      this.updateLayerProps(this.layerIndex, (props) => 
        props.filter(p => p.id !== this.prop.id)
      );
    }
  }

  undo(): void {
    if (this.updateLayerProps) {
      this.updateLayerProps(this.layerIndex, (props) => {
        const newProps = [...props];
        newProps.splice(this.propIndex, 0, this.prop);
        return newProps;
      });
    }
  }
}

export class UpdatePropCommand implements Command {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly description: string;
  
  private layerIndex: number;
  private propId: string;
  private oldProp: Prop;
  private newProp: Prop;
  private updateLayerProps?: (layerIndex: number, updater: (props: Prop[]) => Prop[]) => void;

  constructor(
    layerIndex: number,
    propId: string,
    oldProp: Prop,
    newProp: Prop,
    updateLayerProps?: (layerIndex: number, updater: (props: Prop[]) => Prop[]) => void
  ) {
    this.layerIndex = layerIndex;
    this.propId = propId;
    this.oldProp = oldProp;
    this.newProp = newProp;
    this.updateLayerProps = updateLayerProps;
    this.id = generateCommandId('update_prop');
    this.timestamp = Date.now();
    
    // Determine what changed for description
    const changes: string[] = [];
    if (oldProp.x !== newProp.x || oldProp.y !== newProp.y) {
      changes.push('position');
    }
    if (oldProp.width !== newProp.width || oldProp.height !== newProp.height) {
      changes.push('size');
    }
    if ((oldProp.rotation || 0) !== (newProp.rotation || 0)) {
      changes.push('rotation');
    }
    
    this.description = `Update prop '${newProp.type}': ${changes.join(', ') || 'attributes'}`;
  }

  execute(): void {
    if (this.updateLayerProps) {
      this.updateLayerProps(this.layerIndex, (props) =>
        props.map(p => (p.id === this.propId ? this.newProp : p))
      );
    }
  }

  undo(): void {
    if (this.updateLayerProps) {
      this.updateLayerProps(this.layerIndex, (props) =>
        props.map(p => (p.id === this.propId ? this.oldProp : p))
      );
    }
  }
}
