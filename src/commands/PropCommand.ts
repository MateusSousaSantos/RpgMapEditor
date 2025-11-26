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
