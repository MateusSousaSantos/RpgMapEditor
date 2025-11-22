// src/components/WorkspaceUI/ToolIndicator.tsx
import React from 'react';
import { ToolType, PaintingMode, getPaintingModeDisplayName } from '../../contexts/ToolContext';

interface ToolIndicatorProps {
  currentTool: ToolType;
  getToolDisplayName: (tool: ToolType) => string;
  paintingMode?: PaintingMode;
  setPaintingMode?: (mode: PaintingMode) => void;
}

export const ToolIndicator: React.FC<ToolIndicatorProps> = ({
  currentTool,
  getToolDisplayName,
  paintingMode,
  setPaintingMode
}) => {
  if (!currentTool) return null;

  const showPaintingModes = currentTool === 'draw' && setPaintingMode;

  return (
    <div className="absolute top-4 left-4 z-10 bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
      <div className="text-sm font-medium">
        Current Tool: {getToolDisplayName(currentTool)}
      </div>
      {showPaintingModes && paintingMode && (
        <div className="mt-2 space-y-2">
          <div className="text-xs text-gray-300">
            Mode: {getPaintingModeDisplayName(paintingMode)}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPaintingMode('single')}
              className={`px-2 py-1 text-xs rounded ${
                paintingMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
              }`}
              title="Click to paint single tiles, hold and drag to paint multiple tiles"
            >
              Click/Drag
            </button>
            <button
              onClick={() => setPaintingMode('box')}
              className={`px-2 py-1 text-xs rounded ${
                paintingMode === 'box'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
              }`}
              title="Click and drag to select an area to paint"
            >
              Box
            </button>
          </div>
        </div>
      )}
    </div>
  );
};