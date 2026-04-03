import { create } from "zustand";
import * as THREE from "three";

/**
 * STABILITY RULE: Strict 3-level hierarchy
 * Scene -> Layers -> Objects
 */

export type ThreeObjectType =
  | "line"
  | "polyline"
  | "circle"
  | "arc"
  | "rect"
  | "polygon"
  | "ellipse"
  | "spline"
  | "hatch" // 2D
  | "box"
  | "cylinder"
  | "sphere" // 3D Primitives
  | "wall"
  | "door"
  | "window"
  | "slab"
  | "stairs"
  | "roof" // Architectural
  | "comment"
  | "text"
  | "dimension"; // Annotation

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  order: number;
}

export interface ThreeObject {
  id: string; // globally unique UUID
  type: ThreeObjectType;
  layerId: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number, number]; // Quaternion [x, y, z, w]
    scale: [number, number, number];
  };
  properties: Record<string, any>;
  color: string;
  lockedBy?: string | null;
  lastModifiedBy?: string;
  geometryData?: string; // Serialized CSG/mesh results for replace_geometry
  parentObjectId?: string; // For doors/windows linked to walls
}

export interface BlockDefinition {
  id: string;
  name: string;
  objects: ThreeObject[];
}

export type UserRole = "Admin" | "Editor" | "Viewer";

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor: [number, number, number] | null;
  cameraPosition: [number, number, number];
}

interface HistoryOptions {
  recordHistory?: boolean;
}

interface ThreeStore {
  layers: Layer[];
  objects: ThreeObject[];
  selectedObjectId: string | null;
  activeLayerId: string;
  viewMode: "2D" | "3D";
  presences: Record<string, UserPresence>;
  blockLibrary: Record<string, BlockDefinition>;
  userRole: UserRole;
  unitSystem: "metric" | "imperial";
  gridSpacing: number;
  localCursor: [number, number, number];
  cinematicMode: boolean;
  projectName: string;
  projectId: string | null;
  isDragging: boolean;
  history: string[];
  historyIndex: number;

  // Basic Actions
  setLayers: (layers: Layer[]) => void;
  setObjects: (objects: ThreeObject[]) => void;
  setActiveLayer: (id: string) => void;
  setViewMode: (mode: "2D" | "3D") => void;
  setSelectedObjectId: (id: string | null) => void;
  setLocalCursor: (cursor: [number, number, number]) => void;
  setCinematicMode: (enabled: boolean) => void;
  setProjectInfo: (id: string, name: string) => void;
  resetHistory: () => void;

  // Operation-based Actions (STABILITY RULE: sync these transactions)
  addObject: (obj: ThreeObject, options?: HistoryOptions) => void;
  updateObject: (
    id: string,
    updates: Partial<ThreeObject>,
    options?: HistoryOptions
  ) => void;
  deleteObject: (id: string, options?: HistoryOptions) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Layer Management
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;

  // Collaboration/Presence
  updatePresence: (userId: string, presence: Partial<UserPresence>) => void;
  removePresence: (userId: string) => void;

  // Snapshots
  getSnapshot: () => string; // stringified JSON for persistence
  restoreSnapshot: (json: string) => void;

  // Block Library
  defineBlock: (name: string, objectIds: string[]) => void;
  insertBlock: (blockId: string, position: [number, number, number]) => void;
}

export const DEFAULT_LAYER_ID = "layer-0";

const createSnapshot = (
  state: Pick<ThreeStore, "layers" | "objects" | "activeLayerId">
) =>
  JSON.stringify({
    layers: state.layers,
    objects: state.objects,
    activeLayerId: state.activeLayerId,
    version: "1.0-stability",
  });

