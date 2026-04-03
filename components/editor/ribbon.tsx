"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlignLeft,
  Box as Box3DIcon,
  Circle as CircleIcon,
  Clock,
  Construction,
  Copy,
  Cylinder as CylinderIcon,
  DoorOpen,
  Download,
  ExternalLink,
  Eye,
  FlipHorizontal,
  Grid as GridIcon,
  Hash,
  Layers,
  Layout,
  LogOut,
  Maximize2,
  Minus,
  Move,
  Package,
  Plus,
  Redo,
  RefreshCw,
  RotateCw,
  Ruler,
  Save,
  Scaling,
  Scissors,
  Search,
  Settings,
  Shield,
  Sparkles,
  Square,
  Sun,
  Table as TableIcon,
  Tent,
  Triangle,
  Type,
  Undo,
  UnfoldHorizontal,
  Video,
  Waves,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  ThreeObject,
  ThreeObjectType,
  UserPresence,
  useThreeStore,
} from "@/store";
import { useAIStore } from "@/store/ai-store";
import { socket } from "@/lib/socket";
import { useCall } from "@/providers/CallContext";
import { saveLocalProject } from "@/lib/project-storage";

const generateUUID = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  large?: boolean;
}

type ObjectProperties = ThreeObject["properties"];
type SetTool = React.Dispatch<React.SetStateAction<string>>;

