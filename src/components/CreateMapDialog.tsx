// src/components/CreateMapDialog.tsx

import React, { useState } from 'react';
import { TileType } from '../types/textures';

interface CreateMapDialogProps {
  onClose: () => void;
  onCreate: (config: MapConfig) => Promise<void>;
}

export interface MapConfig {
  name: string;
  description?: string;
  rows: number;
  cols: number;
  baseTileType: TileType;
}

const TILE_TYPE_OPTIONS: Array<{ id: TileType; name: string; description: string; color: string }> = [
  { 
    id: 'grass', 
    name: 'Grass', 
    description: 'Green grassland terrain',
    color: '#22c55e' // green-500
  },
  { 
    id: 'water', 
    name: 'Water', 
    description: 'Blue water bodies',
    color: '#3b82f6' // blue-500
  },
  { 
    id: 'stone', 
    name: 'Stone', 
    description: 'Gray stone terrain',
    color: '#6b7280' // gray-500
  },
  { 
    id: 'empty', 
    name: 'Empty', 
    description: 'Transparent/empty tiles',
    color: 'transparent'
  }
];

const MIN_SIZE = 5;
const MAX_SIZE = 50;
const DEFAULT_SIZE = 11;

export const CreateMapDialog: React.FC<CreateMapDialogProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState(DEFAULT_SIZE);
  const [cols, setCols] = useState(DEFAULT_SIZE);
  const [baseTileType, setBaseTileType] = useState<TileType>('grass');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      setError('Map name is required');
      return;
    }
    
    if (rows < MIN_SIZE || rows > MAX_SIZE) {
      setError(`Rows must be between ${MIN_SIZE} and ${MAX_SIZE}`);
      return;
    }
    
    if (cols < MIN_SIZE || cols > MAX_SIZE) {
      setError(`Columns must be between ${MIN_SIZE} and ${MAX_SIZE}`);
      return;
    }

    setError('');
    setIsCreating(true);
    
    try {
      const config: MapConfig = {
        name: name.trim(),
        description: description.trim() || undefined,
        rows,
        cols,
        baseTileType
      };

      await onCreate(config);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create map');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const validateDimension = (value: string, setter: (val: number) => void) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= MIN_SIZE && num <= MAX_SIZE) {
      setter(num);
      setError('');
    } else if (value === '') {
      setter(MIN_SIZE);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 w-96 max-w-[90vw]" onKeyDown={handleKeyDown}>
      <h2 className="text-xl font-bold text-white mb-4">Create New Map</h2>
      
      <div className="space-y-4">
        {/* Map Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Map Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error && e.target.value.trim()) setError('');
            }}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter map name"
            maxLength={50}
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe your map"
            rows={2}
            maxLength={200}
          />
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Width (Columns)
            </label>
            <input
              type="number"
              value={cols}
              onChange={(e) => validateDimension(e.target.value, setCols)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={MIN_SIZE}
              max={MAX_SIZE}
            />
            <p className="text-xs text-slate-400 mt-1">
              {MIN_SIZE}-{MAX_SIZE} tiles
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Height (Rows)
            </label>
            <input
              type="number"
              value={rows}
              onChange={(e) => validateDimension(e.target.value, setRows)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={MIN_SIZE}
              max={MAX_SIZE}
            />
            <p className="text-xs text-slate-400 mt-1">
              {MIN_SIZE}-{MAX_SIZE} tiles
            </p>
          </div>
        </div>

        {/* Base Tile Type */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Base Terrain
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TILE_TYPE_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setBaseTileType(option.id)}
                className={`p-3 rounded-md border-2 transition-all ${
                  baseTileType === option.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-4 h-4 rounded ${option.color === 'transparent' ? 'border-2 border-slate-400 border-dashed' : ''}`}
                    style={{ backgroundColor: option.color }}
                  />
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">
                      {option.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map Size Preview */}
        <div className="bg-slate-700 p-3 rounded-md">
          <div className="text-sm text-slate-300">
            <span className="font-medium">Preview:</span> {cols} × {rows} tiles ({cols * rows} total)
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Fill type: <span className="capitalize">{TILE_TYPE_OPTIONS.find(t => t.id === baseTileType)?.name}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-md p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Map'}
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-700">
          <span className="font-mono">Ctrl+Enter</span> to create • <span className="font-mono">Esc</span> to cancel
        </div>
      </div>
    </div>
  );
};