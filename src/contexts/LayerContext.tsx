import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { EnhancedLayer } from '../types/map';
import { TileType } from '../types/textures';
import { AutotilingEngine } from '../utils/autotiling/AutotilingEngine';
import { useUndoRedo } from './UndoRedoContext';
import { Command } from '../types/commands';
import { MapConfig } from '../components/CreateMapDialog';

interface GridLayer {
  id: 'grid-layer';
  name: 'Grid';
  visible: boolean;
  opacity: number;
  strokeWidth: number;
  stroke: string;
  renderOrder: 'background' | 'foreground';
}

interface LayerContextType {
  // Map configuration
  mapConfig: {
    name: string;
    description?: string;
    rows: number;
    cols: number;
  };
  initializeNewMap: (config: MapConfig) => Promise<void>;
  
  // Loading state
  isInitializingMap: boolean;
  
  // Core layer management
  layers: EnhancedLayer[];
  currentLayerIndex: number;
  
  // Layer operations
  addLayer: (name: string, insertIndex?: number) => void;
  removeLayer: (index: number) => void;
  duplicateLayer: (index: number) => void;
  setCurrentLayer: (index: number) => void;
  
  // Layer properties
  updateLayerName: (index: number, name: string) => void;
  updateLayerVisibility: (index: number, visible: boolean) => void;
  updateLayerOpacity: (index: number, opacity: number) => void;
  
  // Layer ordering
  moveLayer: (fromIndex: number, toIndex: number) => void;
  
  // Layer content modification
  updateLayerTile: (layerIndex: number, row: number, col: number, tileType: TileType) => void;
  updateLayerMatrix: (layerIndex: number, matrix: TileType[][]) => void;
  updateLayerTextureMatrix: (layerIndex: number, textureMatrix: string[][]) => void;
  
  // Utility functions
  getCurrentLayer: () => EnhancedLayer | undefined;
  getLayerByIndex: (index: number) => EnhancedLayer | undefined;
  getVisibleLayers: () => EnhancedLayer[];
  
  // Integration helpers
  autotilingEngines: Map<string, AutotilingEngine>;
  getAutotilingEngine: (layerIndex: number) => AutotilingEngine | null;
  
