import React, { createContext, useContext, useState, ReactNode } from 'react';

import { TileType } from '../types/textures';

export type ToolType = 'draw' | 'addMap' | 'addProp' | 'select' | 'erase' | null;
export type PaintingMode = 'single' | 'box'; // Removed 'drag'

export const getToolDisplayName = (tool: ToolType): string => {
  switch (tool) {
    case 'draw': return 'Draw';
    case 'addMap': return 'Add Map';
    case 'addProp': return 'Add Prop';
    case 'select': return 'Select';
    case 'erase': return 'Erase';
    default: return 'None';
  }
};

export const getPaintingModeDisplayName = (mode: PaintingMode): string => {
  switch (mode) {
    case 'single': return 'Click/Drag';
    case 'box': return 'Box Selection';
    default: return 'Click/Drag';
  }
};

interface ToolContextType {
  currentTool: ToolType;
  setCurrentTool: (tool: ToolType) => void;
  isToolActive: (tool: ToolType) => boolean;
  getToolDisplayName: (tool: ToolType) => string;
  selectedTileType: TileType;
  setSelectedTileType: (tileType: TileType) => void;
  // Legacy support for texture-based selection
  selectedTexture: string;
  setSelectedTexture: (texture: string) => void;
  // Painting mode management
  paintingMode: PaintingMode;
  setPaintingMode: (mode: PaintingMode) => void;
  getPaintingModeDisplayName: (mode: PaintingMode) => string;
  // Tile color selection
  selectedTileColor: string;
  setSelectedTileColor: (color: string) => void;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);

export const useTool = () => {
  const context = useContext(ToolContext);
  if (!context) {
    throw new Error('useTool must be used within a ToolProvider');
  }
  return context;
};

interface ToolProviderProps {
  children: ReactNode;
}

export const ToolProvider: React.FC<ToolProviderProps> = ({ children }) => {
  const [currentTool, setCurrentTool] = useState<ToolType>(null);
  const [selectedTileType, setSelectedTileType] = useState<TileType>('grass');
  const [selectedTexture, setSelectedTexture] = useState<string>('grass1'); // Legacy support
  const [paintingMode, setPaintingMode] = useState<PaintingMode>('single');
  const [selectedTileColor, setSelectedTileColor] = useState<string>('#ff0000'); // Default to red

  const isToolActive = (tool: ToolType) => {
    return currentTool === tool;
  };

  return (
    <ToolContext.Provider value={{ 
      currentTool, 
      setCurrentTool, 
      isToolActive,
      getToolDisplayName,
      selectedTileType,
      setSelectedTileType,
      selectedTexture,
      setSelectedTexture,
      paintingMode,
      setPaintingMode,
      getPaintingModeDisplayName,
      selectedTileColor,
      setSelectedTileColor
    }}>
      {children}
    </ToolContext.Provider>
  );
};