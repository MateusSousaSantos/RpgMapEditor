import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { TileType } from '../types/textures';
import { Prop } from '../types/props';
import { Command } from '../types/commands';
import { useLayerState } from './LayerStateContext';
import { useUndoRedo } from './UndoRedoContext';
import { useAutotiling } from './AutotilingContext';
import { useProps } from './PropContext';
import { MapConfig } from '../components/CreateMapDialog';
import { EnhancedLayer } from '../types/map';

interface LayerOperationsContextType {
  // Map initialization
  initializeNewMap: (config: MapConfig) => Promise<void>;

  // Layer CRUD operations
  addLayer: (name: string, insertIndex?: number) => void;
  removeLayer: (index: number) => void;
  duplicateLayer: (index: number) => void;
  setCurrentLayer: (index: number) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;

  // Layer property updates
  updateLayerName: (index: number, name: string) => void;
  updateLayerVisibility: (index: number, visible: boolean) => void;
  updateLayerOpacity: (index: number, opacity: number) => void;

  // Layer content modification
  updateLayerTile: (layerIndex: number, row: number, col: number, tileType: TileType) => void;
  updateLayerMatrix: (layerIndex: number, matrix: TileType[][]) => void;
  updateLayerTextureMatrix: (layerIndex: number, textureMatrix: string[][]) => void;

  // Prop management
  addPropToLayer: (layerIndex: number, prop: Prop) => void;
  updateLayerProps: (layerIndex: number, updater: (props: Prop[]) => Prop[]) => void;
  updateProp: (layerIndex: number, propId: string, updates: Partial<Prop>) => void;
  deletePropFromLayer: (layerIndex: number, propId: string) => void;

  // Grid layer management
  updateGridVisibility: (visible: boolean) => void;
  updateGridOpacity: (opacity: number) => void;
  updateGridStrokeWidth: (strokeWidth: number) => void;
  updateGridStroke: (stroke: string) => void;
  updateGridRenderOrder: (renderOrder: 'background' | 'foreground') => void;

  // Utility functions
  getCurrentLayer: () => EnhancedLayer | undefined;
  getLayerByIndex: (index: number) => EnhancedLayer | undefined;
  getVisibleLayers: () => EnhancedLayer[];
}

const LayerOperationsContext = createContext<LayerOperationsContextType | undefined>(undefined);

export const useLayerOperations = () => {
  const context = useContext(LayerOperationsContext);
  if (!context) {
    throw new Error('useLayerOperations must be used within a LayerOperationsProvider');
  }
  return context;
};

interface LayerOperationsProviderProps {
  children: ReactNode;
}

