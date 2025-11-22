// src/types/commands.ts

import { TileType } from './textures';


// Base command interface for undo/redo system
export interface Command {
  id: string;
  timestamp: number;
  description: string;
  
  execute(): void;
  undo(): void;
}

// Types for different command parameters
export interface TileChange {
  row: number;
  col: number;
  oldValue: TileType;
  newValue: TileType;
  oldTexture?: string;
  newTexture?: string;
}

export interface LayerSnapshot {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  matrix: TileType[][];
  textureMatrix?: string[][];
}

// Grid layer types
export interface GridLayerState {
  visible: boolean;
  opacity: number;
  strokeWidth: number;
  stroke: string;
  renderOrder: 'background' | 'foreground';
}

// Command type discriminator
export type CommandType = 
  | 'paint_tiles'
  | 'layer_property'
  | 'layer_operation'
  | 'grid_config'
  | 'batch';

export interface CommandMetadata {
  type: CommandType;
  layerIndex?: number;
  affectedTiles?: number;
  batchSize?: number;
}