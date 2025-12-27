import React, { createContext, useContext, ReactNode } from 'react';
import { EnhancedLayer } from '../types/map';
import { TileType } from '../types/textures';
import { Prop } from '../types/props';
import { AutotilingEngine } from '../utils/autotiling/AutotilingEngine';
import { MapConfig } from '../components/CreateMapDialog';
import { useLayerState } from './LayerStateContext';
import { useLayerOperations } from './LayerOperationsContext';
import { useAutotiling } from './AutotilingContext';

// BACKWARDS COMPATIBILITY LAYER
// This file now acts as a facade to the new split contexts
// Original: 634-line monolithic context
// New: 4 specialized contexts (LayerStateContext, LayerOperationsContext, AutotilingContext)

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
    currentMapId?: string;
  };
  setMapConfig: (config: { name: string; description?: string; rows: number; cols: number; currentMapId?: string }) => void;
  initializeNewMap: (config: MapConfig) => Promise<void>;
  
  // Loading state
  isInitializingMap: boolean;
  
  // Core layer management
  layers: EnhancedLayer[];
  setLayers: React.Dispatch<React.SetStateAction<EnhancedLayer[]>>;
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
  
  // Prop management
  addPropToLayer: (layerIndex: number, prop: Prop) => void;
  updateLayerProps: (layerIndex: number, updater: (props: Prop[]) => Prop[]) => void;
  updateProp: (layerIndex: number, propId: string, updates: Partial<Prop>) => void;
  deletePropFromLayer: (layerIndex: number, propId: string) => void;
  
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

/**
 * DEPRECATED: Use LayerStateProvider, LayerOperationsProvider, PropProvider, and AutotilingProvider instead
 * This component now composes the new split contexts for backward compatibility
 */
export const LayerProvider: React.FC<LayerProviderProps> = ({ children }) => {
  // This provider is now a wrapper that composes the new contexts
  // The actual state and logic is split across multiple contexts
  
  // Get all the new context values
  const layerState = useLayerState();
  const layerOps = useLayerOperations();
  const autotilingCtx = useAutotiling();

  // Create a fake autotilingEngines map for backward compatibility
  // In the new system, engines are managed internally by AutotilingContext
  const autotilingEngines = new Map<string, AutotilingEngine>();
  layerState.layers.forEach((_, index) => {
    const engine = autotilingCtx.getAutotilingEngine(index);
    if (engine) {
      autotilingEngines.set(layerState.layers[index].id, engine);
    }
  });

  const value: LayerContextType = {
    mapConfig: layerState.mapConfig,
    setMapConfig: layerState.setMapConfig,
    initializeNewMap: layerOps.initializeNewMap,
    isInitializingMap: layerState.isInitializingMap,
    layers: layerState.layers,
    setLayers: layerState.setLayers,
    currentLayerIndex: layerState.currentLayerIndex,
    addLayer: layerOps.addLayer,
    removeLayer: layerOps.removeLayer,
    duplicateLayer: layerOps.duplicateLayer,
    setCurrentLayer: layerOps.setCurrentLayer,
    updateLayerName: layerOps.updateLayerName,
    updateLayerVisibility: layerOps.updateLayerVisibility,
    updateLayerOpacity: layerOps.updateLayerOpacity,
    moveLayer: layerOps.moveLayer,
    updateLayerTile: layerOps.updateLayerTile,
    updateLayerMatrix: layerOps.updateLayerMatrix,
    updateLayerTextureMatrix: layerOps.updateLayerTextureMatrix,
    addPropToLayer: layerOps.addPropToLayer,
    updateLayerProps: layerOps.updateLayerProps,
    updateProp: layerOps.updateProp,
    deletePropFromLayer: layerOps.deletePropFromLayer,
    getCurrentLayer: layerOps.getCurrentLayer,
    getLayerByIndex: layerOps.getLayerByIndex,
    getVisibleLayers: layerOps.getVisibleLayers,
    autotilingEngines,
    getAutotilingEngine: autotilingCtx.getAutotilingEngine,
    gridLayer: layerState.gridLayer,
    updateGridVisibility: layerOps.updateGridVisibility,
    updateGridOpacity: layerOps.updateGridOpacity,
    updateGridStrokeWidth: layerOps.updateGridStrokeWidth,
    updateGridStroke: layerOps.updateGridStroke,
    updateGridRenderOrder: layerOps.updateGridRenderOrder,
  };

  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  );
};
