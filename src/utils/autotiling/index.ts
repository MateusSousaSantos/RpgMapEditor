// src/utils/autotiling/index.ts
export { AutotilingEngine } from './AutotilingEngine';
export { NeighborAnalyzer } from './NeighborAnalyzer';
export { TileResolver } from './TileResolver';
export { WallTileResolver } from './WallTileResolver';
export { OverlayTileResolver } from './OverlayTileResolver';
export type { TileUpdate, BatchUpdateResult } from './AutotilingEngine';
export type { Position, NeighborContext } from './NeighborAnalyzer';
export type { WallTilingVariant, OverlayTilingVariant } from '../../types/textures';
export type { OverlayTileInfo } from './OverlayTileResolver';