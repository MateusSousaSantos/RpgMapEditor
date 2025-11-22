// src/utils/autotiling/AutotilingEngine.ts
import { TileType, AutotilingTexture } from '../../types/textures';
import { NeighborAnalyzer, Position } from './NeighborAnalyzer';
import { TileResolver } from './TileResolver';

export interface TileUpdate {
  row: number;
  col: number;
  textureId: string;
  tileType: TileType;
}

export interface BatchUpdateResult {
  updates: TileUpdate[];
  affectedPositions: Position[];
}

export class AutotilingEngine {
  private neighborAnalyzer: NeighborAnalyzer;
  private tileResolver: TileResolver;
  private matrix: TileType[][];
  private rows: number;
  private cols: number;

  constructor(matrix: TileType[][], rows: number, cols: number) {
    this.matrix = matrix;
    this.rows = rows;
    this.cols = cols;
    this.neighborAnalyzer = new NeighborAnalyzer(matrix, rows, cols);
    this.tileResolver = new TileResolver();
  }

  /**
   * Updates a single tile and cascades changes to neighbors
   */
  updateTile(row: number, col: number, newTileType: TileType): BatchUpdateResult {
    const updates: TileUpdate[] = [];
    const processedPositions = new Set<string>();
    const updateQueue: Position[] = [{ row, col }];
    
    // Create a working copy of the matrix
    const workingMatrix = this.matrix.map(row => [...row]);
    
    // Set the initial tile change
    workingMatrix[row][col] = newTileType;
    this.neighborAnalyzer.updateMatrix(workingMatrix);
    
    while (updateQueue.length > 0) {
      const currentPos = updateQueue.shift()!;
      const posKey = `${currentPos.row}-${currentPos.col}`;
      
      if (processedPositions.has(posKey)) {
        continue;
      }
      
      processedPositions.add(posKey);
      
      // Get current tile type at this position
      const currentTileType = workingMatrix[currentPos.row][currentPos.col];
      
      // Skip empty tiles
      if (currentTileType === 'empty') {
        continue;
      }
      
      // Analyze neighbors and resolve texture
      const context = this.neighborAnalyzer.analyzeNeighbors(
        currentPos.row, 
        currentPos.col, 
        currentTileType
      );
      
      const resolvedTexture = this.tileResolver.resolveTileTexture(context, currentTileType);
      
      if (resolvedTexture) {
        updates.push({
          row: currentPos.row,
          col: currentPos.col,
          textureId: resolvedTexture.id,
          tileType: currentTileType
        });
        
        // Add neighbors to queue for re-evaluation
        const neighbors = this.neighborAnalyzer.getNeighborPositions(
          currentPos.row, 
          currentPos.col
        );
        
        neighbors.forEach(neighbor => {
          const neighborKey = `${neighbor.row}-${neighbor.col}`;
          if (!processedPositions.has(neighborKey)) {
            updateQueue.push(neighbor);
          }
        });
      }
    }
    
    return {
      updates,
      affectedPositions: Array.from(processedPositions).map(key => {
        const [row, col] = key.split('-').map(Number);
        return { row, col };
      })
    };
  }

  /**
   * Resolves texture for a single position without updating
   */
  resolveTileTexture(row: number, col: number): AutotilingTexture | null {
    const tileType = this.matrix[row][col];
    if (tileType === 'empty') return null;
    
    const context = this.neighborAnalyzer.analyzeNeighbors(row, col);
    return this.tileResolver.resolveTileTexture(context, tileType);
  }

  /**
   * Updates the internal matrix reference
   */
  updateMatrix(newMatrix: TileType[][]): void {
    this.matrix = newMatrix;
    this.neighborAnalyzer.updateMatrix(newMatrix);
  }

  /**
   * Re-evaluates all tiles in the matrix (useful for initialization)
   */
  resolveAllTiles(): TileUpdate[] {
    const updates: TileUpdate[] = [];
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tileType = this.matrix[row][col];
        if (tileType !== 'empty') {
          const resolvedTexture = this.resolveTileTexture(row, col);
          if (resolvedTexture) {
            updates.push({
              row,
              col,
              textureId: resolvedTexture.id,
              tileType
            });
          }
        }
      }
    }
    
    return updates;
  }

  /**
   * Gets available tile types
   */
  getAvailableTileTypes(): TileType[] {
    return ['grass', 'water', 'stone', 'empty'];
  }

  /**
   * Gets textures for a specific tile type
   */
  getTexturesForType(tileType: TileType): AutotilingTexture[] {
    return this.tileResolver.getTexturesForType(tileType);
  }
}