# RPG Map Editor - Architecture Overview (Post-Phase 2)

## System Architecture

### Context Hierarchy

The application uses a hierarchical context structure for state management and dependency injection:

```
┌─────────────────────────────────────────────────────────────┐
│                     UndoRedoProvider                         │
│   (Root: Manages command execution, undo/redo stacks)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      ToolProvider                            │
│   (Tool selection: draw, select, erase, etc.)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   LayerStateProvider                         │
│   (Data: layers, grid, map config, current selections)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐        ┌──────────▼──────────┐
│AutotilingProvider       │   PropProvider      │
│(Autotiling engines,     │(Props: add, update, │
│ auto-syncs to matrix)   │ delete with commands)│
└───────┬────────┘        └──────────┬──────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               LayerOperationsProvider                        │
│   (Operations: Delegates to specialized contexts)           │
│   - Layer CRUD  →  uses LayerState + UndoRedo              │
│   - Props       →  delegates to PropContext                │
│   - Autotiling  →  uses AutotilingContext                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 LayerProvider (Facade)                       │
│   (Backward compatibility: composes all contexts)           │
│   Keeps existing code working during migration              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              MapStorageIntegration                           │
│   (Bridges layer context with storage context)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   ModalProvider                              │
│   (Dialog/modal state management)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   AppContent                                 │
│   (Main UI with error boundaries for major sections)        │
└──────────────────────────────────────────────────────────────┘
```

## Context Responsibilities

### UndoRedoContext
- **Manages**: Command execution, undo/redo stacks
- **API**: `executeCommand()`, `undo()`, `redo()`, `isExecuting` flag
- **Size**: ~120 lines
- **Key Features**:
  - Prevents recursive command execution
  - Maintains configurable history limit (default: 50)
  - Command queue support

### LayerStateContext
- **Manages**: Pure application state (data)
- **State**:
  - Map configuration (name, rows, cols)
  - Layers array with tiles and props
  - Current layer index
  - Grid layer configuration
  - Loading state
- **API**: Setters and state values only
- **Size**: ~70 lines
- **Dependencies**: None (root state provider)

### AutotilingContext
- **Manages**: Autotiling engine lifecycle and synchronization
- **Features**:
  - Creates/destroys AutotilingEngine instances
  - **Subscribes to LayerStateContext** changes
  - Automatically syncs matrices when layers update
  - No stale references to layer matrices
- **API**: `getAutotilingEngine()`, `syncAutotilingEngines()`
- **Size**: ~90 lines
- **Dependencies**: LayerStateContext

### PropContext
- **Manages**: Prop operations with command support
- **API**:
  - `addProp()` - Add with command
  - `updateProp()` - Update with command (handles position, size, rotation)
  - `deleteProp()` - Delete with command
  - `getLayerProps()` - Query
  - `getPropById()` - Query
  - `updateLayerProps()` - Batch operations
- **Size**: ~110 lines
- **Features**:
  - Full undo/redo integration
  - Smart change detection (only creates commands if needed)
  - Automatic sync to LayerStateContext
- **Dependencies**: LayerStateContext, UndoRedoContext

### LayerOperationsContext
- **Manages**: Layer operations and orchestration
- **API**:
  - Layer CRUD: `addLayer()`, `removeLayer()`, `duplicateLayer()`
  - Layer properties: `updateLayerName()`, `updateLayerVisibility()`, `updateLayerOpacity()`
  - Layer content: `updateLayerTile()`, `updateLayerMatrix()`, `updateLayerTextureMatrix()`
  - Prop delegation: Calls `PropContext` methods
  - Grid operations: `updateGridVisibility()`, `updateGridOpacity()`, etc.
- **Size**: ~430 lines
- **Dependencies**: LayerStateContext, UndoRedoContext, AutotilingContext, PropContext

### LayerProvider (Facade)
- **Purpose**: Backward compatibility
- **Implementation**: Composes all specialized contexts
- **API**: Combined interface from all contexts
- **Size**: ~70 lines
- **Migration Path**: Gradual (can use old `useLayer()` hook while adding new hooks)

## Command System

### Command Hierarchy

All commands implement the `Command` interface:

```typescript
interface Command {
  id: string;           // Unique command ID
  timestamp: number;    // When executed
  description: string;  // User-friendly description
  execute(): void;      // Forward operation
  undo(): void;         // Reverse operation
}
```

### Available Commands

