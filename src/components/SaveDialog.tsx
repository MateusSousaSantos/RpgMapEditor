// src/components/SaveDialog.tsx

import React, { useState, useEffect } from 'react';
import { useMapStorage } from '../contexts/MapStorageContext';
import { useLayer } from '../contexts/LayerContext';

interface SaveDialogProps {
  onClose: () => void;
  autoSave?: boolean; // If true, save immediately without showing dialog
}

export const SaveDialog: React.FC<SaveDialogProps> = ({ onClose, autoSave = false }) => {
  const { mapConfig } = useLayer();
  const [name, setName] = useState(mapConfig.name || '');
  const [description, setDescription] = useState(mapConfig.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const { saveMap, getStorageStats } = useMapStorage();
  const stats = getStorageStats();

  // Auto-save on mount if autoSave is true and map already has an ID
  useEffect(() => {
    if (autoSave && mapConfig.currentMapId) {
      handleSave();
    }
  }, [autoSave]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Map name is required');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      await saveMap(name.trim(), description.trim() || undefined, mapConfig.currentMapId);
      // Update the map name in LayerContext after saving (saveMap now handles currentMapId)
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save map');
    } finally {
      setSaving(false);
    }
  };

  // If auto-saving and still processing, show loading state
  if (autoSave && saving) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 w-96 max-w-[90vw]">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="text-white">Saving {mapConfig.name}...</div>
        </div>
      </div>
    );
  }

  // If auto-save failed, show error
  if (autoSave && error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 w-96 max-w-[90vw]">
        <h2 className="text-xl font-bold text-white mb-4">Save Failed</h2>
        <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-800 mb-4">
          {error}
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 w-96 max-w-[90vw]" onKeyDown={handleKeyDown}>
        <h2 className="text-xl font-bold text-white mb-4">Save Map</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Map Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-blue-500 focus:outline-none"
              placeholder="My Awesome Map"
              maxLength={50}
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              placeholder="Optional description..."
              maxLength={200}
            />
          </div>

          {/* Storage Stats */}
          <div className="text-xs text-slate-400 bg-slate-700/50 p-3 rounded">
            <div className="flex justify-between">
              <span>Maps:</span>
              <span className={stats.availableSlots === 0 ? 'text-red-400' : ''}>
                {stats.totalMaps}/{10}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Storage:</span>
              <span>{(stats.totalSizeBytes / 1024 / 1024).toFixed(1)}MB / 50MB</span>
            </div>
            {stats.availableSlots === 0 && (
              <div className="text-red-400 mt-2 text-center">
                ⚠️ No available slots. Oldest map will be replaced.
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-800">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded transition-colors font-medium"
          >
            {saving ? 'Saving...' : 'Save Map'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
          >
            Cancel
          </button>
        </div>
        
        <div className="mt-3 text-xs text-slate-500 text-center">
          Ctrl+Enter to save • Esc to cancel
        </div>
      </div>
  );
};