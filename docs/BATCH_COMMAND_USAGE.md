// Example: How to use BatchCommand

import { useUndoRedo } from '../contexts/UndoRedoContext';
import { createPaintTilesCommand } from '../commands/PaintTilesCommand';

// Example 1: Manual batch with batchCommands
function FloodFillExample() {
  const { batchCommands } = useUndoRedo();

  const performFloodFill = (tiles: Array<{row: number, col: number}>) => {
    const commands = tiles.map(tile => 
      createPaintTilesCommand(
        layerIndex,
        [{ row: tile.row, col: tile.col, oldValue, newValue, oldTexture, newTexture }],
        matrix,
        textureMatrix
      )
    );

    // All commands executed as single undo operation
    batchCommands(commands, 'Flood fill');
  };
}

// Example 2: Automatic batch mode with startBatch/endBatch
function LargeAreaPaint() {
  const { startBatch, endBatch, executeCommand } = useUndoRedo();

  const paintLargeArea = (area: Array<{row: number, col: number}>) => {
    startBatch('Paint large area'); // Start collecting commands

    area.forEach(tile => {
      const command = createPaintTilesCommand(
        layerIndex,
        [{ row: tile.row, col: tile.col, oldValue, newValue }],
        matrix,
        textureMatrix
      );
      executeCommand(command); // Queued instead of executed immediately
    });

    endBatch(); // Execute all queued commands as one batch
  };
}

// Example 3: Using with box selection (usePaintingTool)
function BoxPaintWithBatch() {
  const { startBatch, endBatch } = useUndoRedo();
  const { paintBoxSelection } = usePaintingTool({...});

  const handleBoxPaint = (startRow, startCol, endRow, endCol) => {
    startBatch(`Paint ${(endRow - startRow + 1) * (endCol - startCol + 1)} tiles`);
    
    // paintBoxSelection internally calls executeCommand for each tile
    // but they're all queued into one batch
    paintBoxSelection(startRow, startCol, endRow, endCol);
    
    endBatch();
  };
}
