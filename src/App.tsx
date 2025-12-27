// App.tsx
import React, { useEffect } from "react";
import { Toolbar } from "./components/Toolbar";
import { ModalProvider, useModal } from "./contexts/ModalContext";
import { ToolProvider } from "./contexts/ToolContext";
import { LayerProvider, useLayer } from "./contexts/LayerContext";
import { LayerStateProvider } from "./contexts/LayerStateContext";
import { LayerOperationsProvider } from "./contexts/LayerOperationsContext";
import { AutotilingProvider } from "./contexts/AutotilingContext";
import { PropProvider } from "./contexts/PropContext";
import { UndoRedoProvider } from "./contexts/UndoRedoContext";
import { MapStorageIntegration } from "./components/MapStorageIntegration";
import { Sidebar } from "./components/Sidebar";
import { Workspace } from "./components/Workspace";
import { CreateMapDialog, MapConfig } from "./components/CreateMapDialog";
import { useMapStorage } from "./contexts/MapStorageContext";
import { LoadingScreen } from "./components/LoadingScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Component that has access to all contexts
const AppContent: React.FC = () => {
  const { showModal, hideModal } = useModal();
  const { initializeNewMap, mapConfig, isInitializingMap } = useLayer();
  const { getMapList, isLoadingMap } = useMapStorage();

  // Check for first visit or empty maps and show create dialog
  useEffect(() => {
    const savedMaps = getMapList();
    
    // Show create map dialog if no saved maps exist
    if (savedMaps.length === 0) {
      const handleCreateMap = async (config: MapConfig) => {
        await initializeNewMap(config);
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
    <ErrorBoundary name="AppContent">
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

          <ErrorBoundary name="Sidebar">
            <Sidebar />
          </ErrorBoundary>
          <section className="flex-1 overflow-hidden relative">
            <ErrorBoundary name="Workspace">
              <Workspace />
            </ErrorBoundary>
          </section>
          <ErrorBoundary name="Toolbar">
            <Toolbar />
          </ErrorBoundary>
        </main>
        
        {/* Loading Screens */}
        {isInitializingMap && (
          <LoadingScreen 
            message="Creating New Map"
            showProgress={false}
          />
        )}
        
        {isLoadingMap && (
          <LoadingScreen 
            message="Loading Map"
            showProgress={false}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <UndoRedoProvider>
      <ToolProvider>
        <LayerStateProvider>
          <AutotilingProvider>
            <PropProvider>
              <LayerOperationsProvider>
                <LayerProvider>
                  <MapStorageIntegration>
                    <ModalProvider>
                      <AppContent />
                    </ModalProvider>
                  </MapStorageIntegration>
                </LayerProvider>
              </LayerOperationsProvider>
            </PropProvider>
          </AutotilingProvider>
        </LayerStateProvider>
      </ToolProvider>
    </UndoRedoProvider>
  );
};

export default App;
