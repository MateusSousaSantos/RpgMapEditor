// src/utils/autotiling/NeighborAnalyzer.ts
import { TileType, DIRECTION_MASKS } from '../../types/textures';

export interface Position {
  row: number;
  col: number;
}

export interface NeighborContext {
  center: Position;
  neighbors: {
    N: TileType | null;   // North
    NE: TileType | null;  // Northeast
    E: TileType | null;   // East
    SE: TileType | null;  // Southeast
    S: TileType | null;   // South
    SW: TileType | null;  // Southwest
    W: TileType | null;   // West
    NW: TileType | null;  // Northwest
  };
  cardinalConnections: {
    N: boolean;
    E: boolean;
    S: boolean;
    W: boolean;
  };
  diagonalConnections: {
    NE: boolean;
    SE: boolean;
    SW: boolean;
    NW: boolean;
  };
  connectivityMask: number;
}

export class NeighborAnalyzer {
  private matrix: TileType[][];
  private rows: number;
  private cols: number;

  constructor(matrix: TileType[][], rows: number, cols: number) {
    this.matrix = matrix;
    this.rows = rows;
    this.cols = cols;
  }

  /**
   * Analyzes the 8 neighbors around a given position
   */
  analyzeNeighbors(row: number, col: number, centerTileType?: TileType): NeighborContext {
    const center: Position = { row, col };
    const centerType = centerTileType || this.getTileAt(row, col);
    
    // Get all 8 neighbors
    const neighbors = {
      N:  this.getTileAt(row - 1, col),     // North
      NE: this.getTileAt(row - 1, col + 1), // Northeast
      E:  this.getTileAt(row, col + 1),     // East
      SE: this.getTileAt(row + 1, col + 1), // Southeast
      S:  this.getTileAt(row + 1, col),     // South
      SW: this.getTileAt(row + 1, col - 1), // Southwest
      W:  this.getTileAt(row, col - 1),     // West
      NW: this.getTileAt(row - 1, col - 1)  // Northwest
    };

    // Determine connections (same tile type)
    const cardinalConnections = {
      N: neighbors.N === centerType,
      E: neighbors.E === centerType,
      S: neighbors.S === centerType,
      W: neighbors.W === centerType
    };

    const diagonalConnections = {
      NE: neighbors.NE === centerType,
      SE: neighbors.SE === centerType,
      SW: neighbors.SW === centerType,
      NW: neighbors.NW === centerType
    };

    // Create connectivity bitmask
    let connectivityMask = 0;
    if (cardinalConnections.N) connectivityMask |= DIRECTION_MASKS.N;
    if (diagonalConnections.NE) connectivityMask |= DIRECTION_MASKS.NE;
    if (cardinalConnections.E) connectivityMask |= DIRECTION_MASKS.E;
    if (diagonalConnections.SE) connectivityMask |= DIRECTION_MASKS.SE;
    if (cardinalConnections.S) connectivityMask |= DIRECTION_MASKS.S;
    if (diagonalConnections.SW) connectivityMask |= DIRECTION_MASKS.SW;
    if (cardinalConnections.W) connectivityMask |= DIRECTION_MASKS.W;
    if (diagonalConnections.NW) connectivityMask |= DIRECTION_MASKS.NW;

    return {
      center,
      neighbors,
      cardinalConnections,
      diagonalConnections,
      connectivityMask
    };
  }

  /**
   * Gets tile at position with bounds checking
   */
  private getTileAt(row: number, col: number): TileType | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null; // Out of bounds
    }
    return this.matrix[row][col];
  }

  /**
   * Gets positions of all 8 neighbors (with bounds checking)
   */
  getNeighborPositions(row: number, col: number): Position[] {
    const positions: Position[] = [];
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue; // Skip center
        
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
          positions.push({ row: newRow, col: newCol });
        }
      }
    }
    
    return positions;
  }

  /**
   * Updates the internal matrix for analysis
   */
  updateMatrix(matrix: TileType[][]): void {
    this.matrix = matrix;
  }
}