export const useThreeStore = create<ThreeStore>((set, get) => ({
  layers: [
    {
      id: DEFAULT_LAYER_ID,
      name: "Default",
      visible: true,
      locked: false,
      color: "#ffffff",
      order: 0,
    },
  ],
  objects: [],
  selectedObjectId: null,
  activeLayerId: DEFAULT_LAYER_ID,
  viewMode: "2D",
  presences: {},
  blockLibrary: {},
  userRole: "Editor",
  unitSystem: "metric",
  gridSpacing: 1,
  localCursor: [0, 0, 0],
  cinematicMode: false,
  projectName: "Untitled Sheet",
  projectId: null,
  isDragging: false,
  history: [],
  historyIndex: -1,

  setLayers: (layers) => set({ layers }),
  setObjects: (objects) => set({ objects }),
  setActiveLayer: (id) => set({ activeLayerId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  setLocalCursor: (localCursor) => set({ localCursor }),
  setCinematicMode: (cinematicMode) => set({ cinematicMode }),
  setProjectInfo: (id, name) => set({ projectId: id, projectName: name }),
  resetHistory: () => {
    const snapshot = get().getSnapshot();
    set({ history: [snapshot], historyIndex: 0 });
  },

  pushHistory: () => {
    const snapshot = get().getSnapshot();
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory[newHistory.length - 1] === snapshot) {
      return;
    }
    newHistory.push(snapshot);
    // Limit history to 50 steps
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const snapshot = history[prevIndex];
      get().restoreSnapshot(snapshot);
      set({ historyIndex: prevIndex });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const snapshot = history[nextIndex];
      get().restoreSnapshot(snapshot);
      set({ historyIndex: nextIndex });
    }
  },

  addObject: (obj, options) => {
    const state = get();
    if (state.userRole === "Viewer") return;
    set((current) => ({ objects: [...current.objects, obj] }));
    if (options?.recordHistory !== false) {
      get().pushHistory();
    }
  },

  updateObject: (id, updates, options) => {
    const state = get();
    if (state.userRole === "Viewer") return;
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    }));
    if (options?.recordHistory !== false) {
      get().pushHistory();
    }
  },

  deleteObject: (id, options) => {
    const state = get();
    if (state.userRole === "Viewer") return;
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectId:
        state.selectedObjectId === id ? null : state.selectedObjectId,
    }));
    if (options?.recordHistory !== false) {
      get().pushHistory();
    }
  },

  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  updatePresence: (userId, presence) =>
    set((state) => ({
      presences: {
        ...state.presences,
        [userId]: {
          ...state.presences[userId],
          ...presence,
          id: userId,
        } as UserPresence,
      },
    })),

  removePresence: (userId) =>
    set((state) => {
      const newPresences = { ...state.presences };
      delete newPresences[userId];
      return { presences: newPresences };
    }),

  restoreSnapshot: (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.objects) set({ objects: data.objects });
      if (data.layers) set({ layers: data.layers });
    } catch (e) {
      console.error("Failed to restore snapshot", e);
    }
  },

  getSnapshot: () => {
    return createSnapshot(get());
  },

  setRole: (role: UserRole) => set({ userRole: role }),

  defineBlock: (name: string, objectIds: string[]) =>
    set((state) => {
      if (state.userRole === "Viewer") return state;
      const blockObjects = state.objects.filter((o) =>
        objectIds.includes(o.id)
      );
      const newBlock: BlockDefinition = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        objects: JSON.parse(JSON.stringify(blockObjects)),
      };
      return {
        blockLibrary: { ...state.blockLibrary, [newBlock.id]: newBlock },
      };
    }),

  insertBlock: (blockId: string, position: [number, number, number]) =>
    set((state) => {
      if (state.userRole === "Viewer") return state;
      const blockDef = state.blockLibrary[blockId];
      if (!blockDef) return state;
      const instance: ThreeObject = {
        id: Math.random().toString(36).substr(2, 9),
        type: "box" as any, // fallback type for the instance holder
        layerId: state.activeLayerId,
        transform: { position, rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
        properties: { blockRef: blockId },
        color: "#ffffff",
      };
      return { objects: [...state.objects, instance] };
    }),
}));

useThreeStore.getState().resetHistory();
