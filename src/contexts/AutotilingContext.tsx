import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { AutotilingEngine } from '../utils/autotiling/AutotilingEngine';
import { useLayerState } from './LayerStateContext';

interface AutotilingContextType {
  // Get autotiling engine for a specific layer
  getAutotilingEngine: (layerIndex: number) => AutotilingEngine | null;
  
  // Update the matrix in autotiling engines (called when layer matrix changes)
  syncAutotilingEngines: () => void;
}

const AutotilingContext = createContext<AutotilingContextType | undefined>(undefined);

export const useAutotiling = () => {
  const context = useContext(AutotilingContext);
  if (!context) {
    throw new Error('useAutotiling must be used within an AutotilingProvider');
  }
  return context;
};

interface AutotilingProviderProps {
  children: ReactNode;
}

export const AutotilingProvider: React.FC<AutotilingProviderProps> = ({ children }) => {
  // Subscribe to layer state
  const layerState = useLayerState();
  
  // Map of layer IDs to AutotilingEngine instances
  const [autotilingEngines] = useState(new Map<string, AutotilingEngine>());

  // Initialize autotiling engine for a specific layer
  const initializeAutotilingEngine = useCallback((layerIndex: number) => {
    const layer = layerState.layers[layerIndex];
    if (!layer || autotilingEngines.has(layer.id)) {
      return;
    }

    const engine = new AutotilingEngine(
      layer.matrix,
      layerState.mapConfig.rows,
      layerState.mapConfig.cols
    );
    autotilingEngines.set(layer.id, engine);
  }, [layerState.layers, layerState.mapConfig.rows, layerState.mapConfig.cols, autotilingEngines]);

  // Get autotiling engine for a layer
  const getAutotilingEngine = useCallback((layerIndex: number): AutotilingEngine | null => {
    const layer = layerState.layers[layerIndex];
    if (!layer) return null;

    if (!autotilingEngines.has(layer.id)) {
      initializeAutotilingEngine(layerIndex);
    }

    return autotilingEngines.get(layer.id) || null;
  }, [layerState.layers, autotilingEngines, initializeAutotilingEngine]);

  // Sync all autotiling engines when layer matrices change
  // This subscription pattern ensures engines always have current matrix data
  const syncAutotilingEngines = useCallback(() => {
    layerState.layers.forEach((layer) => {
      const engine = autotilingEngines.get(layer.id);
      if (engine) {
        // Update the engine's internal matrix reference
        engine.updateMatrix(layer.matrix);
      }
    });
  }, [layerState.layers, autotilingEngines]);

  // Effect: Clean up removed layers
  useEffect(() => {
    const layerIds = new Set(layerState.layers.map(l => l.id));
    
    // Remove engines for deleted layers
    for (const layerId of autotilingEngines.keys()) {
      if (!layerIds.has(layerId)) {
        autotilingEngines.delete(layerId);
      }
    }
  }, [layerState.layers, autotilingEngines]);

  // Effect: Initialize engines for new layers
  useEffect(() => {
    layerState.layers.forEach((_, index) => {
      if (!autotilingEngines.has(layerState.layers[index].id)) {
        initializeAutotilingEngine(index);
      }
    });
  }, [layerState.layers, autotilingEngines, initializeAutotilingEngine]);

  const value: AutotilingContextType = {
    getAutotilingEngine,
    syncAutotilingEngines,
  };

  return (
    <AutotilingContext.Provider value={value}>
      {children}
    </AutotilingContext.Provider>
  );
};
