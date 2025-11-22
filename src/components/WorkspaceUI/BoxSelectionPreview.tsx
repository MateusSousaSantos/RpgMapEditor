// src/components/WorkspaceUI/BoxSelectionPreview.tsx
import React from 'react';
import { Rect } from 'react-konva';

interface BoxSelectionPreviewProps {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  tileSize: number;
}

export const BoxSelectionPreview: React.FC<BoxSelectionPreviewProps> = ({
  startRow,
  startCol,
  endRow,
  endCol,
  tileSize
}) => {
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  const x = minCol * tileSize;
  const y = minRow * tileSize;
  const width = (maxCol - minCol + 1) * tileSize;
  const height = (maxRow - minRow + 1) * tileSize;

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(100, 149, 237, 0.3)"
      stroke="rgba(100, 149, 237, 0.8)"
      strokeWidth={2}
      dash={[5, 5]}
      listening={false}
    />
  );
};