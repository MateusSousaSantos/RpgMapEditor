// src/contexts/MapStorageContext.tsx

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { EnhancedLayer } from '../types/map';

// Storage configuration
const STORAGE_CONFIG = {
  MAX_MAPS: 10,
  MAX_MAP_SIZE_MB: 5,
  AUTOSAVE_INTERVAL_MS: 30000, // 30 seconds
  DEBOUNCE_DELAY_MS: 2000, // 2 seconds
  STORAGE_KEY_PREFIX: 'rpg-map-',
  AUTOSAVE_KEY: 'rpg-map-autosave',
  MAP_LIST_KEY: 'rpg-map-list',
} as const;

interface GridLayerState {
  visible: boolean;
  opacity: number;
  strokeWidth: number;
  stroke: string;
  renderOrder: 'background' | 'foreground';
}

interface MapDocument {
  id: string;
  name: string;
  version: number;
  createdAt: Date;
  modifiedAt: Date;
  dimensions: { rows: number; cols: number };
  layers: EnhancedLayer[];
  gridLayer: GridLayerState;
  metadata?: {
    description?: string;
    thumbnail?: string;
  };
  sizeBytes: number;
}

interface AutoSaveData {
  id: 'autosave';
  mapData: MapDocument;
  lastSaved: Date;
  isDirty: boolean;
}

interface StorageStats {
  totalMaps: number;
  totalSizeBytes: number;
  availableSlots: number;
  oldestMap?: { id: string; date: Date };
}



interface MapStorageContextType {
  // Auto-save state
  isDirty: boolean;
  lastSaved: Date | null;
  autoSaveEnabled: boolean;
  
  // Loading state
  isLoadingMap: boolean;
  
  // Storage operations
  saveMap: (name: string, description?: string) => Promise<string>;
  loadMap: (id: string) => Promise<void>;
  deleteMap: (id: string) => Promise<void>;
  getMapList: () => MapDocument[];
  
  // Auto-save controls
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  forceSave: () => Promise<void>;
  
  // Storage stats
  getStorageStats: () => StorageStats;
  
  // Recovery
  hasAutoSave: boolean;
  loadAutoSave: () => Promise<void>;
}

const MapStorageContext = createContext<MapStorageContextType | undefined>(undefined);

interface MapStorageProviderProps {
  children: ReactNode;
  layers: EnhancedLayer[];
  gridLayer: GridLayerState;
  setLayers: (layers: EnhancedLayer[]) => void;
  setGridLayer?: (gridLayer: GridLayerState) => void;
}

