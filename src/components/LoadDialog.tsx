// src/components/LoadDialog.tsx

import React, { useState, useEffect } from 'react';
import { useMapStorage } from '../contexts/MapStorageContext';

interface MapDocument {
  id: string;
  name: string;
  version: number;
  createdAt: Date;
  modifiedAt: Date;
  dimensions: { rows: number; cols: number };
  layers: any[];
  gridLayer: any;
  metadata?: {
    description?: string;
    thumbnail?: string;
  };
  sizeBytes: number;
}

interface LoadDialogProps {
  onClose: () => void;
}

export const LoadDialog: React.FC<LoadDialogProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { loadMap, deleteMap, getMapList, hasAutoSave, loadAutoSave } = useMapStorage();
  const [mapList, setMapList] = useState(getMapList());

  const refreshMapList = () => {
    setMapList(getMapList());
  };

  useEffect(() => {
    refreshMapList();
  }, []);

  const handleLoad = async (mapId: string) => {
    setLoading(true);
    setError('');
    
    try {
      await loadMap(mapId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load map');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mapId: string, mapName: string) => {
    if (!window.confirm(`Delete "${mapName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteMap(mapId);
      refreshMapList();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete map');
    }
  };

  const handleLoadAutoSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      await loadAutoSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auto-save');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col">
        <h2 className="text-xl font-bold text-white mb-4">Load Map</h2>
        
        {/* Auto-save recovery */}
        {hasAutoSave && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-300 font-medium">Auto-save Available</div>
                <div className="text-xs text-blue-400">Recover your latest changes</div>
              </div>
              <button
                onClick={handleLoadAutoSave}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                Recover
              </button>
            </div>
          </div>
        )}

        {/* Map list */}
        <div className="flex-1 overflow-hidden">
          {mapList.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <div className="text-4xl mb-2">📁</div>
              <div>No saved maps found</div>
              <div className="text-sm mt-1">Create and save a map to see it here</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {mapList
                .sort((a: MapDocument, b: MapDocument) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
                .map((map: MapDocument) => (
                <div 
                  key={map.id}
                  className="p-3 rounded border transition-colors bg-slate-700/50 border-slate-600 hover:bg-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{map.name}</div>
                      {map.metadata?.description && (
                        <div className="text-sm text-slate-400 mt-1 truncate">
                          {map.metadata.description}
                        </div>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>{formatDate(map.modifiedAt)}</span>
                        <span>{map.dimensions.rows}×{map.dimensions.cols}</span>
                        <span>{formatSize(map.sizeBytes)}</span>
                        <span>{map.layers.length} layer{map.layers.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoad(map.id);
                        }}
                        disabled={loading}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(map.id, map.name);
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-800">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
          >
            Cancel
          </button>
        </div>
    </div>
  );
};