  // Grid layer management
  gridLayer: GridLayer;
  updateGridVisibility: (visible: boolean) => void;
  updateGridOpacity: (opacity: number) => void;
  updateGridStrokeWidth: (strokeWidth: number) => void;
  updateGridStroke: (stroke: string) => void;
  updateGridRenderOrder: (renderOrder: 'background' | 'foreground') => void;
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

export const useLayer = () => {
  const context = useContext(LayerContext);
  if (!context) {
    throw new Error('useLayer must be used within a LayerProvider');
  }
  return context;
};

interface LayerProviderProps {
  children: ReactNode;
}

export const LayerProvider: React.FC<LayerProviderProps> = ({ children }) => {
  // Get undo/redo functionality
  const { executeCommand, isExecuting } = useUndoRedo();
  
  // Map configuration state
  const [mapConfig, setMapConfig] = useState({
    name: 'Untitled Map',
    description: undefined as string | undefined,
    rows: 11,
    cols: 11
  });
  
  // Generate unique ID for layers
  const generateLayerId = () => `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create matrix with specific tile type
  const createMatrix = useCallback((tileType: TileType): TileType[][] => {
    return Array.from({ length: mapConfig.rows }, () =>
      Array.from({ length: mapConfig.cols }, () => tileType)
    );
  }, [mapConfig.rows, mapConfig.cols]);
  
  // Create default layer matrix (with grass tiles)
  const createDefaultMatrix = useCallback((): TileType[][] => {
    return createMatrix('grass');
  }, [createMatrix]);
  
  // Create empty layer matrix
  const createEmptyMatrix = useCallback((): TileType[][] => {
    return createMatrix('empty');
  }, [createMatrix]);
  
  // Initialize with a default base layer
  const [layers, setLayers] = useState<EnhancedLayer[]>([{
    id: generateLayerId(),
    name: "Base Layer",
    visible: true,
    opacity: 1.0,
    matrix: createDefaultMatrix(),
  }]);
  
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [autotilingEngines] = useState(new Map<string, AutotilingEngine>());
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
  
  // Initialize new map with configuration
  const initializeNewMap = useCallback(async (config: MapConfig) => {
    setIsInitializingMap(true);
    
    try {
      // Step 1: Update map configuration
      setMapConfig({
        name: config.name,
        description: config.description,
        rows: config.rows,
        cols: config.cols
      });
      
      // Small delay to show the loading screen
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: Create new base layer with specified tile type
      const baseMatrix = Array.from({ length: config.rows }, () =>
        Array.from({ length: config.cols }, () => config.baseTileType)
      );
      
      // Another small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const newBaseLayer: EnhancedLayer = {
        id: generateLayerId(),
        name: "Base Layer",
        visible: true,
        opacity: 1.0,
        matrix: baseMatrix,
      };
      
      // Step 3: Clear existing layers and autotiling engines
      autotilingEngines.clear();
      setLayers([newBaseLayer]);
      setCurrentLayerIndex(0);
      
      // Final delay for autotiling setup
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 4: Initialize autotiling engine for new layer
      const engine = new AutotilingEngine(baseMatrix, config.rows, config.cols);
      autotilingEngines.set(newBaseLayer.id, engine);
      
    } finally {
      setIsInitializingMap(false);
    }
  }, [autotilingEngines]);
  
  // Initialize autotiling engine for a layer
  const initializeAutotilingEngine = useCallback((layer: EnhancedLayer) => {
    if (!autotilingEngines.has(layer.id)) {
      const engine = new AutotilingEngine(layer.matrix, mapConfig.rows, mapConfig.cols);
      autotilingEngines.set(layer.id, engine);
    }
  }, [autotilingEngines, mapConfig.rows, mapConfig.cols]);
  
  // Layer operations
  const addLayer = useCallback((name: string, insertIndex?: number) => {
    const newLayer: EnhancedLayer = {
      id: generateLayerId(),
      name,
      visible: true,
      opacity: 1.0,
      matrix: createEmptyMatrix(),
    };
    
    setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      const index = insertIndex !== undefined ? insertIndex : newLayers.length;
      newLayers.splice(index, 0, newLayer);
      return newLayers;
    });
    
    initializeAutotilingEngine(newLayer);
  }, [createEmptyMatrix, initializeAutotilingEngine]);
  
  const removeLayer = useCallback((index: number) => {
    if (layers.length <= 1) return; // Always keep at least one layer
    
    setLayers(prevLayers => {
      const newLayers = prevLayers.filter((_, i) => i !== index);
      // Clean up autotiling engine
      const removedLayer = prevLayers[index];
      if (removedLayer) {
        autotilingEngines.delete(removedLayer.id);
      }
      return newLayers;
    });
    
    // Adjust current layer index if necessary
    setCurrentLayerIndex(prevIndex => {
      if (prevIndex >= layers.length - 1) {
        return Math.max(0, layers.length - 2);
      }
      return prevIndex > index ? prevIndex - 1 : prevIndex;
    });
  }, [layers.length, autotilingEngines]);
  
  const duplicateLayer = useCallback((index: number) => {
    const layerToDuplicate = layers[index];
    if (!layerToDuplicate) return;
    
    const duplicatedLayer: EnhancedLayer = {
      id: generateLayerId(),
      name: `${layerToDuplicate.name} Copy`,
      visible: layerToDuplicate.visible,
      opacity: layerToDuplicate.opacity,
      matrix: layerToDuplicate.matrix.map(row => [...row]),
      textureMatrix: layerToDuplicate.textureMatrix?.map(row => [...row]),
    };
    
    setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      newLayers.splice(index + 1, 0, duplicatedLayer);
      return newLayers;
    });
    
    initializeAutotilingEngine(duplicatedLayer);
  }, [layers, initializeAutotilingEngine]);
  
  const setCurrentLayer = useCallback((index: number) => {
    if (index >= 0 && index < layers.length) {
      setCurrentLayerIndex(index);
    }
  }, [layers.length]);
  
  // Direct layer updates (used by commands)
  const directUpdateLayerName = useCallback((index: number, name: string) => {
    setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === index ? { ...layer, name } : layer
      )
    );
  }, []);

  // Layer property updates (command-based)
  const updateLayerName = useCallback((index: number, name: string) => {
    if (isExecuting) {
      // Direct update during undo/redo
      directUpdateLayerName(index, name);
      return;
    }
    
    const oldName = layers[index]?.name;
    if (oldName === name || !oldName) return;
    
    // Create command manually for now
    const command: Command = {
      id: `layer_name_${Date.now()}`,
      timestamp: Date.now(),
      description: `Change layer name from "${oldName}" to "${name}"`,
      execute: () => directUpdateLayerName(index, name),
      undo: () => directUpdateLayerName(index, oldName)
    };
    
    executeCommand(command);
  }, [layers, isExecuting, executeCommand, directUpdateLayerName]);
  
  const directUpdateLayerVisibility = useCallback((index: number, visible: boolean) => {
    setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === index ? { ...layer, visible } : layer
      )
    );
  }, []);

  const directUpdateLayerOpacity = useCallback((index: number, opacity: number) => {
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === index ? { ...layer, opacity: clampedOpacity } : layer
      )
    );
  }, []);

  const updateLayerVisibility = useCallback((index: number, visible: boolean) => {
    if (isExecuting) {
      directUpdateLayerVisibility(index, visible);
      return;
    }
    
    const oldVisible = layers[index]?.visible;
    if (oldVisible === visible || oldVisible === undefined) return;
    
    const command: Command = {
      id: `layer_visibility_${Date.now()}`,
      timestamp: Date.now(),
      description: `${visible ? 'Show' : 'Hide'} layer ${layers[index]?.name}`,
      execute: () => directUpdateLayerVisibility(index, visible),
      undo: () => directUpdateLayerVisibility(index, oldVisible)
    };
    
    executeCommand(command);
  }, [layers, isExecuting, executeCommand, directUpdateLayerVisibility]);

  const updateLayerOpacity = useCallback((index: number, opacity: number) => {
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    
    if (isExecuting) {
      directUpdateLayerOpacity(index, clampedOpacity);
      return;
    }
    
    const oldOpacity = layers[index]?.opacity;
    if (oldOpacity === clampedOpacity || oldOpacity === undefined) return;
    
    const command: Command = {
      id: `layer_opacity_${Date.now()}`,
      timestamp: Date.now(),
      description: `Change layer opacity from ${Math.round(oldOpacity * 100)}% to ${Math.round(clampedOpacity * 100)}%`,
      execute: () => directUpdateLayerOpacity(index, clampedOpacity),
      undo: () => directUpdateLayerOpacity(index, oldOpacity)
    };
    
    executeCommand(command);
  }, [layers, isExecuting, executeCommand, directUpdateLayerOpacity]);  // Layer ordering
  const moveLayer = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 ||
        fromIndex >= layers.length || toIndex >= layers.length) {
      return;
    }
    
    setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      const [movedLayer] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, movedLayer);
      return newLayers;
    });
    
    // Update current layer index if necessary
    setCurrentLayerIndex(prevIndex => {
      if (prevIndex === fromIndex) {
        return toIndex;
      } else if (prevIndex > fromIndex && prevIndex <= toIndex) {
        return prevIndex - 1;
      } else if (prevIndex < fromIndex && prevIndex >= toIndex) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  }, [layers.length]);
  
  // Layer content modification
  const updateLayerTile = useCallback((layerIndex: number, row: number, col: number, tileType: TileType) => {
    setLayers(prevLayers =>
      prevLayers.map((layer, i) => {
        if (i !== layerIndex) return layer;
        
        const newMatrix = layer.matrix.map((r, rowIdx) =>
          rowIdx === row
            ? r.map((tile, colIdx) => (colIdx === col ? tileType : tile))
            : [...r]
        );
        
        return { ...layer, matrix: newMatrix };
      })
    );
  }, []);
  
  const directUpdateLayerMatrix = useCallback((layerIndex: number, matrix: TileType[][]) => {
    setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === layerIndex ? { ...layer, matrix: matrix.map(row => [...row]) } : layer
      )
    );
  }, []);

  const directUpdateLayerTextureMatrix = useCallback((layerIndex: number, textureMatrix: string[][]) => {
    setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === layerIndex ? { ...layer, textureMatrix: textureMatrix.map(row => [...row]) } : layer
      )
    );
  }, []);

  const updateLayerMatrix = useCallback((layerIndex: number, matrix: TileType[][]) => {
    if (isExecuting) {
      directUpdateLayerMatrix(layerIndex, matrix);
      return;
    }
    
    const oldMatrix = layers[layerIndex]?.matrix;
    if (!oldMatrix) return;
    
    // Create deep copy for comparison and command
    const oldMatrixCopy = oldMatrix.map(row => [...row]);
    const newMatrixCopy = matrix.map(row => [...row]);
    
    // Count changed tiles for description
    let changedTiles = 0;
    for (let i = 0; i < oldMatrix.length && i < matrix.length; i++) {
      for (let j = 0; j < oldMatrix[i].length && j < matrix[i].length; j++) {
        if (oldMatrix[i][j] !== matrix[i][j]) {
          changedTiles++;
        }
      }
    }
    
    if (changedTiles === 0) return;
    
    const command: Command = {
      id: `paint_tiles_${Date.now()}`,
      timestamp: Date.now(),
      description: changedTiles === 1 ? 'Paint tile' : `Paint ${changedTiles} tiles`,
      execute: () => directUpdateLayerMatrix(layerIndex, newMatrixCopy),
      undo: () => directUpdateLayerMatrix(layerIndex, oldMatrixCopy)
    };
    
    executeCommand(command);
  }, [layers, isExecuting, executeCommand, directUpdateLayerMatrix]);

  const updateLayerTextureMatrix = useCallback((layerIndex: number, textureMatrix: string[][]) => {
    if (isExecuting) {
      directUpdateLayerTextureMatrix(layerIndex, textureMatrix);
      return;
    }
    
    // For texture matrix updates, we typically don't create separate undo commands
    // as they're usually part of the painting operation
    directUpdateLayerTextureMatrix(layerIndex, textureMatrix);
  }, [isExecuting, directUpdateLayerTextureMatrix]);  // Utility functions
  const getCurrentLayer = useCallback(() => {
    return layers[currentLayerIndex];
  }, [layers, currentLayerIndex]);
  
  const getLayerByIndex = useCallback((index: number) => {
    return layers[index];
  }, [layers]);
  
  const getVisibleLayers = useCallback(() => {
    return layers.filter(layer => layer.visible);
  }, [layers]);
  
  const getAutotilingEngine = useCallback((layerIndex: number) => {
    const layer = layers[layerIndex];
    if (!layer) return null;
    
    if (!autotilingEngines.has(layer.id)) {
      initializeAutotilingEngine(layer);
    }
    
    return autotilingEngines.get(layer.id) || null;
  }, [layers, autotilingEngines, initializeAutotilingEngine]);
  
  // Grid layer management methods
  const updateGridVisibility = useCallback((visible: boolean) => {
    setGridLayer(prev => ({ ...prev, visible }));
  }, []);
  
  const updateGridOpacity = useCallback((opacity: number) => {
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    setGridLayer(prev => ({ ...prev, opacity: clampedOpacity }));
  }, []);
  
  const updateGridStrokeWidth = useCallback((strokeWidth: number) => {
    const clampedStrokeWidth = Math.max(0.1, Math.min(5, strokeWidth));
    setGridLayer(prev => ({ ...prev, strokeWidth: clampedStrokeWidth }));
  }, []);
  
  const updateGridStroke = useCallback((stroke: string) => {
    setGridLayer(prev => ({ ...prev, stroke }));
  }, []);
  
  const updateGridRenderOrder = useCallback((renderOrder: 'background' | 'foreground') => {
    setGridLayer(prev => ({ ...prev, renderOrder }));
  }, []);
  
  // Initialize autotiling engines for existing layers
  React.useEffect(() => {
    layers.forEach(layer => {
      initializeAutotilingEngine(layer);
    });
  }, [layers, initializeAutotilingEngine]);
  
  const value: LayerContextType = {
    mapConfig,
    initializeNewMap,
    isInitializingMap,
    layers,
    currentLayerIndex,
    addLayer,
    removeLayer,
    duplicateLayer,
    setCurrentLayer,
    updateLayerName,
    updateLayerVisibility,
    updateLayerOpacity,
    moveLayer,
    updateLayerTile,
    updateLayerMatrix,
    updateLayerTextureMatrix,
    getCurrentLayer,
    getLayerByIndex,
    getVisibleLayers,
    autotilingEngines,
    getAutotilingEngine,
    gridLayer,
    updateGridVisibility,
    updateGridOpacity,
    updateGridStrokeWidth,
    updateGridStroke,
    updateGridRenderOrder,
  };
  
  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  );
};