| Command | File | Purpose | Undo Support |
|---------|------|---------|--------------|
| GridConfigCommand | commands/ | Grid visibility/opacity | ✅ |
| LayerOperationCommand | commands/ | Add/remove/reorder layers | ✅ |
| LayerPropertyCommand | commands/ | Layer name/visibility/opacity | ✅ |
| PaintTilesCommand | commands/ | Tile painting with autotiling | ✅ |
| AddPropCommand | commands/PropCommand | Add prop to layer | ✅ |
| RemovePropCommand | commands/PropCommand | Remove prop from layer | ✅ |
| UpdatePropCommand | commands/PropCommand | Update prop position/size/rotation | ✅ (NEW) |

### Command Creation Flow

```
User Action (click, drag, etc.)
    ↓
Component calls context method
    ↓
Method checks isExecuting flag
    ├─ If true: Direct state update (undo/redo in progress)
    └─ If false: Create Command object
    ↓
Command created with old/new state
    ↓
executeCommand(command) called
    ↓
UndoRedoContext:
  ├─ Clears redo stack
  ├─ Calls command.execute()
  ├─ Pushes to undo stack
  └─ Enforces history limit
    ↓
Command updates state via callback
    ↓
React re-renders with new state
```

## Data Flow

### Tile Painting Example

```
User clicks on canvas
    ↓
Workspace.onMouseDown() / Workspace.onMouseMove()
    ↓
usePaintingTool hook:
    ├─ calculateTilePosition()
    ├─ AutotilingEngine.updateTile()
    │   ├─ Analyzes neighbors
    │   ├─ Resolves textures
    │   └─ Returns updates
    └─ Collects tile changes
    ↓
LayerOperationsContext.updateLayerMatrix()
    ├─ If !isExecuting: Create PaintTilesCommand
    ├─ Command stores old/new matrices
    ├─ executeCommand() in UndoRedoContext
    └─ State update in LayerStateContext
    ↓
LayerStateContext.setLayers() (triggers all subscribed contexts)
    ├─ LayerStateContext updates
    ├─ PropContext can query updated layers
    ├─ AutotilingContext syncs engines
    └─ React re-renders
    ↓
TileGrid component re-renders with new tiles
```

### Prop Update Example (Position/Rotation)

```
User drags prop in PropLayer
    ↓
PropLayer.PropImage.onDragEnd() / onTransformEnd()
    ↓
onChange() callback → updateProp() in component
    ↓
PropContext.updateProp()
    ├─ Get current prop state
    ├─ Create merged new prop
    ├─ Check if anything changed
    ├─ If nothing changed: Return (no command)
    └─ Create UpdatePropCommand(oldProp, newProp)
    ↓
executeCommand() in UndoRedoContext
    ├─ Calls command.execute()
    ├─ UpdatePropCommand.execute() updates props array
    └─ Pushes to undo stack
    ↓
PropContext.updateLayerProps() callback triggered
    ├─ LayerStateContext.setLayers()
    └─ React re-renders PropLayer
```

## Data Structure

### Layer
```typescript
interface EnhancedLayer {
  id: string;                    // Unique layer ID
  name: string;                  // Display name
  visible: boolean;              // Visibility toggle
  opacity: number;               // 0-1
  matrix: TileType[][];          // Tile grid
  textureMatrix?: string[][];    // Texture IDs (for rendering)
  props: Prop[];                 // Props on this layer
}
```

### Prop
```typescript
interface Prop {
  id: string;                    // Unique prop ID
  type: string;                  // Prop type (tree, chair, etc.)
  x: number;                     // Position X
  y: number;                     // Position Y
  width: number;                 // Size
  height: number;
  rotation?: number;             // Rotation in degrees
  src: string;                   // Image path
}
```

### TileType
```typescript
type TileType = 'grass' | 'water' | 'wall' | 'empty';
```

## Subscription Pattern

The architecture uses automatic subscriptions for state synchronization:

### AutotilingContext Subscription
```
useEffect(() => {
  // When layers change, sync autotiling engines
  layerState.layers.forEach(layer => {
    const engine = autotilingEngines.get(layer.id);
    if (engine) {
      engine.updateMatrix(layer.matrix);
    }
  });
}, [layerState.layers]);
```

Benefits:
- ✅ Engines never have stale matrix references
- ✅ No manual `updateMatrix()` calls needed
- ✅ Automatic cleanup of removed layers
- ✅ Reactive pattern (React-idiomatic)

## Component Integration

### Main Components Using Contexts

| Component | Uses | Purpose |
|-----------|------|---------|
| Workspace | All layer/undo contexts | Main canvas and rendering |
| Sidebar | Layer, Prop, Tool contexts | Layer list and prop selection |
| TileGrid | Layer, Autotiling contexts | Tile rendering |
| PropLayer | Layer, Prop contexts | Prop rendering and interaction |
| Toolbar | All contexts | Undo/redo, save/load buttons |

