// src/hooks/useViewport.ts
import { useState } from 'react';

export interface ViewportState {
  scale: number;
  position: { x: number; y: number };
}

export const useViewport = (initialScale: number = 5) => {
  const [stageScale, setStageScale] = useState(initialScale);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const handleWheel = (e: any, stageRef: React.RefObject<any>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition()!.x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition()!.y / oldScale - stage.y() / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setStageScale(newScale);
    
    const newPos = {
      x: -(mousePointTo.x - stage.getPointerPosition()!.x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition()!.y / newScale) * newScale,
    };
    setStagePos(newPos);
  };

  return {
    stageScale,
    stagePos,
    setStageScale,
    setStagePos,
    handleWheel,
  };
};