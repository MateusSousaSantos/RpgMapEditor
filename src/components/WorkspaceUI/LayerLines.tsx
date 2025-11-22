// LayerLines.tsx
import React from 'react';
import { Line } from 'react-konva';
import { TILE_SIZE } from '../../utils/textureUtils';

interface LayerLinesProps {
  rows: number;
  cols: number;
  opacity?: number;
  strokeWidth?: number;
  stroke?: string;
}

export const LayerLines: React.FC<LayerLinesProps> = ({ 
  rows, 
  cols, 
  opacity = 0.3, 
  strokeWidth = 1, 
  stroke = '#ffffff' 
}) => {
  const gridWidth = cols * TILE_SIZE;
  const gridHeight = rows * TILE_SIZE;

  const renderVerticalLines = () => {
    return Array.from({ length: cols + 1 }).map((_, index) => (
      <Line
        key={`vertical-${index}`}
        points={[index * TILE_SIZE, 0, index * TILE_SIZE, gridHeight]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        listening={false}
      />
    ));
  };

  const renderHorizontalLines = () => {
    return Array.from({ length: rows + 1 }).map((_, index) => (
      <Line
        key={`horizontal-${index}`}
        points={[0, index * TILE_SIZE, gridWidth, index * TILE_SIZE]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        listening={false}
      />
    ));
  };

  return (
    <>
      {renderVerticalLines()}
      {renderHorizontalLines()}
    </>
  );
};
