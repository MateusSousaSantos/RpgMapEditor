// src/hooks/useViewport.ts
import { useState } from 'react';

export interface ViewportState {
  scale: number;
  position: { x: number; y: number };
}

export const useViewport = (initialScale: number = 5) => {
  const [stageScale, setStageScale] = useState(initialScale);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Define pixel-perfect zoom levels for crisp rendering
  const zoomLevels = [0.25, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32];

  const getNextZoomLevel = (currentScale: number, zoomIn: boolean) => {
    const currentIndex = zoomLevels.findIndex(level => Math.abs(level - currentScale) < 0.01);
    
    if (currentIndex === -1) {
      // Current scale not in our predefined levels, find nearest
      return zoomLevels.reduce((prev, curr) => 
        Math.abs(curr - currentScale) < Math.abs(prev - currentScale) ? curr : prev
      );
    }
    
    if (zoomIn) {
      // Zoom in: go to next higher level
      return currentIndex < zoomLevels.length - 1 ? zoomLevels[currentIndex + 1] : currentScale;
    } else {
      // Zoom out: go to next lower level
      return currentIndex > 0 ? zoomLevels[currentIndex - 1] : currentScale;
    }
  };

  const handleWheel = (e: any, stageRef: React.RefObject<any>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const zoomIn = e.evt.deltaY < 0; // Negative deltaY means zoom in
    
    // Get the next appropriate zoom level based on direction
    const newScale = getNextZoomLevel(oldScale, zoomIn);
    
    // Don't update if we're already at this scale level or if no change is possible
    if (Math.abs(newScale - oldScale) < 0.01) return;
    
    const mousePointTo = {
      x: stage.getPointerPosition()!.x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition()!.y / oldScale - stage.y() / oldScale,
    };
    
    setStageScale(newScale);
    
    // Calculate new position with pixel alignment
    const newPos = {
      x: Math.round(-(mousePointTo.x - stage.getPointerPosition()!.x / newScale) * newScale),
      y: Math.round(-(mousePointTo.y - stage.getPointerPosition()!.y / newScale) * newScale),
    };
    setStagePos(newPos);
  };

  const setPixelPerfectPosition = (pos: { x: number; y: number }) => {
    setStagePos({
      x: Math.round(pos.x),
      y: Math.round(pos.y)
    });
  };

  const setPixelPerfectScale = (scale: number) => {
    const perfectScale = zoomLevels.reduce((prev, curr) => 
      Math.abs(curr - scale) < Math.abs(prev - scale) ? curr : prev
    );
    setStageScale(perfectScale);
  };

  return {
    stageScale,
    stagePos,
    setStageScale: setPixelPerfectScale,
    setStagePos: setPixelPerfectPosition,
    handleWheel,
    zoomLevels,
    getNextZoomLevel,
  };
};