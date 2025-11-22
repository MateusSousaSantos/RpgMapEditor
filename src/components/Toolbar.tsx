import React, { useEffect } from "react";
import {
  FaPaintBrush,
  FaUndo,
  FaRedo,
  FaSave,
  FaFolderOpen,
  FaCircle,
  FaPlus,
} from "react-icons/fa";
import { useTool } from "../contexts/ToolContext";
import { useUndoRedo } from "../contexts/UndoRedoContext";
import { useMapStorage } from "../contexts/MapStorageContext";
import { useModal } from "../contexts/ModalContext";
import { useLayer } from "../contexts/LayerContext";
import { SaveDialog } from "./SaveDialog";
import { LoadDialog } from "./LoadDialog";
import { CreateMapDialog, MapConfig } from "./CreateMapDialog";

export const Toolbar: React.FC = () => {
  const { setCurrentTool, isToolActive } = useTool();
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoDescription,
    getRedoDescription,
  } = useUndoRedo();
  const { isDirty, lastSaved, autoSaveEnabled } = useMapStorage();
  const { showModal, hideModal } = useModal();
  const { initializeNewMap } = useLayer();

  // Keyboard shortcuts for save/load/new
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        showModal(<SaveDialog onClose={() => hideModal()} />);
      } else if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        showModal(<LoadDialog onClose={() => hideModal()} />);
      } else if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        const handleCreateMap = (config: MapConfig) => {
          initializeNewMap(config);
          hideModal();
        };
        showModal(<CreateMapDialog onClose={() => hideModal()} onCreate={handleCreateMap} />);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  const Draw = () => {
    const isActive = isToolActive("draw");
    return (
      <button
        onClick={() => setCurrentTool(isActive ? null : "draw")}
        className={`p-2 rounded transition-colors ${
          isActive ? "bg-white text-black" : "hover:bg-white group"
        }`}
      >
        <FaPaintBrush
          size={24}
          className={
            isActive ? "text-black" : "text-white group-hover:text-black"
          }
        />
      </button>
    );
  };

  const UndoButton = () => {
    const undoDescription = getUndoDescription();
    return (
      <button
        onClick={undo}
        disabled={!canUndo}
        title={canUndo ? `Undo: ${undoDescription}` : "Nothing to undo"}
        className={`p-2 rounded transition-colors ${
          canUndo
            ? "hover:bg-white group text-white"
            : "text-slate-500 cursor-not-allowed"
        }`}
      >
        <FaUndo
          size={20}
          className={
            canUndo ? "text-white group-hover:text-black" : "text-slate-500"
          }
        />
      </button>
    );
  };

  const RedoButton = () => {
    const redoDescription = getRedoDescription();
    return (
      <button
        onClick={redo}
        disabled={!canRedo}
        title={canRedo ? `Redo: ${redoDescription}` : "Nothing to redo"}
        className={`p-2 rounded transition-colors ${
          canRedo
            ? "hover:bg-white group text-white"
            : "text-slate-500 cursor-not-allowed"
        }`}
      >
        <FaRedo
          size={20}
          className={
            canRedo ? "text-white group-hover:text-black" : "text-slate-500"
          }
        />
      </button>
    );
  };

  const SaveButton = () => {
    const handleSave = () => {
      showModal(<SaveDialog onClose={() => hideModal()} />);
    };

    return (
      <button
        onClick={handleSave}
        title="Save Map (Ctrl+S)"
        className="p-2 rounded transition-colors hover:bg-white group text-white"
      >
        <FaSave size={20} className="text-white group-hover:text-black" />
      </button>
    );
  };

  const LoadButton = () => {
    const handleLoad = () => {
      showModal(<LoadDialog onClose={() => hideModal()} />);
    };

    return (
      <button
        onClick={handleLoad}
        title="Open Map (Ctrl+O)"
        className="p-2 rounded transition-colors hover:bg-white group text-white"
      >
        <FaFolderOpen size={20} className="text-white group-hover:text-black" />
      </button>
    );
  };

  const NewMapButton = () => {
    const handleNewMap = () => {
      const handleCreateMap = (config: MapConfig) => {
        initializeNewMap(config);
        hideModal();
      };

      showModal(<CreateMapDialog onClose={() => hideModal()} onCreate={handleCreateMap} />);
    };

    return (
      <button
        onClick={handleNewMap}
        title="New Map (Ctrl+N)"
        className="p-2 rounded transition-colors hover:bg-white group text-white"
      >
        <FaPlus size={20} className="text-white group-hover:text-black" />
      </button>
    );
  };

  const AutoSaveIndicator = () => {
    if (!autoSaveEnabled) return null;

    return (
      <div className="flex items-center gap-1 text-xs text-slate-400 px-2">
        <FaCircle
          size={6}
          className={isDirty ? "text-yellow-400" : "text-green-400"}
        />
        <span className="text-xs">
          {isDirty ? "Unsaved" : lastSaved ? "Saved" : ""}
        </span>
      </div>
    );
  };

  // const Select = () => {
  //   const isActive = isToolActive('select');
  //   return (
  //     <button
  //       onClick={() => setCurrentTool(isActive ? null : 'select')}
  //       className={`p-2 rounded transition-colors ${
  //         isActive
  //           ? 'bg-white text-black'
  //           : 'hover:bg-white group'
  //       }`}
  //     >
  //       <FaMousePointer
  //         size={24}
  //         className={
  //           isActive
  //             ? 'text-black'
  //             : 'text-white group-hover:text-black'
  //         }
  //       />
  //     </button>
  //   );
  // };

  // const Erase = () => {
  //   const isActive = isToolActive('erase');
  //   return (
  //     <button
  //       onClick={() => setCurrentTool(isActive ? null : 'erase')}
  //       className={`p-2 rounded transition-colors ${
  //         isActive
  //           ? 'bg-white text-black'
  //           : 'hover:bg-white group'
  //       }`}
  //     >
  //       <FaEraser
  //         size={24}
  //         className={
  //           isActive
  //             ? 'text-black'
  //             : 'text-white group-hover:text-black'
  //         }
  //       />
  //     </button>
  //   );
  // };

  return (
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 w-auto px-4 h-15 rounded-full drop-shadow-2xl border-2 border-slate-500 flex items-center justify-center gap-2">
      {/* Storage Controls */}
      <NewMapButton />
      <SaveButton />
      <LoadButton />

      {/* Separator */}
      <div className="w-px h-8 bg-slate-600 mx-2"></div>

      {/* Undo/Redo Controls */}
      <UndoButton />
      <RedoButton />

      {/* Separator */}
      <div className="w-px h-8 bg-slate-600 mx-2"></div>

      {/* Tools */}
      {/* <Select /> */}
      <Draw />
      {/* <Erase /> */}

      {/* Auto-save Indicator */}
      <AutoSaveIndicator />
    </div>
  );
};
