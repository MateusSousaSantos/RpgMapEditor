// Workspace.tsx
import React, { useRef } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";
import { useTool } from "../contexts/ToolContext";
import { useLayer } from "../contexts/LayerContext";
import { useProps } from "../contexts/PropContext";
import { usePixelArtRendering } from "../hooks/usePixelArtRendering";
import { useViewport } from "../hooks/useViewport";
import { usePaintingTool } from "../hooks/usePaintingTool";
import { useEraserTool } from "../hooks/useEraserTool";
import { ToolIndicator } from "./WorkspaceUI/ToolIndicator";
import { TileGrid } from "./WorkspaceUI/TileGrid";
import { LayerLines } from "./WorkspaceUI/LayerLines";
import { BoxSelectionPreview } from "./WorkspaceUI/BoxSelectionPreview";
import { PropLayer } from "./WorkspaceUI/PropLayer";
import { TILE_SIZE } from "../utils/textureUtils";
import { Prop } from "../types/props";

export const Workspace = React.memo(() => {
  const { currentTool, getToolDisplayName, selectedTileType, paintingMode } = useTool();
  const {
    layers,
    currentLayerIndex,
    getCurrentLayer,
    getAutotilingEngine,
    updateLayerMatrix,
    updateLayerTextureMatrix,
    updateLayerOverlayMatrix,
    getVisibleLayers,
    gridLayer,
    mapConfig,
    addPropToLayer,
    updateProp,
    deletePropFromLayer
  } = useLayer();
  const { selectedPropId, setSelectedPropId } = useProps();
  
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
    updateLayerOverlayMatrix,
    getCurrentLayer,
    currentLayerIndex,
    selectedTileType,
    rows: mapConfig.rows,
    cols: mapConfig.cols,
    tileSize: TILE_SIZE,
    autotilingEngine,
    stageRef
  });

  // Eraser tool integration
  const eraserTool = useEraserTool({
    updateLayerMatrix,
    updateLayerTextureMatrix,
    updateLayerOverlayMatrix,
    getCurrentLayer,
    currentLayerIndex,
    rows: mapConfig.rows,
    cols: mapConfig.cols,
    tileSize: TILE_SIZE,
    autotilingEngine,
    stageRef
  });

  // Update painting mode when it changes in context
  React.useEffect(() => {
    paintingTool.setPaintingMode(paintingMode);
    eraserTool.setEraserMode(paintingMode);
  }, [paintingMode, paintingTool.setPaintingMode, eraserTool.setEraserMode]);

  // Handle stage events for painting and erasing
  const handleStageMouseDown = (e: any) => {
    if (currentTool === 'draw') {
      paintingTool.handleMouseDown();
    } else if (currentTool === 'erase') {
      eraserTool.handleMouseDown();
    }
    // Deselect prop when clicking on empty space
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedPropId(null);
    }
  };

  const handleStageMouseMove = () => {
    if (currentTool === 'draw') {
      paintingTool.handleMouseMove();
    } else if (currentTool === 'erase') {
      eraserTool.handleMouseMove();
    }
  };

  const handleStageMouseUp = () => {
    if (currentTool === 'draw') {
      paintingTool.handleMouseUp();
    } else if (currentTool === 'erase') {
      eraserTool.handleMouseUp();
    }
  };

  // Handle tile clicks (for single mode and other tools)
  const handleTileClick = (row: number, col: number) => {
    if (currentTool === 'draw') {
      paintingTool.handleTileClick(row, col);
    } else if (currentTool === 'erase') {
      eraserTool.handleTileClick(row, col);
    }
  };

  // Determine if stage should be draggable
  const stageDraggable = !paintingTool.paintingState.isActive && !eraserTool.paintingState.isActive;

  // Stage drag handlers to fix ReactKonva warning
  const handleStageDragMove = React.useCallback(() => {
    // Position is handled by Konva internally during drag
    // This handler satisfies ReactKonva's requirement for drag events
  }, []);

  const handleStageDragEnd = React.useCallback(() => {
    // Position is handled by Konva internally after drag
    // This handler satisfies ReactKonva's requirement for drag events
  }, []);

  // Handle prop drop from sidebar
  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const propType = e.dataTransfer.getData('propType');
    const propSrc = e.dataTransfer.getData('propSrc');
    const propWidth = parseInt(e.dataTransfer.getData('propWidth') || '32', 10);
    const propHeight = parseInt(e.dataTransfer.getData('propHeight') || '32', 10);
    
    if (!propType || !propSrc) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    // Get the container div position
    const container = stage.container();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate position relative to stage
    const x = (e.clientX - containerRect.left - stagePos.x) / stageScale;
    const y = (e.clientY - containerRect.top - stagePos.y) / stageScale;
    
    // Create new prop
    const newProp: Prop = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: propType,
      x,
      y,
      width: propWidth,
      height: propHeight,
      src: propSrc,
      color: '#ffffff', // Default color for all props (white = no tinting)
    };
    
    addPropToLayer(currentLayerIndex, newProp);
  }, [stagePos.x, stagePos.y, stageScale, currentLayerIndex, addPropToLayer]);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div 
      className="relative w-full h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
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
        x={Math.round(stagePos.x)}
        y={Math.round(stagePos.y)}
        className="bg-slate-950 pixel-art-canvas"
        pixelRatio={1}
        imageSmoothingEnabled={false}
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
              <React.Fragment key={layer.id}>
                <TileGrid 
                  layer={layer} 
                  rows={mapConfig.rows} 
                  cols={mapConfig.cols} 
                  onTileClick={handleTileClick}
                  useAutotiling={true}
                  opacity={layer.opacity}
                  isCurrentLayer={layerIndex === currentLayerIndex}
                />
                {layer.props && layer.props.length > 0 && (
                  <PropLayer 
                    props={layer.props} 
                    layerIndex={layerIndex}
                    onPropUpdate={updateProp}
                    onPropDelete={deletePropFromLayer}
                    selectedPropId={selectedPropId}
                    onSelectProp={setSelectedPropId}
                  />
                )}
              </React.Fragment>
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
          {eraserTool.previewBoxSelection && (
            <BoxSelectionPreview
              startRow={eraserTool.previewBoxSelection.startRow}
              startCol={eraserTool.previewBoxSelection.startCol}
              endRow={eraserTool.previewBoxSelection.endRow}
              endCol={eraserTool.previewBoxSelection.endCol}
              tileSize={TILE_SIZE}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
});
