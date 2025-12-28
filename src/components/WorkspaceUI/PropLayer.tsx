// src/components/WorkspaceUI/PropLayer.tsx

import React, { useRef, useEffect } from "react";
import { Image, Transformer } from "react-konva";
import { Prop } from "../../types/props";
import useImage from "use-image";
import Konva from "konva";

// Convert hex color to RGB values
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 1, g: 1, b: 1 };
};

interface PropImageProps {
  prop: Prop;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Prop>) => void;
  onDelete: () => void;
}

const PropImage: React.FC<PropImageProps> = ({
  prop,
  isSelected,
  onSelect,
  onChange,
  onDelete,
}) => {
  const [image] = useImage(prop.src);
  const imageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Apply color tinting filter when color changes
  useEffect(() => {
    const node = imageRef.current;
    if (!node || !prop.color || prop.color === '#ffffff') {
      // Remove filter if no color or white color
      node?.filters([]);
      node?.cache();
      return;
    }

    const { r, g, b } = hexToRgb(prop.color);
    
    // Custom color tinting filter
    const colorTintFilter = function(imageData: ImageData) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Get the luminance (brightness) of the pixel
        const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        
        // Apply the color tint based on luminance
        data[i] = Math.round(luminance * r * 255);     // Red
        data[i + 1] = Math.round(luminance * g * 255); // Green
        data[i + 2] = Math.round(luminance * b * 255); // Blue
        // Alpha channel (data[i + 3]) remains unchanged
      }
    };

    node?.filters([colorTintFilter]);
    node?.cache();
  }, [prop.color, image]);

  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Handle keyboard delete
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, onDelete]);

  return (
    <>
      <Image
        ref={imageRef}
        image={image}
        x={prop.x}
        y={prop.y}
        width={prop.width}
        height={prop.height}
        rotation={prop.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = imageRef.current;
          if (!node) return;

          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // Reset scale and apply to width/height
          node.scaleX(1);
          node.scaleY(1);

          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <>
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
              "top-center",
              "bottom-center",
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize to minimum 5x5
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </>
      )}
    </>
  );
};

interface PropLayerProps {
  props: Prop[];
  layerIndex: number;
  onPropUpdate: (
    layerIndex: number,
    propId: string,
    updates: Partial<Prop>
  ) => void;
  onPropDelete: (layerIndex: number, propId: string) => void;
  selectedPropId: string | null;
  onSelectProp: (propId: string | null) => void;
}

export const PropLayer: React.FC<PropLayerProps> = ({
  props,
  layerIndex,
  onPropUpdate,
  onPropDelete,
  selectedPropId,
  onSelectProp,
}) => {
  return (
    <>
      {props.map((prop) => (
        <PropImage
          key={prop.id}
          prop={prop}
          isSelected={prop.id === selectedPropId}
          onSelect={() => onSelectProp(prop.id)}
          onChange={(newAttrs) => onPropUpdate(layerIndex, prop.id, newAttrs)}
          onDelete={() => {
            onPropDelete(layerIndex, prop.id);
            onSelectProp(null);
          }}
        />
      ))}
    </>
  );
};
