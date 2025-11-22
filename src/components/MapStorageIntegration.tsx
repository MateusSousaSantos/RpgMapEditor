// src/components/MapStorageIntegration.tsx

import React from 'react';
import { MapStorageProvider } from '../contexts/MapStorageContext';
import { useLayer } from '../contexts/LayerContext';

interface MapStorageIntegrationProps {
  children: React.ReactNode;
}

export const MapStorageIntegration: React.FC<MapStorageIntegrationProps> = ({ children }) => {
  const layerContext = useLayer();
  const { layers, gridLayer } = layerContext;

  // Create a direct setLayers function that works with the existing system
  const setLayers = (newLayers: any[]) => {
    // For now, we'll implement a basic load by recreating the layers
    // This is a simplified approach for the MVP
    console.log('Loading layers:', newLayers.length, 'layers');
    
    // In a complete implementation, we would need to:
    // 1. Clear existing layers
    // 2. Add new layers one by one
    // 3. Update the current layer index
    
    // For now, we'll just log the action
    alert(`Loading ${newLayers.length} layers (implementation simplified for demo)`);
  };

  const setGridLayer = (newGridLayer: any) => {
    if (newGridLayer.visible !== undefined) {
      layerContext.updateGridVisibility(newGridLayer.visible);
    }
    if (newGridLayer.opacity !== undefined) {
      layerContext.updateGridOpacity(newGridLayer.opacity);
    }
    if (newGridLayer.strokeWidth !== undefined) {
      layerContext.updateGridStrokeWidth(newGridLayer.strokeWidth);
    }
    if (newGridLayer.stroke !== undefined) {
      layerContext.updateGridStroke(newGridLayer.stroke);
    }
    if (newGridLayer.renderOrder !== undefined) {
      layerContext.updateGridRenderOrder(newGridLayer.renderOrder);
    }
  };

  return (
    <MapStorageProvider
      layers={layers}
      gridLayer={gridLayer}
      setLayers={setLayers}
      setGridLayer={setGridLayer}
    >
      {children}
    </MapStorageProvider>
  );
};