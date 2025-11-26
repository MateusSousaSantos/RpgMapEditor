// src/components/WorkspaceUI/PropLayer.tsx

import React, { useRef, useEffect } from "react";
import { Image, Transformer, Group, Circle, Text } from "react-konva";
import { Prop } from "../../types/props";
import useImage from "use-image";
import Konva from "konva";

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
          {/* Delete button */}
          <Group x={prop.x + prop.width + 5} y={prop.y - 5}>
            <Circle
              radius={5}
              stroke="#fff"
              strokeWidth={1}
              onClick={(e) => {
                e.cancelBubble = true;
                onDelete();
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                onDelete();
              }}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = "pointer";
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = "default";
              }}
            />
            <Text
              text="×"
              fontSize={8}
              fontStyle="bold"
              fill="#fff"
              align="center"
              verticalAlign="middle"
              offsetX={2.25}
              offsetY={3.5}
              listening={false}
            />
          </Group>
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
