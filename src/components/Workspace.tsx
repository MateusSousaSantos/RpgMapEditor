// Workspace.tsx
import React, { useRef } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";
import { useTool } from "../contexts/ToolContext";
import { useLayer } from "../contexts/LayerContext";
import { usePixelArtRendering } from "../hooks/usePixelArtRendering";
import { useViewport } from "../hooks/useViewport";
import { usePaintingTool } from "../hooks/usePaintingTool";
import { ToolIndicator } from "./WorkspaceUI/ToolIndicator";
import { TileGrid } from "./WorkspaceUI/TileGrid";
import { LayerLines } from "./WorkspaceUI/LayerLines";
import { BoxSelectionPreview } from "./WorkspaceUI/BoxSelectionPreview";
import { TILE_SIZE } from "../utils/textureUtils";

export const Workspace = React.memo(() => {
  const { currentTool, getToolDisplayName, selectedTileType, paintingMode } = useTool();
  const {
    layers,
    currentLayerIndex,
    getCurrentLayer,
    getAutotilingEngine,
    updateLayerMatrix,
    updateLayerTextureMatrix,
    getVisibleLayers,
    gridLayer,
    mapConfig
  } = useLayer();
  
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);

  // Viewport management
  const { stageScale, stagePos, handleWheel } = useViewport(5);

  usePixelArtRendering(stageRef, layerRef, stageScale);

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Get autotiling engine for current layer
  const autotilingEngine = getAutotilingEngine(currentLayerIndex);

  // Painting tool integration with LayerContext
  const paintingTool = usePaintingTool({
    updateLayerMatrix,
    updateLayerTextureMatrix,
    getCurrentLayer,
    currentLayerIndex,
    selectedTileType,
    rows: mapConfig.rows,
    cols: mapConfig.cols,
    tileSize: TILE_SIZE,
    autotilingEngine,
    stageRef
  });

  // Update painting mode when it changes in context
  React.useEffect(() => {
    paintingTool.setPaintingMode(paintingMode);
  }, [paintingMode, paintingTool.setPaintingMode]);

  // Handle stage events for painting
  const handleStageMouseDown = () => {
    if (currentTool === 'draw') {
      paintingTool.handleMouseDown();
    }
  };

  const handleStageMouseMove = () => {
    if (currentTool === 'draw') {
      paintingTool.handleMouseMove();
    }
  };

  const handleStageMouseUp = () => {
    if (currentTool === 'draw') {
      paintingTool.handleMouseUp();
    }
  };

  // Handle tile clicks (for single mode and other tools)
  const handleTileClick = (row: number, col: number) => {
    if (currentTool === 'draw') {
      paintingTool.handleTileClick(row, col);
    }
  };

  // Determine if stage should be draggable
  const stageDraggable = !paintingTool.paintingState.isActive;

  // Stage drag handlers to fix ReactKonva warning
  const handleStageDragMove = React.useCallback(() => {
    // Position is handled by Konva internally during drag
    // This handler satisfies ReactKonva's requirement for drag events
  }, []);

  const handleStageDragEnd = React.useCallback(() => {
    // Position is handled by Konva internally after drag
    // This handler satisfies ReactKonva's requirement for drag events
  }, []);

  return (
    <div className="relative w-full h-full">
      <ToolIndicator
        currentTool={currentTool}
        getToolDisplayName={getToolDisplayName}
      />
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={stageDraggable}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        className="bg-slate-950 pixel-art-canvas"
        pixelRatio={1}
        listening={true}
        onWheel={(e) => handleWheel(e, stageRef)}
        onDragMove={handleStageDragMove}
        onDragEnd={handleStageDragEnd}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseUp}
      >
        <Layer ref={layerRef} imageSmoothingEnabled={false}>
          {/* Render background grid if configured */}
          {gridLayer.visible && gridLayer.renderOrder === 'background' && (
            <LayerLines 
              rows={mapConfig.rows} 
              cols={mapConfig.cols} 
              opacity={gridLayer.opacity}
              strokeWidth={gridLayer.strokeWidth}
              stroke={gridLayer.stroke}
            />
          )}
          
          {getVisibleLayers().map((layer) => {
            const layerIndex = layers.findIndex(l => l.id === layer.id);
            return (
              <TileGrid 
                key={layer.id}
                layer={layer} 
                rows={mapConfig.rows} 
                cols={mapConfig.cols} 
                onTileClick={handleTileClick}
                useAutotiling={true}
                opacity={layer.opacity}
                isCurrentLayer={layerIndex === currentLayerIndex}
              />
            );
          })}
          
          {/* Render foreground grid if configured */}
          {gridLayer.visible && gridLayer.renderOrder === 'foreground' && (
            <LayerLines 
              rows={mapConfig.rows} 
              cols={mapConfig.cols} 
              opacity={gridLayer.opacity}
              strokeWidth={gridLayer.strokeWidth}
              stroke={gridLayer.stroke}
            />
          )}
        </Layer>
        <Layer>
          {paintingTool.previewBoxSelection && (
            <BoxSelectionPreview
              startRow={paintingTool.previewBoxSelection.startRow}
              startCol={paintingTool.previewBoxSelection.startCol}
              endRow={paintingTool.previewBoxSelection.endRow}
              endCol={paintingTool.previewBoxSelection.endCol}
              tileSize={TILE_SIZE}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
});
