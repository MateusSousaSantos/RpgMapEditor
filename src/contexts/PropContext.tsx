import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { Prop } from '../types/props';
import { useLayerState } from './LayerStateContext';
import { useUndoRedo } from './UndoRedoContext';
import { AddPropCommand, RemovePropCommand, UpdatePropCommand } from '../commands/PropCommand';

interface PropContextType {
  // Prop queries
  getLayerProps: (layerIndex: number) => Prop[];
  getPropById: (layerIndex: number, propId: string) => Prop | undefined;
  
  // Prop CRUD operations
  addProp: (layerIndex: number, prop: Prop) => void;
  updateProp: (layerIndex: number, propId: string, updates: Partial<Prop>) => void;
  deleteProp: (layerIndex: number, propId: string) => void;
  
  // Batch operations
  updateLayerProps: (layerIndex: number, updater: (props: Prop[]) => Prop[]) => void;
}

const PropContext = createContext<PropContextType | undefined>(undefined);

export const useProps = () => {
  const context = useContext(PropContext);
  if (!context) {
    throw new Error('useProps must be used within a PropProvider');
  }
  return context;
};

interface PropProviderProps {
  children: ReactNode;
}

/**
 * PropContext manages all prop-related state and operations
 * Integrated with command system for full undo/redo support
 * Subscribed to LayerStateContext for automatic state sync
 */
export const PropProvider: React.FC<PropProviderProps> = ({ children }) => {
  const layerState = useLayerState();
  const { executeCommand, isExecuting } = useUndoRedo();

  // Update layer props directly (used by commands and internal operations)
  const updateLayerProps = useCallback((layerIndex: number, updater: (props: Prop[]) => Prop[]) => {
    layerState.setLayers(prevLayers =>
      prevLayers.map((layer, i) =>
        i === layerIndex ? { ...layer, props: updater(layer.props) } : layer
      )
    );
  }, [layerState]);

  // Get all props for a layer
  const getLayerProps = useCallback((layerIndex: number): Prop[] => {
    const layer = layerState.layers[layerIndex];
    return layer ? layer.props : [];
  }, [layerState.layers]);

  // Get a specific prop by ID
  const getPropById = useCallback((layerIndex: number, propId: string): Prop | undefined => {
    const layer = layerState.layers[layerIndex];
    return layer?.props.find(p => p.id === propId);
  }, [layerState.layers]);

  // Add prop to layer with command support
  const addProp = useCallback((layerIndex: number, prop: Prop) => {
    if (isExecuting) {
      // Direct update during undo/redo
      updateLayerProps(layerIndex, (props) => [...props, prop]);
      return;
    }

    const command = new AddPropCommand(layerIndex, prop, updateLayerProps);
    executeCommand(command);
  }, [isExecuting, executeCommand, updateLayerProps]);

  // Update prop with command support
  const updateProp = useCallback((layerIndex: number, propId: string, updates: Partial<Prop>) => {
    const oldProp = getPropById(layerIndex, propId);
    if (!oldProp) return;

    const newProp = { ...oldProp, ...updates };

    if (isExecuting) {
      // Direct update during undo/redo
      updateLayerProps(layerIndex, (props) =>
        props.map(p => (p.id === propId ? newProp : p))
      );
      return;
    }

    // Only create command if something actually changed
    if (JSON.stringify(oldProp) === JSON.stringify(newProp)) {
      return;
    }

    const command = new UpdatePropCommand(layerIndex, propId, oldProp, newProp, updateLayerProps);
    executeCommand(command);
  }, [layerState.layers, isExecuting, executeCommand, updateLayerProps, getPropById]);

  // Delete prop with command support
  const deleteProp = useCallback((layerIndex: number, propId: string) => {
    const layer = layerState.layers[layerIndex];
    if (!layer) return;

    const propIndex = layer.props.findIndex((p) => p.id === propId);
    const prop = layer.props[propIndex];
    if (!prop) return;

    if (isExecuting) {
      // Direct delete during undo/redo
      updateLayerProps(layerIndex, (props) => props.filter((p) => p.id !== propId));
      return;
    }

    const command = new RemovePropCommand(layerIndex, prop, propIndex, updateLayerProps);
    executeCommand(command);
  }, [layerState.layers, isExecuting, executeCommand, updateLayerProps]);

  const value: PropContextType = {
    getLayerProps,
    getPropById,
    addProp,
    updateProp,
    deleteProp,
    updateLayerProps,
  };

  return (
    <PropContext.Provider value={value}>
      {children}
    </PropContext.Provider>
  );
};
