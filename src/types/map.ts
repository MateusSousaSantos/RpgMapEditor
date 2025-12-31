// src/types/map.ts

import { Prop } from './props';

export type TileId = number | null; // null = vazio

export interface MapLayer {
  name: string;
  tiles: TileId[][]; // [y][x]
  props?: Prop[];
}

export interface MapData {
  version: number;
  width: number;
  height: number;
  tileSize: number;
  layers: MapLayer[];
  metadata?: {
    name?: string;
    theme?: string;
  };
}

// Enhanced Layer interface for workspace layer management
export interface EnhancedLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0-1 range
  matrix: import('../types/textures').TileType[][];
  textureMatrix?: string[][]; // Resolved texture IDs from autotiling
  props: Prop[];
}