export const MapStorageProvider: React.FC<MapStorageProviderProps> = ({ 
  children, 
  layers, 
  gridLayer, 
  setLayers,
  setGridLayer 
}) => {
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [hasAutoSave, setHasAutoSave] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  // Calculate map size in bytes
  const calculateMapSize = useCallback((mapData: MapDocument): number => {
    return new Blob([JSON.stringify(mapData)]).size;
  }, []);



  // Get map list from localStorage
  const getMapList = useCallback((): MapDocument[] => {
    try {
      const mapListJson = localStorage.getItem(STORAGE_CONFIG.MAP_LIST_KEY);
      if (!mapListJson) return [];
      
      const mapList = JSON.parse(mapListJson) as MapDocument[];
      return mapList.map(map => ({
        ...map,
        createdAt: new Date(map.createdAt),
        modifiedAt: new Date(map.modifiedAt)
      }));
    } catch (error) {
      console.error('Error loading map list:', error);
      return [];
    }
  }, []);

  // Update map list in localStorage
  const updateMapList = useCallback((mapList: MapDocument[]) => {
    try {
      localStorage.setItem(STORAGE_CONFIG.MAP_LIST_KEY, JSON.stringify(mapList));
    } catch (error) {
      console.error('Error saving map list:', error);
    }
  }, []);

  // Check storage limits and cleanup if needed
  const checkStorageLimits = useCallback((): StorageStats => {
    const maps = getMapList();
    const totalSize = maps.reduce((sum, map) => sum + (map.sizeBytes || 0), 0);
    
    return {
      totalMaps: maps.length,
      totalSizeBytes: totalSize,
      availableSlots: STORAGE_CONFIG.MAX_MAPS - maps.length,
      oldestMap: maps.length > 0 ? 
        maps.reduce((oldest, map) => map.createdAt < oldest.date ? { id: map.id, date: map.createdAt } : oldest, 
        { id: maps[0].id, date: maps[0].createdAt }) : undefined
    };
  }, [getMapList]);

  // Save map with size validation and cleanup
  const saveMap = useCallback(async (name: string, description?: string): Promise<string> => {
    const stats = checkStorageLimits();
    const maxSize = STORAGE_CONFIG.MAX_MAP_SIZE_MB * 1024 * 1024;
    
    // Create map document
    const mapDocument: MapDocument = {
      id: `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      version: 1,
      createdAt: new Date(),
      modifiedAt: new Date(),
      dimensions: { 
        rows: layers[0]?.matrix.length || 10, 
        cols: layers[0]?.matrix[0]?.length || 10 
      },
      layers: layers.map(layer => ({
        ...layer,
        matrix: layer.matrix.map(row => [...row]), // Deep copy
        textureMatrix: layer.textureMatrix?.map(row => [...row])
      })),
      gridLayer: { ...gridLayer },
      metadata: description ? { description } : undefined,
      sizeBytes: 0
    };

    // Calculate size
    mapDocument.sizeBytes = calculateMapSize(mapDocument);
    
    if (mapDocument.sizeBytes > maxSize) {
      throw new Error(`Map too large (${(mapDocument.sizeBytes / 1024 / 1024).toFixed(1)}MB). Maximum allowed: ${STORAGE_CONFIG.MAX_MAP_SIZE_MB}MB`);
    }

    // Check if we need to make space
    let mapList = getMapList();
    if (stats.availableSlots === 0) {
      // Remove oldest map to make space
      if (stats.oldestMap) {
        mapList = mapList.filter(map => map.id !== stats.oldestMap!.id);
        localStorage.removeItem(`${STORAGE_CONFIG.STORAGE_KEY_PREFIX}${stats.oldestMap.id}`);
      }
    }

    // Save the map
    localStorage.setItem(`${STORAGE_CONFIG.STORAGE_KEY_PREFIX}${mapDocument.id}`, JSON.stringify(mapDocument));
    
    // Update map list
    mapList.push(mapDocument);
    updateMapList(mapList);
    
    setIsDirty(false);
    setLastSaved(new Date());
    
    return mapDocument.id;
  }, [layers, gridLayer, calculateMapSize, checkStorageLimits, getMapList, updateMapList]);

  // Load map
  const loadMap = useCallback(async (id: string): Promise<void> => {
    setIsLoadingMap(true);
    
    try {
      // Add small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mapJson = localStorage.getItem(`${STORAGE_CONFIG.STORAGE_KEY_PREFIX}${id}`);
      if (!mapJson) {
        throw new Error('Map not found');
      }
      
      const mapDocument: MapDocument = JSON.parse(mapJson);
      
      // Add another delay for processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Load layers and grid
      setLayers(mapDocument.layers);
      if (setGridLayer) {
        setGridLayer(mapDocument.gridLayer);
      }
      
      setIsDirty(false);
      setLastSaved(new Date(mapDocument.modifiedAt));
    } catch (error) {
      throw new Error(`Failed to load map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingMap(false);
    }
  }, [setLayers, setGridLayer]);

  // Delete map
  const deleteMap = useCallback(async (id: string): Promise<void> => {
    try {
      // Remove from localStorage
      localStorage.removeItem(`${STORAGE_CONFIG.STORAGE_KEY_PREFIX}${id}`);
      
      // Update map list
      const mapList = getMapList().filter(map => map.id !== id);
      updateMapList(mapList);
    } catch (error) {
      throw new Error(`Failed to delete map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [getMapList, updateMapList]);

  // Force save (for manual saves)
  const forceSave = useCallback(async (): Promise<void> => {
    await saveMap('Quick Save');
  }, [saveMap]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        const autoSaveData: AutoSaveData = {
          id: 'autosave',
          mapData: {
            id: 'autosave-temp',
            name: 'Auto-saved Map',
            version: 1,
            createdAt: new Date(),
            modifiedAt: new Date(),
            dimensions: { 
              rows: layers[0]?.matrix.length || 10, 
              cols: layers[0]?.matrix[0]?.length || 10 
            },
            layers,
            gridLayer,
            sizeBytes: 0
          },
          lastSaved: new Date(),
          isDirty: false
        };

        autoSaveData.mapData.sizeBytes = calculateMapSize(autoSaveData.mapData);
        
        localStorage.setItem(STORAGE_CONFIG.AUTOSAVE_KEY, JSON.stringify(autoSaveData));
        setHasAutoSave(true);
        setLastSaved(new Date());
        setIsDirty(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, STORAGE_CONFIG.AUTOSAVE_INTERVAL_MS);

    return () => clearTimeout(autoSaveTimer);
  }, [isDirty, autoSaveEnabled, layers, gridLayer, calculateMapSize]);

  // Load auto-save
  const loadAutoSave = useCallback(async (): Promise<void> => {
    setIsLoadingMap(true);
    
    try {
      // Add small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const autoSaveJson = localStorage.getItem(STORAGE_CONFIG.AUTOSAVE_KEY);
      if (!autoSaveJson) {
        throw new Error('No auto-save data found');
      }
      
      const autoSaveData: AutoSaveData = JSON.parse(autoSaveJson);
      
      // Add processing delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setLayers(autoSaveData.mapData.layers);
      if (setGridLayer) {
        setGridLayer(autoSaveData.mapData.gridLayer);
      }
      
      setIsDirty(false);
      setLastSaved(autoSaveData.lastSaved);
    } catch (error) {
      throw new Error(`Failed to load auto-save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingMap(false);
    }
  }, [setLayers, setGridLayer]);

  // Mark as dirty when layers change (debounced)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setIsDirty(true);
    }, STORAGE_CONFIG.DEBOUNCE_DELAY_MS);

    return () => clearTimeout(debounceTimer);
  }, [layers, gridLayer]);

  // Check for existing auto-save on mount
  useEffect(() => {
    const autoSaveData = localStorage.getItem(STORAGE_CONFIG.AUTOSAVE_KEY);
    setHasAutoSave(!!autoSaveData);
  }, []);

  const value: MapStorageContextType = {
    isDirty,
    lastSaved,
    autoSaveEnabled,
    isLoadingMap,
    saveMap,
    loadMap,
    deleteMap,
    getMapList,
    enableAutoSave: () => setAutoSaveEnabled(true),
    disableAutoSave: () => setAutoSaveEnabled(false),
    forceSave,
    getStorageStats: checkStorageLimits,
    hasAutoSave,
    loadAutoSave
  };

  return (
    <MapStorageContext.Provider value={value}>
      {children}
    </MapStorageContext.Provider>
  );
};

export const useMapStorage = () => {
  const context = useContext(MapStorageContext);
  if (!context) {
    throw new Error('useMapStorage must be used within MapStorageProvider');
  }
  return context;
};