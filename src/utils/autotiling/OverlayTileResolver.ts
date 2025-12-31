// src/utils/autotiling/OverlayTileResolver.ts

import { OverlayTilingVariant, TilesetRegistry } from '../../types/textures';

/**
 * OverlayTileResolver handles the special logic for overlay tiles.
 * Overlay tiles consist of 9 sprites:
 * - 1 center tile placed at the overlay tile position
 * - 8 surrounding tiles that "infiltrate" adjacent tiles as overlays
 * 
 * These overlay tiles do NOT replace existing tiles but render on top of them.
 */
export interface OverlayTileInfo {
  position: { row: number; col: number };
  variant: OverlayTilingVariant;
  textureId: string;
}

export class OverlayTileResolver {
  private tilesetId: string;

  constructor(tilesetId: string = 'default_overlay') {
    this.tilesetId = tilesetId;
  }

  /**
   * Resolves all overlay tiles for a given position where an overlay tile is placed.
   * Returns an array of overlay tile information for the center and all 8 directions.
   */
  resolveOverlayTiles(row: number, col: number): OverlayTileInfo[] {
    const overlays: OverlayTileInfo[] = [];

    // Add center tile at the current position
    const centerTexture = TilesetRegistry.getTexture(this.tilesetId, OverlayTilingVariant.CENTER);
    if (centerTexture) {
      overlays.push({
        position: { row, col },
        variant: OverlayTilingVariant.CENTER,
        textureId: centerTexture.id
      });
    }

    // Add 8 directional overlays to adjacent tiles
    const directions = [
      { variant: OverlayTilingVariant.NORTH, rowOffset: -1, colOffset: 0 },
      { variant: OverlayTilingVariant.NORTHEAST, rowOffset: -1, colOffset: 1 },
      { variant: OverlayTilingVariant.EAST, rowOffset: 0, colOffset: 1 },
      { variant: OverlayTilingVariant.SOUTHEAST, rowOffset: 1, colOffset: 1 },
      { variant: OverlayTilingVariant.SOUTH, rowOffset: 1, colOffset: 0 },
      { variant: OverlayTilingVariant.SOUTHWEST, rowOffset: 1, colOffset: -1 },
      { variant: OverlayTilingVariant.WEST, rowOffset: 0, colOffset: -1 },
      { variant: OverlayTilingVariant.NORTHWEST, rowOffset: -1, colOffset: -1 }
    ];

    for (const dir of directions) {
      const texture = TilesetRegistry.getTexture(this.tilesetId, dir.variant);
      if (texture) {
        overlays.push({
          position: {
            row: row + dir.rowOffset,
            col: col + dir.colOffset
          },
          variant: dir.variant,
          textureId: texture.id
        });
      }
    }

    return overlays;
  }

  /**
   * Checks if a position is within bounds
   */
  isValidPosition(row: number, col: number, rows: number, cols: number): boolean {
    return row >= 0 && row < rows && col >= 0 && col < cols;
  }

  /**
   * Filters overlay tiles to only include those within valid bounds
   */
  filterValidOverlays(
    overlays: OverlayTileInfo[],
    rows: number,
    cols: number
  ): OverlayTileInfo[] {
    return overlays.filter(overlay =>
      this.isValidPosition(overlay.position.row, overlay.position.col, rows, cols)
    );
  }
}
