// src/utils/overlayUtils.ts

import { OverlayTileResolver } from './autotiling/OverlayTileResolver';

/**
 * Utility functions for managing overlay tiles in layers
 */

/**
 * Initializes an empty overlay matrix for a layer
 */
export function initializeOverlayMatrix(rows: number, cols: number): string[][][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => [])
  );
}

/**
 * Applies overlay tiles to an overlay matrix
 * This adds the overlay tiles without removing existing base tiles
 * Directional overlays are only placed if the adjacent tile has the center overlay
 */
export function applyOverlayTiles(
  overlayMatrix: string[][][],
  row: number,
  col: number,
  rows: number,
  cols: number,
  tilesetId: string = 'default_overlay'
): string[][][] {
  const resolver = new OverlayTileResolver(tilesetId);
  const overlayTiles = resolver.resolveOverlayTiles(row, col);
  const validOverlays = resolver.filterValidOverlays(overlayTiles, rows, cols);

  // Create a copy of the overlay matrix
  const newOverlayMatrix = overlayMatrix.map(row => row.map(cell => [...cell]));

  // Get the center tile texture ID to check for in adjacent positions
  const centerTexture = overlayTiles.find(tile => tile.variant === 'center');
  const centerTextureId = centerTexture?.textureId;

  // Apply each overlay tile
  validOverlays.forEach((overlay) => {
    const { row: targetRow, col: targetCol } = overlay.position;
    
    // Ensure the position exists in the matrix
    if (
      newOverlayMatrix[targetRow] &&
      newOverlayMatrix[targetRow][targetCol]
    ) {
      // For center tile, always place it
      if (overlay.variant === 'center') {
        const existingOverlays = newOverlayMatrix[targetRow][targetCol];
        if (!existingOverlays.includes(overlay.textureId)) {
          existingOverlays.push(overlay.textureId);
        }
      } else {
        // For directional overlays, only place if the target position does NOT have the center tile
        if (centerTextureId) {
          const existingOverlays = newOverlayMatrix[targetRow][targetCol];
          const hasCenter = existingOverlays.includes(centerTextureId);
          
          if (!hasCenter && !existingOverlays.includes(overlay.textureId)) {
            existingOverlays.push(overlay.textureId);
          }
        }
      }
    }
  });

  return newOverlayMatrix;
}

/**
 * Removes all overlay tiles originating from a specific position
 */
export function removeOverlayTiles(
  overlayMatrix: string[][][],
  row: number,
  col: number,
  rows: number,
  cols: number,
  tilesetId: string = 'default_overlay'
): string[][][] {
  const resolver = new OverlayTileResolver(tilesetId);
  const overlayTiles = resolver.resolveOverlayTiles(row, col);
  const validOverlays = resolver.filterValidOverlays(overlayTiles, rows, cols);

  // Create a copy of the overlay matrix
  const newOverlayMatrix = overlayMatrix.map(row => row.map(cell => [...cell]));

  // Remove each overlay tile
  validOverlays.forEach((overlay) => {
    const { row: targetRow, col: targetCol } = overlay.position;
    
    // Ensure the position exists in the matrix
    if (
      newOverlayMatrix[targetRow] &&
      newOverlayMatrix[targetRow][targetCol]
    ) {
      // Remove the overlay texture from this position
      const existingOverlays = newOverlayMatrix[targetRow][targetCol];
      const index = existingOverlays.indexOf(overlay.textureId);
      if (index !== -1) {
        existingOverlays.splice(index, 1);
      }
    }
  });

  return newOverlayMatrix;
}

/**
 * Clears all overlays from a specific position
 */
export function clearOverlaysAtPosition(
  overlayMatrix: string[][][],
  row: number,
  col: number
): string[][][] {
  const newOverlayMatrix = overlayMatrix.map(r => r.map(cell => [...cell]));
  
  if (newOverlayMatrix[row] && newOverlayMatrix[row][col]) {
    newOverlayMatrix[row][col] = [];
  }
  
  return newOverlayMatrix;
}

/**
 * Checks if a position has any overlays
 */
export function hasOverlays(
  overlayMatrix: string[][][],
  row: number,
  col: number
): boolean {
  return (
    overlayMatrix[row] &&
    overlayMatrix[row][col] &&
    overlayMatrix[row][col].length > 0
  );
}

/**
 * Gets all overlay textures at a specific position
 */
export function getOverlaysAtPosition(
  overlayMatrix: string[][][],
  row: number,
  col: number
): string[] {
  if (overlayMatrix[row] && overlayMatrix[row][col]) {
    return [...overlayMatrix[row][col]];
  }
  return [];
}
