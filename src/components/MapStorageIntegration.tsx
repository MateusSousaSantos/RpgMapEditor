// src/components/MapStorageIntegration.tsx

import React from 'react';
import { MapStorageProvider } from '../contexts/MapStorageContext';
import { useLayer } from '../contexts/LayerContext';

interface MapStorageIntegrationProps {
  children: React.ReactNode;
}

export const MapStorageIntegration: React.FC<MapStorageIntegrationProps> = ({ children }) => {
  const layerContext = useLayer();
  const { layers, gridLayer, setMapConfig, setLayers } = layerContext;

  return (
    <MapStorageProvider
      layers={layers}
      gridLayer={gridLayer}
      setLayers={setLayers}
      setGridLayer={(newGridLayer) => {
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
      }}
      setMapConfig={setMapConfig}
    >
      {children}
    </MapStorageProvider>
  );
};