### Error Boundaries

```
AppContent (Root)
├─ ErrorBoundary name="Sidebar"
│  └─ Sidebar component
├─ ErrorBoundary name="Workspace"
│  └─ Workspace (contains TileGrid, PropLayer)
└─ ErrorBoundary name="Toolbar"
   └─ Toolbar component
```

Prevents:
- Single component error crashing entire app
- User loss of work
- Provides recovery UI

## Performance Considerations

### Optimizations in Place
- ✅ TileGrid chunk-based rendering (32x32 tile chunks)
- ✅ Texture caching
- ✅ Memoized React components
- ✅ Debounced chunk updates
- ✅ Pixel-art rendering settings (no image smoothing)

### Potential Improvements
- ⏳ Virtual scrolling for large layer lists
- ⏳ WebWorker for autotiling calculations
- ⏳ Texture cache LRU eviction
- ⏳ Konva event listener cleanup
- ⏳ Memory pooling for command objects

## Testing Strategy

### Unit Tests
- Context hooks in isolation
- Command classes
- Utility functions (autotiling, texture loading)

### Integration Tests
- Context composition
- Command execution flow
- State synchronization

### Component Tests
- Workspace rendering
- Sidebar interactions
- PropLayer drag/transform

### Migration Path
1. Write tests for new contexts (PropContext, AutotilingContext)
2. Keep old tests for LayerContext facade
3. Gradually migrate components to new hooks
4. Remove old hook tests once migration complete

## Code Metrics (Post-Phase 2)

| Metric | Value |
|--------|-------|
| Total Context LOC | ~520 lines |
| Total Commands LOC | ~300 lines |
| Total Components LOC | ~2000 lines |
| Type Definitions LOC | ~200 lines |
| Test Coverage | Needs improvement |
| Build Size | 656.71 kB (minified) |
| Gzip Size | 200.70 kB |

## Dependency Graph

```
External Dependencies:
├─ React 19.2.0 (contexts, hooks)
├─ Konva.js 10.0.11 (canvas rendering)
├─ React-Konva 19.2.0 (Konva React bindings)
├─ dnd-kit 6.0+ (drag and drop)
├─ Tailwind CSS 4.1 (styling)
└─ TypeScript 5.9 (type safety)

Internal Architecture:
├─ Contexts (state management)
│  ├─ UndoRedoContext (root)
│  ├─ LayerStateContext (data)
│  ├─ AutotilingContext (engine mgmt)
│  ├─ PropContext (props)
│  └─ LayerOperationsContext (orchestration)
├─ Commands (operations)
│  ├─ GridConfigCommand
│  ├─ LayerPropertyCommand
│  ├─ LayerOperationCommand
│  ├─ PaintTilesCommand
│  └─ PropCommand (AddProp, RemoveProp, UpdateProp)
├─ Utilities (algorithms)
│  ├─ AutotilingEngine
│  ├─ NeighborAnalyzer
│  ├─ TileResolver
│  └─ WallTileResolver
└─ Components (UI)
   ├─ Workspace (main)
   ├─ Sidebar (layer management)
   ├─ PropLayer (prop rendering)
   ├─ TileGrid (tile rendering)
   └─ Dialogs (create/load/save)
```

## Backward Compatibility

The `useLayer()` hook provides complete backward compatibility:

```typescript
// Old code still works
const { layers, addLayer, updateProp } = useLayer();

// New code can use specialized hooks
const { layers } = useLayerState();
const { addLayer } = useLayerOperations();
const { updateProp } = useProps();
```

This allows:
- ✅ Gradual migration component by component
- ✅ Mixing old and new hooks in same file
- ✅ No breaking changes to existing code
- ✅ Progressive enhancement path

## Next Steps

### Phase 3: Hook Extraction
- Split `usePaintingTool` (408 lines) into focused hooks
- Extract `TileGrid` rendering logic
- Expected: 100+ lines of cleaner, testable hooks

### Phase 4: Performance Optimization
- Implement texture cache eviction
- Add Konva cleanup handlers
- Profile and optimize hot paths

### Phase 5: Enhanced Features
- Prop animations
- Tile animation support
- Batch operations
- Advanced layer blending

---

## Conclusion

The RPG Map Editor now has a clean, modular architecture with:
- ✅ Clear separation of concerns
- ✅ Comprehensive undo/redo for all operations
- ✅ Automatic state synchronization
- ✅ Error boundaries for stability
- ✅ 100% backward compatibility
- ✅ Strong foundation for future enhancements

The context hierarchy is intuitive, the command pattern is well-integrated, and the subscription system keeps state consistent without manual coordination.
