// App.tsx
import React from "react";
import { Toolbar } from "./components/Toolbar";
import { ModalProvider } from "./contexts/ModalContext";
import { ToolProvider } from "./contexts/ToolContext";
import { LayerProvider } from "./contexts/LayerContext";
import { Sidebar } from "./components/Sidebar";
import { Workspace } from "./components/Workspace";

const ROWS = 10;
const COLS = 10;

const App: React.FC = () => {
  return (
    <ModalProvider>
      <ToolProvider>
        <LayerProvider rows={ROWS} cols={COLS}>
          <div className="flex h-screen w-screen overflow-hidden relative">
          <main className="flex-1 flex flex-col bg-slate-950">
            <header className="h-12 border-b border-slate-800 bg-slate-900/80 flex items-center px-4 justify-between">
              <h1 className="text-sm font-semibold text-slate-100">
                RPG Map Editor
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Zoom: (use mouse wheel)</span>
              </div>
            </header>

            <Sidebar />
            <section className="flex-1 overflow-hidden relative">
              {/* <MapGrid /> */}
              <Workspace />
            </section>
            <Toolbar />
          </main>
          </div>
        </LayerProvider>
      </ToolProvider>
    </ModalProvider>
  );
};

export default App;
