// Exported contexts for cleaner imports
// Phase 1: Split LayerContext into specialized contexts
// Phase 2: Extract PropContext for prop management

export { useLayerState, LayerStateProvider } from './LayerStateContext';
export { useLayerOperations, LayerOperationsProvider } from './LayerOperationsContext';
export { useAutotiling, AutotilingProvider } from './AutotilingContext';
export { useProps, PropProvider } from './PropContext';

// Backward compatibility exports
export { useLayer, LayerProvider } from './LayerContext';

// Other contexts
export { useModal, ModalProvider } from './ModalContext';
export { useTool, ToolProvider } from './ToolContext';
export { useUndoRedo, UndoRedoProvider } from './UndoRedoContext';
export { useMapStorage, MapStorageProvider } from './MapStorageContext';
export { useSidebar, SidebarProvider } from './SidebarContext';
