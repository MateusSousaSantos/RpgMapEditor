// src/hooks/useChunkCache.ts
import React from 'react';
import Konva from 'konva';

// Chunk configuration
export const CHUNK_SIZE = 32; // 32x32 tiles per chunk
const CACHE_DEBOUNCE_MS = 500; // 500ms debounce for recaching
const CACHE_PIXEL_RATIO = 0.75; // Optimize memory usage

interface ChunkInfo {
  id: string;
  isDirty: boolean;
}

export const getChunkId = (row: number, col: number): string => {
  const chunkRow = Math.floor(row / CHUNK_SIZE);
  const chunkCol = Math.floor(col / CHUNK_SIZE);
  return `${chunkRow}-${chunkCol}`;
};

export const getChunkBounds = (chunkId: string) => {
  const [chunkRow, chunkCol] = chunkId.split('-').map(Number);
  return {
    startRow: chunkRow * CHUNK_SIZE,
    endRow: Math.min((chunkRow + 1) * CHUNK_SIZE, Number.MAX_SAFE_INTEGER),
    startCol: chunkCol * CHUNK_SIZE,
    endCol: Math.min((chunkCol + 1) * CHUNK_SIZE, Number.MAX_SAFE_INTEGER)
  };
};

interface UseChunkCachingProps {
  rows: number;
  cols: number;
}

/**
 * Hook to manage chunk caching with dirty flags and debounced recaching.
 * Optimizes rendering performance for large tile grids by caching chunks.
 */
export const useChunkCache = ({ rows, cols }: UseChunkCachingProps) => {
  const [chunks, setChunks] = React.useState<Map<string, ChunkInfo>>(new Map());
  const debounceTimerRef = React.useRef<number | null>(null);
  const isInteractingRef = React.useRef(false);
  const chunkRefsRef = React.useRef<Map<string, Konva.Group>>(new Map());

  // Initialize chunks based on grid size
  React.useEffect(() => {
    const newChunks = new Map<string, ChunkInfo>();

    for (let row = 0; row < rows; row += CHUNK_SIZE) {
      for (let col = 0; col < cols; col += CHUNK_SIZE) {
        const chunkId = getChunkId(row, col);
        newChunks.set(chunkId, {
          id: chunkId,
          isDirty: true // Start as dirty to cache initially
        });
      }
    }

    setChunks(newChunks);
  }, [rows, cols]);

  // Mark chunk as dirty
  const markChunkDirty = React.useCallback((row: number, col: number) => {
    const chunkId = getChunkId(row, col);
    setChunks(prev => {
      const newChunks = new Map(prev);
      const chunk = newChunks.get(chunkId);
      if (chunk) {
        chunk.isDirty = true;
        newChunks.set(chunkId, chunk);
      }
      return newChunks;
    });

    // Start debounced recaching if not currently interacting
    if (!isInteractingRef.current) {
      startDebouncedRecache();
    }
  }, []);

  // Start interaction (prevents caching during active editing)
  const startInteraction = React.useCallback(() => {
    isInteractingRef.current = true;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // End interaction (allows caching to resume)
  const endInteraction = React.useCallback(() => {
    isInteractingRef.current = false;
    startDebouncedRecache();
  }, []);

  // Debounced recaching function
  const startDebouncedRecache = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      if (!isInteractingRef.current) {
        recacheDirtyChunks();
      }
    }, CACHE_DEBOUNCE_MS);
  }, []);

  // Recache all dirty chunks
  const recacheDirtyChunks = React.useCallback(() => {
    setChunks(prev => {
      const newChunks = new Map(prev);
      let hasChanges = false;

      newChunks.forEach(chunk => {
        if (chunk.isDirty) {
          const groupRef = chunkRefsRef.current.get(chunk.id);
          if (groupRef) {
            // Cache the chunk group
            groupRef.cache({
              pixelRatio: CACHE_PIXEL_RATIO
            });
          }

          chunk.isDirty = false;
          hasChanges = true;
        }
      });

      return hasChanges ? newChunks : prev;
    });
  }, []);

  // Register chunk group ref
  const registerChunkRef = React.useCallback((chunkId: string, ref: Konva.Group | null) => {
    if (ref) {
      chunkRefsRef.current.set(chunkId, ref);
    } else {
      chunkRefsRef.current.delete(chunkId);
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    chunks,
    markChunkDirty,
    startInteraction,
    endInteraction,
    registerChunkRef
  };
};