export const LayerOperationsProvider: React.FC<LayerOperationsProviderProps> = ({ children }) => {
  const layerState = useLayerState();
  const { executeCommand, isExecuting } = useUndoRedo();
  const autotilingContext = useAutotiling();
  const propContext = useProps();

  // Generate unique ID for layers
  const generateLayerId = () => `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create matrix with specific tile type
  const createMatrix = useCallback((tileType: TileType): TileType[][] => {
    return Array.from({ length: layerState.mapConfig.rows }, () =>
      Array.from({ length: layerState.mapConfig.cols }, () => tileType)
    );
  }, [layerState.mapConfig.rows, layerState.mapConfig.cols]);

  // Create empty layer matrix
  const createEmptyMatrix = useCallback((): TileType[][] => {
    return createMatrix('empty');
  }, [createMatrix]);

  // Initialize new map with configuration
  const initializeNewMap = useCallback(async (config: MapConfig) => {
    layerState.setIsInitializingMap(true);

    try {
      // Step 1: Update map configuration
      layerState.setMapConfig({
        name: config.name,
        description: config.description,
        rows: config.rows,
        cols: config.cols,
        currentMapId: undefined // New map has no ID yet
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
        props: [],
      };

      // Step 3: Set new layers
      layerState.setLayers([newBaseLayer]);
      layerState.setCurrentLayerIndex(0);

      // Final delay for autotiling setup
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 4: Sync autotiling engines
      autotilingContext.syncAutotilingEngines();
    } finally {
      layerState.setIsInitializingMap(false);
    }
  }, [layerState, autotilingContext]);

  // Layer CRUD operations
  const addLayer = useCallback((name: string, insertIndex?: number) => {
    const newLayer: EnhancedLayer = {
      id: generateLayerId(),
      name,
      visible: true,
      opacity: 1.0,
      matrix: createEmptyMatrix(),
      props: [],
    };

    layerState.setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      const index = insertIndex !== undefined ? insertIndex : newLayers.length;
      newLayers.splice(index, 0, newLayer);
      return newLayers;
    });
  }, [layerState, createEmptyMatrix]);

  const removeLayer = useCallback((index: number) => {
    if (layerState.layers.length <= 1) return; // Always keep at least one layer

    layerState.setLayers(prevLayers => prevLayers.filter((_, i) => i !== index));

    // Adjust current layer index if necessary
    layerState.setCurrentLayerIndex((prevIndex: number) => {
      if (prevIndex >= layerState.layers.length - 1) {
        return Math.max(0, layerState.layers.length - 2);
      }
      return prevIndex > index ? prevIndex - 1 : prevIndex;
    });
  }, [layerState]);

  const duplicateLayer = useCallback((index: number) => {
    const layerToDuplicate = layerState.layers[index];
    if (!layerToDuplicate) return;

    const duplicatedLayer: EnhancedLayer = {
      id: generateLayerId(),
      name: `${layerToDuplicate.name} Copy`,
      visible: layerToDuplicate.visible,
      opacity: layerToDuplicate.opacity,
      matrix: layerToDuplicate.matrix.map(row => [...row]),
      textureMatrix: layerToDuplicate.textureMatrix?.map(row => [...row]),
      props: layerToDuplicate.props.map(p => ({...p})),
    };

    layerState.setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      newLayers.splice(index + 1, 0, duplicatedLayer);
      return newLayers;
    });
  }, [layerState]);

  const setCurrentLayer = useCallback((index: number) => {
    if (index >= 0 && index < layerState.layers.length) {
      layerState.setCurrentLayerIndex(index);
    }
  }, [layerState]);

  const moveLayer = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 ||
        fromIndex >= layerState.layers.length || toIndex >= layerState.layers.length) {
      return;
    }

    layerState.setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      const [movedLayer] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, movedLayer);
      return newLayers;
    });

    // Update current layer index if necessary
    layerState.setCurrentLayerIndex((prevIndex: number) => {
      if (prevIndex === fromIndex) {
        return toIndex;
      } else if (prevIndex > fromIndex && prevIndex <= toIndex) {
        return prevIndex - 1;
      } else if (prevIndex < fromIndex && prevIndex >= toIndex) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  }, [layerState]);

  // Direct updates (used by commands and undo/redo)
  const directUpdateLayerName = useCallback((index: number, name: string) => {
    layerState.setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === index ? { ...layer, name } : layer
      )
    );
  }, [layerState]);

  // Layer property updates (command-based)
  const updateLayerName = useCallback((index: number, name: string) => {
    if (isExecuting) {
      directUpdateLayerName(index, name);
      return;
    }

    const oldName = layerState.layers[index]?.name;
    if (oldName === name || !oldName) return;

    const command: Command = {
      id: `layer_name_${Date.now()}`,
      timestamp: Date.now(),
      description: `Change layer name from "${oldName}" to "${name}"`,
      execute: () => directUpdateLayerName(index, name),
      undo: () => directUpdateLayerName(index, oldName)
    };

    executeCommand(command);
  }, [layerState.layers, isExecuting, executeCommand, directUpdateLayerName]);

  const directUpdateLayerVisibility = useCallback((index: number, visible: boolean) => {
    layerState.setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === index ? { ...layer, visible } : layer
      )
    );
  }, [layerState]);

  const updateLayerVisibility = useCallback((index: number, visible: boolean) => {
    if (isExecuting) {
      directUpdateLayerVisibility(index, visible);
      return;
    }

    const oldVisible = layerState.layers[index]?.visible;
    if (oldVisible === visible || oldVisible === undefined) return;

    const command: Command = {
      id: `layer_visibility_${Date.now()}`,
      timestamp: Date.now(),
      description: `${visible ? 'Show' : 'Hide'} layer ${layerState.layers[index]?.name}`,
      execute: () => directUpdateLayerVisibility(index, visible),
      undo: () => directUpdateLayerVisibility(index, oldVisible)
    };

    executeCommand(command);
  }, [layerState.layers, isExecuting, executeCommand, directUpdateLayerVisibility]);

  const directUpdateLayerOpacity = useCallback((index: number, opacity: number) => {
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    layerState.setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === index ? { ...layer, opacity: clampedOpacity } : layer
      )
    );
  }, [layerState]);

  const updateLayerOpacity = useCallback((index: number, opacity: number) => {
    const clampedOpacity = Math.max(0, Math.min(1, opacity));

    if (isExecuting) {
      directUpdateLayerOpacity(index, clampedOpacity);
      return;
    }

    const oldOpacity = layerState.layers[index]?.opacity;
    if (oldOpacity === clampedOpacity || oldOpacity === undefined) return;

    const command: Command = {
      id: `layer_opacity_${Date.now()}`,
      timestamp: Date.now(),
      description: `Change layer opacity from ${Math.round(oldOpacity * 100)}% to ${Math.round(clampedOpacity * 100)}%`,
      execute: () => directUpdateLayerOpacity(index, clampedOpacity),
      undo: () => directUpdateLayerOpacity(index, oldOpacity)
    };

    executeCommand(command);
  }, [layerState.layers, isExecuting, executeCommand, directUpdateLayerOpacity]);

  // Layer content modification
  const updateLayerTile = useCallback((layerIndex: number, row: number, col: number, tileType: TileType) => {
    layerState.setLayers(prevLayers =>
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
  }, [layerState]);

  const directUpdateLayerMatrix = useCallback((layerIndex: number, matrix: TileType[][]) => {
    layerState.setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === layerIndex ? { ...layer, matrix: matrix.map(row => [...row]) } : layer
      )
    );
    // Sync autotiling engines after matrix change
    autotilingContext.syncAutotilingEngines();
  }, [layerState, autotilingContext]);

  const directUpdateLayerTextureMatrix = useCallback((layerIndex: number, textureMatrix: string[][]) => {
    layerState.setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === layerIndex ? { ...layer, textureMatrix: textureMatrix.map(row => [...row]) } : layer
      )
    );
  }, [layerState]);

  const updateLayerMatrix = useCallback((layerIndex: number, matrix: TileType[][]) => {
    if (isExecuting) {
      directUpdateLayerMatrix(layerIndex, matrix);
      return;
    }

    const oldMatrix = layerState.layers[layerIndex]?.matrix;
    if (!oldMatrix) return;

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
  }, [layerState.layers, isExecuting, executeCommand, directUpdateLayerMatrix]);

  const updateLayerTextureMatrix = useCallback((layerIndex: number, textureMatrix: string[][]) => {
    if (isExecuting) {
      directUpdateLayerTextureMatrix(layerIndex, textureMatrix);
      return;
    }

    directUpdateLayerTextureMatrix(layerIndex, textureMatrix);
  }, [isExecuting, directUpdateLayerTextureMatrix]);

  // Prop management - delegated to PropContext
  const addPropToLayer = useCallback((layerIndex: number, prop: Prop) => {
    propContext.addProp(layerIndex, prop);
  }, [propContext]);

  const updateProp = useCallback((layerIndex: number, propId: string, updates: Partial<Prop>) => {
    propContext.updateProp(layerIndex, propId, updates);
  }, [propContext]);

  const deletePropFromLayer = useCallback((layerIndex: number, propId: string) => {
    propContext.deleteProp(layerIndex, propId);
  }, [propContext]);

  const updateLayerProps = useCallback((layerIndex: number, updater: (props: Prop[]) => Prop[]) => {
    propContext.updateLayerProps(layerIndex, updater);
  }, [propContext]);

  // Grid layer management
  const updateGridVisibility = useCallback((visible: boolean) => {
    layerState.setGridLayer(prev => ({ ...prev, visible }));
  }, [layerState]);

  const updateGridOpacity = useCallback((opacity: number) => {
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    layerState.setGridLayer(prev => ({ ...prev, opacity: clampedOpacity }));
  }, [layerState]);

  const updateGridStrokeWidth = useCallback((strokeWidth: number) => {
    const clampedStrokeWidth = Math.max(0.1, Math.min(5, strokeWidth));
    layerState.setGridLayer(prev => ({ ...prev, strokeWidth: clampedStrokeWidth }));
  }, [layerState]);

  const updateGridStroke = useCallback((stroke: string) => {
    layerState.setGridLayer(prev => ({ ...prev, stroke }));
  }, [layerState]);

  const updateGridRenderOrder = useCallback((renderOrder: 'background' | 'foreground') => {
    layerState.setGridLayer(prev => ({ ...prev, renderOrder }));
  }, [layerState]);

  // Utility functions
  const getCurrentLayer = useCallback(() => {
    return layerState.layers[layerState.currentLayerIndex];
  }, [layerState.layers, layerState.currentLayerIndex]);

  const getLayerByIndex = useCallback((index: number) => {
    return layerState.layers[index];
  }, [layerState.layers]);

  const getVisibleLayers = useCallback(() => {
    return layerState.layers.filter(layer => layer.visible);
  }, [layerState.layers]);

  const value: LayerOperationsContextType = {
    initializeNewMap,
    addLayer,
    removeLayer,
    duplicateLayer,
    setCurrentLayer,
    moveLayer,
    updateLayerName,
    updateLayerVisibility,
    updateLayerOpacity,
    updateLayerTile,
    updateLayerMatrix,
    updateLayerTextureMatrix,
    addPropToLayer,
    updateLayerProps,
    updateProp,
    deletePropFromLayer,
    updateGridVisibility,
    updateGridOpacity,
    updateGridStrokeWidth,
    updateGridStroke,
    updateGridRenderOrder,
    getCurrentLayer,
    getLayerByIndex,
    getVisibleLayers,
  };

  return (
    <LayerOperationsContext.Provider value={value}>
      {children}
    </LayerOperationsContext.Provider>
  );
};
