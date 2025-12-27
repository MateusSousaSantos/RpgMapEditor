import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EnhancedLayer } from '../types/map';

interface GridLayer {
  id: 'grid-layer';
  name: 'Grid';
  visible: boolean;
  opacity: number;
  strokeWidth: number;
  stroke: string;
  renderOrder: 'background' | 'foreground';
}

interface LayerStateContextType {
  // Map configuration
  mapConfig: {
    name: string;
    description?: string;
    rows: number;
    cols: number;
    currentMapId?: string;
  };
  setMapConfig: (config: { name: string; description?: string; rows: number; cols: number; currentMapId?: string }) => void;
  
  // Loading state
  isInitializingMap: boolean;
  setIsInitializingMap: (isInitializing: boolean) => void;
  
  // Core layer data
  layers: EnhancedLayer[];
  setLayers: React.Dispatch<React.SetStateAction<EnhancedLayer[]>>;
  currentLayerIndex: number;
  setCurrentLayerIndex: React.Dispatch<React.SetStateAction<number>>;
  
  // Grid layer state
  gridLayer: GridLayer;
  setGridLayer: React.Dispatch<React.SetStateAction<GridLayer>>;
}

const LayerStateContext = createContext<LayerStateContextType | undefined>(undefined);

export const useLayerState = () => {
  const context = useContext(LayerStateContext);
  if (!context) {
    throw new Error('useLayerState must be used within a LayerStateProvider');
  }
  return context;
};

interface LayerStateProviderProps {
  children: ReactNode;
}

export const LayerStateProvider: React.FC<LayerStateProviderProps> = ({ children }) => {
  // Map configuration state
  const [mapConfig, setMapConfig] = useState({
    name: 'Untitled Map',
    description: undefined as string | undefined,
    rows: 11,
    cols: 11,
    currentMapId: undefined as string | undefined
  });

  // Initialize with a default base layer
  const [layers, setLayers] = useState<EnhancedLayer[]>([{
    id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: "Base Layer",
    visible: true,
    opacity: 1.0,
    matrix: Array.from({ length: 11 }, () =>
      Array.from({ length: 11 }, () => 'grass')
    ),
    props: [],
  }]);

  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [isInitializingMap, setIsInitializingMap] = useState(false);

  // Grid layer state
  const [gridLayer, setGridLayer] = useState<GridLayer>({
    id: 'grid-layer',
    name: 'Grid',
    visible: true,
    opacity: 0.3,
    strokeWidth: 1,
    stroke: '#ffffff',
    renderOrder: 'foreground'
  });

  const value: LayerStateContextType = {
    mapConfig,
    setMapConfig: (config) => setMapConfig({
      name: config.name,
      description: config.description,
      rows: config.rows,
      cols: config.cols,
      currentMapId: config.currentMapId,
    }),
    isInitializingMap,
    setIsInitializingMap,
    layers,
    setLayers,
    currentLayerIndex,
    setCurrentLayerIndex,
    gridLayer,
    setGridLayer,
  };

  return (
    <LayerStateContext.Provider value={value}>
      {children}
    </LayerStateContext.Provider>
  );
};
