import { useLayer } from "../contexts/LayerContext";
import { useProps } from "../contexts/PropContext";
import { FaGripVertical, FaTrash, FaPalette } from "react-icons/fa";
import { ColorPicker } from "./ColorWheel";
import { isPropColorable } from "../types/props";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Prop } from "../types/props";

interface SortablePropItemProps {
  prop: Prop;
  index: number;
  isSelected: boolean;
  onDelete: (propId: string) => void;
  onSelect: (propId: string) => void;
  onUpdate: (propId: string, updates: Partial<Prop>) => void;
}

const SortablePropItem: React.FC<SortablePropItemProps> = ({
  prop,
  isSelected,
  onDelete,
  onSelect,
  onUpdate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prop.id });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const isColorable = isPropColorable(prop.type);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded transition-colors border ${
        isSelected
          ? "bg-slate-600 border-slate-500"
          : "bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50"
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          className="text-slate-400 hover:text-slate-200 cursor-grab active:cursor-grabbing shrink-0"
          title="Drag to reorder (bottom = rendered on top)"
          {...attributes}
          {...listeners}
        >
          <FaGripVertical size={14} />
        </button>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onSelect(prop.id)}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono shrink-0 w-8 h-8">
                <img
                  src={prop.src}
                  alt={prop.type}
                  className="w-full h-full object-contain"
                  style={
                    prop.color && prop.color !== '#ffffff'
                      ? { filter: `hue-rotate(0deg) saturate(0%) brightness(50%)`, backgroundColor: prop.color, mixBlendMode: 'multiply' }
                      : undefined
                  }
                />
              </span>
              <span className="text-sm text-slate-200 truncate">
                {prop.type}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isColorable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  className="text-slate-400 hover:text-blue-400 p-1 transition-colors"
                  title="Change color"
                >
                  <FaPalette size={12} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(prop.id);
                }}
                className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                title="Delete prop"
              >
                <FaTrash size={12} />
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>
              Position: ({Math.round(prop.x)}, {Math.round(prop.y)})
            </div>
            <div>
              Size: {Math.round(prop.width)}×{Math.round(prop.height)}
            </div>
            {prop.rotation !== undefined && prop.rotation !== 0 && (
              <div>Rotation: {Math.round(prop.rotation)}°</div>
            )}
            {isColorable && prop.color && (
              <div className="flex items-center gap-2">
                <span>Color:</span>
                <div
                  className="w-3 h-3 rounded border border-slate-600"
                  style={{ backgroundColor: prop.color }}
                />
                <span className="font-mono text-xs">{prop.color}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Color Picker */}
      {showColorPicker && isColorable && (
        <div className="px-3 pb-3">
          <div className="border-t border-slate-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Color Tinting</span>
              <button
                onClick={() => onUpdate(prop.id, { color: '#ffffff' })}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
                title="Reset to white (no tinting)"
              >
                Reset
              </button>
            </div>
            <ColorPicker
              color={prop.color || '#ffffff'}
              onChange={(color) => onUpdate(prop.id, { color })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function PropSidebar() {
  const { layers, currentLayerIndex } = useLayer();
  const { moveProp, deleteProp, updateProp, selectedPropId, setSelectedPropId } =
    useProps();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const currentLayer = layers[currentLayerIndex];
  const props = currentLayer?.props || [];

  const handleDelete = (propId: string) => {
    deleteProp(currentLayerIndex, propId);
  };

  const handleUpdate = (propId: string, updates: Partial<Prop>) => {
    updateProp(currentLayerIndex, propId, updates);
  };

  return (
    <div className="fixed top-12 left-0 bottom-0 z-50 bg-slate-900/95 shadow-xl transition-all duration-300 ease-in-out w-64 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-200">Props on Layer</h2>
        <p className="text-xs text-slate-400 mt-1">
          {currentLayer?.name || "No layer selected"}
        </p>
      </div>

      {/* Props List */}
      <div className="flex-1 overflow-y-auto">
        {props.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            No props on this layer
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (!over || active.id === over.id) return;

                // Reversed view array
                const reversed = [...props].reverse();
                const oldReversedIndex = reversed.findIndex(
                  (p) => p.id === active.id
                );
                const newReversedIndex = reversed.findIndex(
                  (p) => p.id === over.id
                );

                if (oldReversedIndex === -1 || newReversedIndex === -1) return;

                // Convert reversed indices back to original indices
                const oldIndex = props.length - 1 - oldReversedIndex;
                const newIndex = props.length - 1 - newReversedIndex;

                moveProp(currentLayerIndex, oldIndex, newIndex);
              }}
            >
              <SortableContext
                // Items must match DOM visual order => use reversed ids
                items={[...props].reverse().map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-2 space-y-1">
                  {[...props].reverse().map((prop, reversedIndex) => {
                    const originalIndex = props.length - 1 - reversedIndex;
                    return (
                      <SortablePropItem
                        key={prop.id}
                        prop={prop}
                        index={originalIndex}
                        isSelected={selectedPropId === prop.id}
                        onDelete={handleDelete}
                        onSelect={setSelectedPropId}
                        onUpdate={handleUpdate}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            <div className="px-4 py-2 text-xs text-slate-500">
              <p>• Click prop to select</p>
              <p>• Drag handle (≡) to reorder</p>
              <p>• Props at top render on top</p>
            </div>
          </>
        )}
      </div>

      {/* Footer with count */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-900/50">
        <p className="text-xs text-slate-400">Total props: {props.length}</p>
      </div>
    </div>
  );
}