const ToolButton = ({
  icon,
  label,
  active,
  onClick,
  large,
}: ToolButtonProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center group relative p-1 rounded hover:bg-gray-700 transition-colors ${active ? "bg-blue-900/50 text-blue-400" : "text-gray-300"}`}
    title={label}
  >
    <div
      className={`flex items-center justify-center ${large ? "w-8 h-8 mb-1" : "w-5 h-5 mb-0.5"}`}
    >
      {icon}
    </div>
    <span
      className={`${large ? "text-[10px]" : "text-[9px]"} font-medium leading-tight text-center max-w-[60px] truncate`}
    >
      {label}
    </span>
  </button>
);

const RibbonGroup = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col border-r border-gray-700 px-2 last:border-r-0">
    <div className="flex-1 flex items-center space-x-1 min-h-[70px]">
      {children}
    </div>
    <div className="text-[9px] text-gray-500 text-center py-0.5 select-none uppercase tracking-tighter font-medium">
      {title}
    </div>
  </div>
);

const Ribbon = ({
  activeTool,
  setTool,
}: {
  activeTool: string;
  setTool: SetTool;
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Home");
  const {
    viewMode,
    addObject,
    activeLayerId,
    layers,
    setViewMode,
    cinematicMode,
    setCinematicMode,
    getSnapshot,
    projectName,
    projectId,
    undo,
    redo,
    presences,
  } = useThreeStore();
  const { data: session } = useSession();
  const { inCall, joinCall, leaveCall } = useCall();
  const { toggleOpen: toggleAI, isOpen: isAIOpen } = useAIStore();

  const [autoSaveInterval, setAutoSaveInterval] = useState<number | null>(null);

  const handleSave = useCallback(async () => {
    if (!projectId) return;

    const snapshot = getSnapshot();
    const timestamp = new Date().toISOString();
    const ownerEmail = session?.user?.email || "guest";

    saveLocalProject({
      id: projectId,
      name: projectName || "Untitled Project",
      content: snapshot,
      lastModified: timestamp,
    });

    const projectData = {
      projectId,
      name: projectName || "Untitled Project",
      ownerEmail,
      objects: snapshot,
      layers,
      config: {
        unitSystem: "metric",
        gridSpacing: 1,
      },
    };

    try {
      const res = await fetch(`/api/projects/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      if (res.ok) {
        console.log("[Cloud] Project saved successfully to MongoDB");
      }
    } catch (err) {
      console.error("[Cloud] Failed to save project:", err);
    }
  }, [getSnapshot, layers, projectId, projectName, session?.user?.email]);

  useEffect(() => {
    if (!autoSaveInterval) return;

    const intervalId = setInterval(() => {
      void handleSave();
      console.log("Auto-saved at", new Date().toLocaleTimeString());
    }, autoSaveInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoSaveInterval, handleSave]);

  const handleSetAutoSave = () => {
    const seconds = window.prompt(
      "Enter auto-save interval in seconds (e.g. 30):",
      "60"
    );
    if (seconds) {
      const val = parseInt(seconds);
      if (!isNaN(val) && val > 0) {
        setAutoSaveInterval(val);
      }
    } else {
      setAutoSaveInterval(null);
    }
  };

  const handleLogout = () => {
    router.push("/dashboard");
  };

  const handleCreateObject = (
    type: ThreeObjectType,
    props: ObjectProperties = {}
  ) => {
    const userId =
      typeof window !== "undefined"
        ? window.localStorage.getItem("cad_user_id")
        : "guest";

    // Drafting tools require viewport interaction
    const draftingTools: ThreeObjectType[] = [
      "line",
      "circle",
      "arc",
      "rect",
      "ellipse",
      "spline",
      "wall",
      "slab",
      "stairs",
      "roof",
      "door",
      "window",
      "text",
      "dimension",
    ];

    if (draftingTools.includes(type)) {
      setTool(type);
      return;
    }

    // Default properties for complex types
    const resolvedProps: ObjectProperties = { ...props };

    if (type === "text" && typeof resolvedProps.text !== "string") {
      resolvedProps.text = "New Text Label";
    }
    if (
      type === "dimension" &&
      !Array.isArray((resolvedProps as { start?: unknown }).start)
    ) {
      resolvedProps.start = [0, 0, 0];
      resolvedProps.end = [5, 0, 0];
      resolvedProps.offset = 1;
    }

    const newObj: ThreeObject = {
      id: generateUUID(),
      type,
      layerId: activeLayerId,
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1],
      },
      properties: resolvedProps,
      color: "#ffffff",
      lastModifiedBy: userId || "unknown",
    };

    addObject(newObj);
    socket.emit("create_object", {
      type: "create_object",
      objectId: newObj.id,
      userId: userId,
      timestamp: Date.now(),
      payload: newObj,
    });
    setTool(type);
  };

  return (
    <div className="h-24 bg-[#2b2d30] border-b border-black flex flex-col select-none">
      <div className="flex bg-[#1f2023] px-2 h-7 items-center space-x-1">
        {["Home", "Architecture", "Annotate", "Insert", "View", "Manage"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 h-full text-[11px] font-medium transition-colors ${activeTab === tab ? "bg-[#2b2d30] text-white" : "text-gray-400 hover:text-gray-200"}`}
            >
              {tab}
            </button>
          )
        )}
        <div className="flex-1" />
        <div className="flex items-center space-x-2 mr-4">
          <button
            onClick={handleSave}
            title="Manual Save"
            className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-200 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-all border border-white/5"
          >
            <Save size={12} /> Save
          </button>

          <button
            onClick={handleSetAutoSave}
            title="Configure Auto-Save"
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all border ${autoSaveInterval ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "text-blue-200 hover:text-white bg-white/5 hover:bg-white/10 border-white/5"}`}
          >
            <RefreshCw
              size={12}
              className={autoSaveInterval ? "animate-spin-slow" : ""}
            />
            {autoSaveInterval ? `Every ${autoSaveInterval}s` : "Auto Save"}
          </button>

          <button
            onClick={handleLogout}
            title="Back to Dashboard"
            className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-all border border-rose-500/20"
          >
            <LogOut size={12} /> Logout
          </button>
        </div>

        {/* Participants Presence List */}
        <div className="flex items-center -space-x-2 mr-4 group px-2 border-l border-white/10 ml-2">
          {Object.values(presences).map((user: UserPresence) => (
            <div
              key={user.id}
              title={user.name}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white bg-gray-800 transition-transform hover:scale-110 hover:z-10 cursor-help"
              style={{ borderColor: user.color }}
            >
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
          ))}
          {Object.keys(presences).length === 0 && (
            <div className="text-[9px] text-gray-500 italic">
              No one else here
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 bg-black/30 p-0.5 rounded mr-2">
          <button
            onClick={() => setViewMode("2D")}
            className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded ${viewMode === "2D" ? "bg-blue-600 text-white" : "text-gray-500"}`}
          >
            2D
          </button>
          <button
            onClick={() => setViewMode("3D")}
            className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded ${viewMode === "3D" ? "bg-blue-600 text-white" : "text-gray-500"}`}
          >
            3D
          </button>
        </div>

        <button
          onClick={toggleAI}
          title="AI Drawing Assistant (Ctrl+/)"
          className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all border shadow-lg ${
            isAIOpen
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500/50 shadow-cyan-500/20"
              : "text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20"
          }`}
        >
          <Sparkles size={12} /> AI Assistant
        </button>
      </div>

      <div className="flex-1 flex px-2 overflow-x-auto custom-scrollbar overflow-y-hidden">
        {activeTab === "Home" && (
          <>
            <RibbonGroup title="Draft">
              <div className="flex items-center space-x-1">
                <ToolButton
                  icon={<Minus size={18} />}
                  label="Line"
                  active={activeTool === "line"}
                  onClick={() =>
                    handleCreateObject("line", {
                      start: [0, 0, 0],
                      end: [2, 2, 0],
                    })
                  }
                />
                <ToolButton
                  icon={<CircleIcon size={18} />}
                  label="Circle"
                  active={activeTool === "circle"}
                  onClick={() => handleCreateObject("circle", { radius: 1 })}
                />
                <ToolButton
                  icon={<Square size={18} />}
                  label="Rect"
                  active={activeTool === "rect"}
                  onClick={() =>
                    handleCreateObject("rect", { width: 4, height: 2 })
                  }
                />
                <ToolButton
                  icon={<Triangle size={18} />}
                  label="Arc"
                  onClick={() => handleCreateObject("arc")}
                />
                <ToolButton
                  icon={<Waves size={18} />}
                  label="Spline"
                  onClick={() => handleCreateObject("spline")}
                />
                <ToolButton
                  icon={<Hash size={18} />}
                  label="Hatch"
                  onClick={() => handleCreateObject("hatch")}
                />
              </div>
            </RibbonGroup>

            <RibbonGroup title="Modeling">
              <div className="flex items-center space-x-1">
                <ToolButton
                  icon={<Box3DIcon size={18} />}
                  label="Box"
                  active={activeTool === "box"}
                  onClick={() => handleCreateObject("box")}
                />
                <ToolButton
                  icon={<CylinderIcon size={18} />}
                  label="Cylinder"
                  active={activeTool === "cylinder"}
                  onClick={() => handleCreateObject("cylinder")}
                />
                <ToolButton
                  icon={<RotateCw size={18} />}
                  label="Revolve"
                  onClick={() => handleCreateObject("box")}
                />
                <ToolButton
                  icon={<Maximize2 size={18} />}
                  label="Extrude"
                  onClick={() => handleCreateObject("box")}
                />
              </div>
            </RibbonGroup>

            <RibbonGroup title="Modify">
              <div className="flex items-center space-x-1">
                <ToolButton
                  icon={<Undo size={16} />}
                  label="Undo"
                  onClick={undo}
                />
                <ToolButton
                  icon={<Redo size={16} />}
                  label="Redo"
                  onClick={redo}
                />
                <div className="w-[1px] h-8 bg-gray-700 mx-1" />
                <ToolButton icon={<Move size={16} />} label="Move" />
                <ToolButton icon={<Copy size={16} />} label="Copy" />
                <ToolButton icon={<RotateCw size={16} />} label="Rotate" />
                <ToolButton
                  icon={<FlipHorizontal size={16} />}
                  label="Mirror"
                />
                <ToolButton icon={<Scaling size={16} />} label="Scale" />
                <ToolButton icon={<Scissors size={16} />} label="Trim" />
                <ToolButton icon={<AlignLeft size={16} />} label="Extend" />
                <ToolButton
                  icon={<UnfoldHorizontal size={16} />}
                  label="Stretch"
                />
              </div>
            </RibbonGroup>
          </>
        )}

        {activeTab === "Architecture" && (
          <>
            <RibbonGroup title="Structural">
              <div className="flex items-center space-x-1">
                <ToolButton
                  icon={<Layout size={18} />}
                  label="Wall"
                  active={activeTool === "wall"}
                  onClick={() =>
                    handleCreateObject("wall", { height: 2.5, thickness: 0.2 })
                  }
                />
                <ToolButton
                  icon={<Square size={18} />}
                  label="Slab"
                  onClick={() => handleCreateObject("slab", { thickness: 0.2 })}
                />
                <ToolButton
                  icon={<Construction size={18} />}
                  label="Stairs"
                  onClick={() => handleCreateObject("stairs")}
                />
                <ToolButton
                  icon={<Tent size={18} />}
                  label="Roof"
                  onClick={() => handleCreateObject("roof")}
                />
              </div>
            </RibbonGroup>
            <RibbonGroup title="Openings">
              <div className="flex items-center space-x-1">
                <ToolButton
                  icon={<DoorOpen size={18} />}
                  label="Door"
                  onClick={() => handleCreateObject("door")}
                />
                <ToolButton
                  icon={<Maximize2 size={18} />}
                  label="Window"
                  onClick={() => handleCreateObject("window")}
                />
              </div>
            </RibbonGroup>
            <RibbonGroup title="Views">
              <div className="flex items-center space-x-1">
                <ToolButton icon={<Scissors size={18} />} label="Section" />
                <ToolButton icon={<GridIcon size={18} />} label="Elevation" />
              </div>
            </RibbonGroup>
          </>
        )}

        {activeTab === "Annotate" && (
          <>
            <RibbonGroup title="Text">
              <div className="flex items-center space-x-1">
                <ToolButton
                  icon={<Type size={18} />}
                  label="Text"
                  onClick={() => handleCreateObject("text")}
                />
                <ToolButton icon={<AlignLeft size={18} />} label="MText" />
              </div>
            </RibbonGroup>
            <RibbonGroup title="Dimensions">
              <div className="flex items-center space-x-1">
                <ToolButton
                  icon={<Ruler size={18} />}
                  label="Linear"
                  onClick={() => handleCreateObject("dimension")}
                />
                <ToolButton icon={<CircleIcon size={18} />} label="Radius" />
              </div>
            </RibbonGroup>
            <RibbonGroup title="Data">
              <div className="flex items-center space-x-1">
                <ToolButton icon={<TableIcon size={18} />} label="Table" />
              </div>
            </RibbonGroup>
          </>
        )}

        {activeTab === "Insert" && (
          <>
            <RibbonGroup title="Blocks">
              <div className="flex items-center space-x-1">
                <ToolButton icon={<Package size={18} />} label="Create" />
                <ToolButton icon={<Plus size={18} />} label="Insert" />
                <ToolButton icon={<Zap size={18} />} label="Explode" />
              </div>
            </RibbonGroup>
            <RibbonGroup title="Import/Export">
              <div className="flex items-center space-x-1">
                <ToolButton icon={<Download size={18} />} label="JSON" />
                <ToolButton icon={<ExternalLink size={18} />} label="GLTF" />
              </div>
            </RibbonGroup>
          </>
        )}

        {activeTab === "View" && (
          <>
            <RibbonGroup title="Navigate">
              <div className="flex items-center space-x-1">
                <ToolButton icon={<RotateCw size={18} />} label="Orbit" />
                <ToolButton icon={<Move size={18} />} label="Pan" />
                <ToolButton icon={<Search size={18} />} label="Zoom" />
                <ToolButton
                  icon={
                    <Maximize2
                      size={18}
                      className={cinematicMode ? "text-cyan-400" : ""}
                    />
                  }
                  label="Present"
                  onClick={() => setCinematicMode(!cinematicMode)}
                  active={cinematicMode}
                />
              </div>
            </RibbonGroup>
            <RibbonGroup title="Display">
              <div className="flex items-center space-x-1">
                <ToolButton
                  icon={<Eye size={18} />}
                  label="Wire"
                  onClick={() => setViewMode("2D")}
                  active={viewMode === "2D"}
                />
                <ToolButton
                  icon={<Sun size={18} />}
                  label="Shaded"
                  onClick={() => setViewMode("3D")}
                  active={viewMode === "3D"}
                />
                <ToolButton icon={<GridIcon size={18} />} label="Grid" />
              </div>
            </RibbonGroup>
          </>
        )}

        {activeTab === "Manage" && (
          <>
            <RibbonGroup title="System">
              <div className="flex items-center space-x-1">
                <ToolButton icon={<Layers size={18} />} label="Layers" />
                <ToolButton icon={<Shield size={18} />} label="Roles" />
              </div>
            </RibbonGroup>
            <RibbonGroup title="History">
              <div className="flex items-center space-x-1">
                <ToolButton icon={<Clock size={18} />} label="Snapshots" />
              </div>
            </RibbonGroup>
            <RibbonGroup title="Settings">
              <div className="flex items-center space-x-1">
                <ToolButton icon={<Settings size={18} />} label="Project" />
                <ToolButton
                  icon={
                    <Video
                      size={18}
                      className={inCall ? "text-cyan-400" : ""}
                    />
                  }
                  label={inCall ? "Leave Meet" : "Join Meet"}
                  onClick={() => {
                    if (inCall) leaveCall();
                    else if (projectId)
                      joinCall(projectId, { initiator: true });
                    else window.alert("Select a project first!");
                  }}
                  active={inCall}
                />
              </div>
            </RibbonGroup>
          </>
        )}
      </div>
    </div>
  );
};

export default Ribbon;
