// App.tsx
import React, { useEffect } from "react";
import { Toolbar } from "./components/Toolbar";
import { ModalProvider, useModal } from "./contexts/ModalContext";
import { ToolProvider } from "./contexts/ToolContext";
import { LayerProvider, useLayer } from "./contexts/LayerContext";
import { UndoRedoProvider } from "./contexts/UndoRedoContext";
import { MapStorageIntegration } from "./components/MapStorageIntegration";
import { Sidebar } from "./components/Sidebar";
import { Workspace } from "./components/Workspace";
import { CreateMapDialog, MapConfig } from "./components/CreateMapDialog";
import { useMapStorage } from "./contexts/MapStorageContext";



// Component that has access to all contexts
const AppContent: React.FC = () => {
  const { showModal, hideModal } = useModal();
  const { initializeNewMap, mapConfig } = useLayer();
  const { getMapList } = useMapStorage();

  // Check for first visit or empty maps and show create dialog
  useEffect(() => {
    const savedMaps = getMapList();
    
    // Show create map dialog if no saved maps exist
    if (savedMaps.length === 0) {
      const handleCreateMap = (config: MapConfig) => {
        initializeNewMap(config);
        hideModal();
      };

      showModal(
        <CreateMapDialog 
          onClose={() => hideModal()} 
          onCreate={handleCreateMap}
        />
      );
    }
  }, []); // Only run once on mount

  return (
    <div className="flex h-screen w-screen overflow-hidden relative">
      <main className="flex-1 flex flex-col bg-slate-950">
        <header className="h-12 border-b border-slate-800 bg-slate-900/80 flex items-center px-4 justify-between">
          <h1 className="text-sm font-semibold text-slate-100">
            RPG Map Editor - {mapConfig.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{mapConfig.cols}×{mapConfig.rows} • Zoom: (use mouse wheel)</span>
          </div>
        </header>

        <Sidebar />
        <section className="flex-1 overflow-hidden relative">
          <Workspace />
        </section>
        <Toolbar />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <UndoRedoProvider>
      <ToolProvider>
        <LayerProvider>
          <MapStorageIntegration>
            <ModalProvider>
              <AppContent />
            </ModalProvider>
          </MapStorageIntegration>
        </LayerProvider>
      </ToolProvider>
    </UndoRedoProvider>
  );
};

export default App;
