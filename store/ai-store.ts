import { create } from "zustand";
import { ThreeObject } from "./threeStore";

export interface ParsedPrompt {
  entities: ParsedEntity[];
  rawPrompt: string;
  unit: "meters" | "feet";
  buildingType?: string;
  floors?: number;
}

export interface ParsedEntity {
  entity?: string; // New field to match the expected structure (e.g., "room", "house_layout", "staircase")
  type:
    | "room"
    | "wall"
    | "door"
    | "window"
    | "stairs"
    | "column"
    | "building"
    | "slab"
    | "roof"
    | "line"
    | "rect"
    | "circle"
    | "master_bedroom"
    | "living_room"
    | "kitchen"
    | "bathroom"
    | "conference_room"
    | "office_layout"
    | "staircase"
    | "column_grid"
    | "columns"
    | "skylight"
    | "courtyard"
    | "terrace"
    | "garden"
    | "parking"
    | "parking_garage"
    | "driveway"
    | "house"
    | "supermarket"
    | "restaurant"
    | "bedroom";
  dimensions: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
    count?: number;
    thickness?: number;
    stepCount?: number;
    spacing?: number;
  };
  placement?: {
    wall?: "north" | "south" | "east" | "west";
    position?: "center" | "left" | "right";
    spacing?: "even";
    location?: string;
    adjacency?: string;
  };
  features?: string[];
  connects?: string[];
  layout?: string;
  label?: string;
  floors?: number;
  staircase?: boolean;
  capacity?: number;
  slots?: number;
}

export interface DrawCommand {
  action:
    | "create_wall"
    | "create_rect"
    | "create_line"
    | "create_circle"
    | "create_slab"
    | "create_stairs"
    | "create_roof"
    | "create_column"
    | "insert_door"
    | "insert_window"
    | "create_room";
  params: Record<string, any>;
}

interface AIStore {
  isOpen: boolean;
  currentPrompt: string;
  promptHistory: { prompt: string; timestamp: number }[];
  previewObjects: ThreeObject[];
  isProcessing: boolean;
  lastParsedResult: ParsedPrompt | null;
  lastDrawCommands: DrawCommand[] | null;
  conversationContext: string[];

  // Actions
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setPrompt: (prompt: string) => void;
  setProcessing: (processing: boolean) => void;
  setParsedResult: (result: ParsedPrompt | null) => void;
  setDrawCommands: (commands: DrawCommand[] | null) => void;
  setPreviewObjects: (objects: ThreeObject[]) => void;
  addToHistory: (prompt: string) => void;
  addToConversation: (message: string) => void;
  clearPreview: () => void;
  clearAll: () => void;
}

export const useAIStore = create<AIStore>((set, get) => ({
  isOpen: false,
  currentPrompt: "",
  promptHistory: [],
  previewObjects: [],
  isProcessing: false,
  lastParsedResult: null,
  lastDrawCommands: null,
  conversationContext: [],

  setOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setPrompt: (currentPrompt) => set({ currentPrompt }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setParsedResult: (lastParsedResult) => set({ lastParsedResult }),
  setDrawCommands: (lastDrawCommands) => set({ lastDrawCommands }),
  setPreviewObjects: (previewObjects) => set({ previewObjects }),

  addToHistory: (prompt) =>
    set((s) => ({
      promptHistory: [
        { prompt, timestamp: Date.now() },
        ...s.promptHistory,
      ].slice(0, 50),
    })),

  addToConversation: (message) =>
    set((s) => ({
      conversationContext: [...s.conversationContext, message].slice(-10),
    })),

  clearPreview: () => set({ previewObjects: [] }),

  clearAll: () =>
    set({
      currentPrompt: "",
      previewObjects: [],
      lastParsedResult: null,
      lastDrawCommands: null,
      isProcessing: false,
    }),
}));
