import React, { useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaMinus,
  FaCopy,
  FaGripVertical,
  FaTree,
  FaChair,
  FaStar,
  FaBuilding,
} from "react-icons/fa";
import { useTool } from "../contexts/ToolContext";
import { useLayer } from "../contexts/LayerContext";
import { useSidebar } from "../contexts/SidebarContext";
import { TileType } from "../types/textures";
import { getCategoriesWithProps, getPropsByCategory } from "../types/props";
import { PiSelection } from "react-icons/pi";
import { HiCursorClick } from "react-icons/hi";
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

export const Sidebar: React.FC = () => {
  const { isOpen, toggleSidebar } = useSidebar();
  
  // Get categories that have props
  const propCategories = getCategoriesWithProps();
  
  // Initialize sections state with dynamic prop categories
  const [sectionsOpen, setSectionsOpen] = useState(() => {
    const initial: Record<string, boolean> = {
      paintingModes: true,
      tileSelection: true,
      propSelection: true,
      layers: true,
      gridLayer: true,
    };
    // Add each prop category to sections
    propCategories.forEach(category => {
      initial[category.id] = true;
    });
    return initial;
  });

  const {
    currentTool,
    selectedTileType,
    setSelectedTileType,
    paintingMode,
    setPaintingMode,
  } = useTool();

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper to get icon component based on category icon name
  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, React.ReactElement> = {
      tree: <FaTree className="mr-2" />,
      chair: <FaChair className="mr-2" />,
      star: <FaStar className="mr-2" />,
      building: <FaBuilding className="mr-2" />,
    };
    return icons[iconName] || <FaTree className="mr-2" />;
  };

  const SectionHeader: React.FC<{
    title: string;
    isOpen: boolean;
    icon?: React.ReactNode;
    onToggle: () => void;
  }> = ({ title, isOpen, icon, onToggle }) => (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-300 hover:text-slate-200 transition-colors"
    >
      <span className="flex justify-start items-center">
        {icon ? (
          <>
        <span className="text-sm">{React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}</span>
        {title}
          </>
        ) : (
          title
        )}
      </span>
      <div
        className={`transition-transform duration-200 ${
          isOpen ? "rotate-180" : "rotate-0"
        }`}
      >
        <FaChevronDown size={12} />
      </div>
    </button>
  );

  const CollapsibleContent: React.FC<{
    isOpen: boolean;
    children: React.ReactNode;
  }> = ({ isOpen, children }) => (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div
        className={`transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0" : "-translate-y-2"
        }`}
      >
        {children}
      </div>
    </div>
  );

  const renderToolContent = () => {
    switch (currentTool) {
      case "draw":
        const availableTileTypes: {
          id: TileType;
          name: string;
          preview: string;
        }[] = [
          {
            id: "grass",
            name: "Grass Tiles",
            preview: "/assets/grass_center.png",
          },
          { id: "water", name: "Water Tiles", preview: "/assets/water.png" },
          { id: "wall", name: "Wall Tiles", preview: "/assets/walls/wood/full_center.png" },
        ];
        const showPaintingModes = currentTool === "draw" && setPaintingMode;
        return (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-200">Paint Tool</h3>
            {showPaintingModes && paintingMode && (
              <div className="border-b border-slate-700 pb-3">
                <SectionHeader
                  title="Painting Modes"
                  isOpen={sectionsOpen.paintingModes}
                  onToggle={() => toggleSection("paintingModes")}
                />
                <CollapsibleContent isOpen={sectionsOpen.paintingModes}>
                  <div className="mt-2 space-y-2 pl-5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPaintingMode("single")}
                        className={`w-10 h-10 flex items-center justify-center rounded text-slate-200 transition-all duration-200 ${
                          paintingMode === "single"
                            ? "bg-slate-400 "
                            : "bg-slate-700 hover:bg-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <HiCursorClick size={20} />
                      </button>
                      <button
                        onClick={() => setPaintingMode("box")}
                        className={`w-10 h-10 flex items-center justify-center rounded text-slate-200 transition-all duration-200 ${
                          paintingMode === "box"
                            ? "bg-slate-400 "
                            : "bg-slate-700 hover:bg-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <PiSelection size={20} />
                      </button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            )}

            <div className="border-b border-slate-700 pb-3">
              <SectionHeader
                title="Tile Selection"
                isOpen={sectionsOpen.tileSelection}
                onToggle={() => toggleSection("tileSelection")}
              />
              <CollapsibleContent isOpen={sectionsOpen.tileSelection}>
                <div className="mt-2 pl-5">
                  <div className="grid grid-cols-1 gap-4">
                    {availableTileTypes.map((tileType) => (
                      <img
                        key={tileType.id}
                        onClick={() => setSelectedTileType(tileType.id)}
                        src={tileType.preview}
                        alt={tileType.name}
                        className={`w-20 h-20 rounded pixelated outline-2 outline-offset-2 cursor-pointer transition-all duration-200 ${
                          selectedTileType === tileType.id
                            ? "outline outline-blue-400 shadow-lg shadow-blue-400/30"
                            : "hover:outline hover:outline-slate-400"
                        }`}
                        style={{ imageRendering: "pixelated" }}
                        onError={(e) => {
                          // Fallback to a colored square if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Selected:{" "}
                    {availableTileTypes.find((t) => t.id === selectedTileType)
                      ?.name || "None"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Autotiling will automatically select appropriate textures
                    based on tile placement.
                  </p>
                </div>
              </CollapsibleContent>
            </div>
          </div>
        );

      case "select":
        return <div className="space-y-4"></div>;
      case "addProp":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">
              Add Prop Tool
            </h3>
            <p className="text-sm text-slate-400">
              Drag to the map to add props such as trees, rocks, and furniture.
            </p>

            <div className="border-b border-slate-700 pb-3">
              <SectionHeader
                title="Prop Selection"
                isOpen={sectionsOpen.propSelection}
                onToggle={() => toggleSection("propSelection")}
              />
              <CollapsibleContent isOpen={sectionsOpen.propSelection}>
                <div className="mt-2 pl-5 space-y-2">
                  {propCategories.map((category) => {
                    const categoryProps = getPropsByCategory(category.id);
                    if (categoryProps.length === 0) return null;
                    
                    return (
                      <div key={category.id}>
                        <SectionHeader
                          title={category.name}
                          isOpen={sectionsOpen[category.id]}
                          icon={getCategoryIcon(category.icon)}
                          onToggle={() => toggleSection(category.id as keyof typeof sectionsOpen)}
                        />
                        <CollapsibleContent isOpen={sectionsOpen[category.id]}>
                          <div className="mt-2 grid grid-cols-4 gap-1 pb-2 pl-2">
                            {categoryProps.map((prop) => (
                              <img
                                key={prop.id}
                                src={prop.src}
                                alt={prop.name}
                                draggable="true"
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('propType', prop.id);
                                  e.dataTransfer.setData('propSrc', prop.src);
                                  e.dataTransfer.setData('propWidth', prop.defaultWidth.toString());
                                  e.dataTransfer.setData('propHeight', prop.defaultHeight.toString());
                                }}
                                className="w-15 h-15 rounded pixelated cursor-grab active:cursor-grabbing hover:outline hover:outline-slate-400 bg-slate-800/50 p-1"
                                style={{ imageRendering: "pixelated" }}
                                title={prop.name}
                              />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </div>
        );

      case "erase":
        const showEraserModes = currentTool === "erase" && setPaintingMode;
        return (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-200">Eraser Tool</h3>
            <p className="text-sm text-slate-400">
              Remove tiles from the current layer.
            </p>
            {showEraserModes && paintingMode && (
              <div className="border-b border-slate-700 pb-3">
                <SectionHeader
                  title="Eraser Modes"
                  isOpen={sectionsOpen.paintingModes}
                  onToggle={() => toggleSection("paintingModes")}
                />
                <CollapsibleContent isOpen={sectionsOpen.paintingModes}>
                  <div className="mt-2 space-y-2 pl-5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPaintingMode("single")}
                        className={`w-10 h-10 flex items-center justify-center rounded text-slate-200 transition-all duration-200 ${
                          paintingMode === "single"
                            ? "bg-slate-400 "
                            : "bg-slate-700 hover:bg-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <HiCursorClick size={20} />
                      </button>
                      <button
                        onClick={() => setPaintingMode("box")}
                        className={`w-10 h-10 flex items-center justify-center rounded text-slate-200 transition-all duration-200 ${
                          paintingMode === "box"
                            ? "bg-slate-400 "
                            : "bg-slate-700 hover:bg-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <PiSelection size={20} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      <strong>Click/Drag:</strong> Click to erase single tiles or drag to erase multiple tiles.
                    </p>
                    <p className="text-xs text-slate-500">
                      <strong>Box:</strong> Click and drag to select an area to erase all tiles within.
                    </p>
                  </div>
                </CollapsibleContent>
              </div>
            )}
          </div>
        );

      case "addMap":
        return <div className="space-y-4"></div>;

      default:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">
              No Tool Selected
            </h3>
            <p className="text-sm text-slate-400">
              Select a tool from the toolbar to get started.
            </p>
          </div>
        );
    }
  };

  const {
    layers,
    currentLayerIndex,
    addLayer,
    removeLayer,
    duplicateLayer,
    setCurrentLayer,
    updateLayerName,
    updateLayerVisibility,
    updateLayerOpacity,
    moveLayer,
    gridLayer,
    updateGridVisibility,
    updateGridOpacity,
    updateGridStrokeWidth,
    updateGridStroke,
    updateGridRenderOrder,
  } = useLayer();

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [editingLayerIndex, setEditingLayerIndex] = useState<number | null>(
    null
  );
  const [editingName, setEditingName] = useState("");

  const handleLayerNameEdit = (index: number) => {
    setEditingLayerIndex(index);
    setEditingName(layers[index].name);
  };

  const handleLayerNameSave = () => {
    if (editingLayerIndex !== null && editingName.trim()) {
      updateLayerName(editingLayerIndex, editingName.trim());
    }
    setEditingLayerIndex(null);
    setEditingName("");
  };

  const handleLayerNameCancel = () => {
    setEditingLayerIndex(null);
    setEditingName("");
  };

  const renderGridLayerPanel = () => {
    return (
      <div className="">
        <SectionHeader
          title="Grid Layer"
          isOpen={sectionsOpen.gridLayer}
          onToggle={() => toggleSection("gridLayer")}
        />
        <CollapsibleContent isOpen={sectionsOpen.gridLayer}>
          <div className="space-y-4">
            {/* Grid Visibility */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Show Grid
              </span>
              <button
                onClick={() => updateGridVisibility(!gridLayer.visible)}
                className={`px-2 py-1 flex items-center justify-center rounded text-slate-200 transition-all duration-200 ${
                  gridLayer.visible === true
                    ? "bg-slate-400 "
                    : "bg-slate-700 hover:bg-slate-400 hover:text-slate-200"
                }`}
              >
                {gridLayer.visible ? "ON" : "OFF"}
              </button>
            </div>

            {gridLayer.visible && (
              <>
                {/* Grid Opacity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">
                      Opacity
                    </span>
                    <span className="text-xs text-slate-400">
                      {Math.round(gridLayer.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={gridLayer.opacity}
                    onChange={(e) =>
                      updateGridOpacity(parseFloat(e.target.value))
                    }
                    className="w-full opacity-slider bg-slate-800 rounded-2xl "
                  />
                </div>

                {/* Grid Stroke Width */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">
                      Line Width
                    </span>
                    <span className="text-xs text-slate-400">
                      {gridLayer.strokeWidth}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={gridLayer.strokeWidth}
                    onChange={(e) =>
                      updateGridStrokeWidth(parseFloat(e.target.value))
                    }
                    className="w-full opacity-slider bg-slate-800 rounded-2xl "
                  />
                </div>

                {/* Grid Color */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-300">
                    Grid Color
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={gridLayer.stroke}
                      onChange={(e) => updateGridStroke(e.target.value)}
                      className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={gridLayer.stroke}
                      onChange={(e) => updateGridStroke(e.target.value)}
                      className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                {/* Grid Render Order */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-300">
                    Render Order
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateGridRenderOrder("background")}
                      className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                        gridLayer.renderOrder === "background"
                          ? "bg-slate-400 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      Background
                    </button>
                    <button
                      onClick={() => updateGridRenderOrder("foreground")}
                      className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                        gridLayer.renderOrder === "foreground"
                          ? "bg-slate-400 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      Foreground
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {gridLayer.renderOrder === "background"
                      ? "Grid appears behind tiles"
                      : "Grid appears in front of tiles"}
                  </p>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    );
  };

  const renderLayerPanel = () => {
    return (
      <div className="border-b border-slate-700 pb-3">
        <SectionHeader
          title="Layers"
          isOpen={sectionsOpen.layers}
          onToggle={() => toggleSection("layers")}
        />
        <CollapsibleContent isOpen={sectionsOpen.layers}>
          <div className="mt-2 space-y-2 pl-5">
            {/* Layer Controls */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => addLayer(`Layer ${layers.length + 1}`)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
                title="Add Layer"
              >
                <FaPlus size={10} />
                Add
              </button>
              <button
                onClick={() => duplicateLayer(currentLayerIndex)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
                title="Duplicate Layer"
              >
                <FaCopy size={10} />
                Duplicate
              </button>
              <button
                onClick={() => removeLayer(currentLayerIndex)}
                disabled={layers.length <= 1}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-700 hover:bg-red-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded transition-colors"
                title="Remove Layer"
              >
                <FaMinus size={10} />
                Remove
              </button>
            </div>

            {/* Layer List with dnd-kit */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (!over || active.id === over.id) return;

                // Reversed view array
                const reversed = [...layers].reverse();
                const oldReversedIndex = reversed.findIndex(
                  (l) => l.id === active.id
                );
                const newReversedIndex = reversed.findIndex(
                  (l) => l.id === over.id
                );
                if (oldReversedIndex === -1 || newReversedIndex === -1) return;

                // Convert reversed indices back to original indices
                const oldIndex = layers.length - 1 - oldReversedIndex;
                const newIndex = layers.length - 1 - newReversedIndex;

                moveLayer(oldIndex, newIndex);
              }}
            >
              <SortableContext
                // Items must match DOM visual order => use reversed ids
                items={[...layers].reverse().map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {[...layers].reverse().map((layer, reversedIndex) => {
                    const originalIndex = layers.length - 1 - reversedIndex;
                    return (
                      <SortableLayerItem
                        key={layer.id}
                        layer={layer}
                        index={originalIndex} // pass original index for logic
                        isCurrent={originalIndex === currentLayerIndex}
                        editingLayerIndex={editingLayerIndex}
                        editingName={editingName}
                        setEditingName={setEditingName}
                        handleLayerNameSave={handleLayerNameSave}
                        handleLayerNameCancel={handleLayerNameCancel}
                        handleLayerNameEdit={handleLayerNameEdit}
                        setCurrentLayer={setCurrentLayer}
                        updateLayerVisibility={updateLayerVisibility}
                        updateLayerOpacity={updateLayerOpacity}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            <div className="text-xs text-slate-500 mt-2">
              <p>• Click to select layer</p>
              <p>• Double-click name to edit</p>
              <p>• Drag handle (≡) to reorder</p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    );
  };

  return (
    <div
      className={`fixed top-12 right-0 bottom-0 z-50 bg-slate-900/80 shadow-xl transition-all duration-300 ease-in-out ${
        isOpen ? "w-96" : "w-16"
      } flex flex-col`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-${
          isOpen ? "between" : "center"
        } p-4 border-b border-slate-800 `}
      >
        {isOpen && <h2 className="text-xl font-bold text-slate-400">Tools</h2>}
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-600 hover:text-gray-200 hover:bg-slate-800 rounded transition-colors"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {/* Tool Selection */}
      {/* Tool Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 gap-y-2 flex flex-col">
            {renderToolContent()}
            {renderLayerPanel()}
            {renderGridLayerPanel()}
          </div>
        </div>
      )}
    </div>
  );
};
// Sortable item component for layers
interface SortableLayerItemProps {
  layer: any;
  index: number;
  isCurrent: boolean;
  editingLayerIndex: number | null;
  editingName: string;
  setEditingName: React.Dispatch<React.SetStateAction<string>>;
  handleLayerNameSave: () => void;
  handleLayerNameCancel: () => void;
  handleLayerNameEdit: (index: number) => void;
  setCurrentLayer: (index: number) => void;
  updateLayerVisibility: (index: number, visible: boolean) => void;
  updateLayerOpacity: (index: number, opacity: number) => void;
}

const SortableLayerItem: React.FC<SortableLayerItemProps> = ({
  layer,
  index,
  isCurrent,
  editingLayerIndex,
  editingName,
  setEditingName,
  handleLayerNameSave,
  handleLayerNameCancel,
  handleLayerNameEdit,
  setCurrentLayer,
  updateLayerVisibility,
  updateLayerOpacity,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: "default",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded transition-colors ${
        isCurrent
          ? "bg-slate-600 border border-slate-500"
          : "bg-slate-700/50 hover:bg-slate-700"
      }`}
    >
      <button
        className="text-slate-400 hover:text-slate-200 cursor-grab p-1"
        title="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <FaGripVertical size={12} />
      </button>
      <div className="flex-1 min-w-0">
        {editingLayerIndex === index ? (
          <div className="flex gap-1">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleLayerNameSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLayerNameSave();
                if (e.key === "Escape") handleLayerNameCancel();
              }}
              className="flex-1 px-2 py-1 text-xs bg-slate-800 text-slate-200 border border-slate-600 rounded"
              autoFocus
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setCurrentLayer(index)}
            onDoubleClick={() => handleLayerNameEdit(index)}
          >
            <span
              className="text-sm text-slate-200 truncate"
              title={layer.name}
            >
              {layer.name}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => updateLayerVisibility(index, !layer.visible)}
            className={`p-1 rounded transition-colors ${
              layer.visible
                ? "text-slate-200 hover:text-slate-100"
                : "text-slate-500 hover:text-slate-400"
            }`}
            title={layer.visible ? "Hide Layer" : "Show Layer"}
          >
            {layer.visible ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
          </button>
          <div className="flex-1 flex items-center gap-1">
            <span className="text-xs text-slate-400 w-8">
              {Math.round(layer.opacity * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={layer.opacity}
              onChange={(e) =>
                updateLayerOpacity(index, parseFloat(e.target.value))
              }
              className={`flex-1 h-1 ${
                isCurrent ? "bg-slate-300" : "bg-slate-700"
              } rounded-lg appearance-none cursor-pointer opacity-slider`}
              title="Layer Opacity"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
