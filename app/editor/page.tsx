"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Triangle } from "lucide-react";

import Ribbon from "@/components/editor/ribbon";
import { CommandBar, StatusBar } from "@/components/editor/bottom-bar";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { AIPromptPanel } from "@/components/editor/ai-prompt-panel";
import { LayerManager } from "@/components/editor/layer-manager";
import { useThreeStore } from "@/store";
import { useAIStore } from "@/store/ai-store";

const ThreeLayer = dynamic(() => import("@/components/editor/three-layer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-[#1a1c1e] flex items-center justify-center text-gray-500 font-mono text-xs uppercase tracking-widest">
      Initializing CAD Modeling Engine...
    </div>
  ),
});

export default function EditorPage() {
  const [tool, setTool] = useState("line");
  const searchParams = useSearchParams();
  const {
    setProjectInfo,
    projectName,
    setObjects,
    setLayers,
    setActiveLayer,
    setSelectedObjectId,
    undo,
    redo,
  } = useThreeStore();
  const { toggleOpen: toggleAI, setOpen: setAIOpen } = useAIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTool("select");
        setSelectedObjectId(null);
        setAIOpen(false);
      }

      // Undo/Redo Shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === "y") {
          e.preventDefault();
          redo();
        } else if (e.key === "/") {
          e.preventDefault();
          toggleAI();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedObjectId, undo, redo, toggleAI, setAIOpen]);

  useEffect(() => {
    const isNew = searchParams.get("new") === "true";
    const pid = searchParams.get("projectId");

    if (isNew) {
      const name =
        window.prompt("Enter a name for your new sheet:", "Untitled Sheet") ||
        "Untitled Sheet";
      const newId = Math.random().toString(36).substring(2, 9);
      setProjectInfo(newId, name);
    } else if (pid) {
      const projects = JSON.parse(localStorage.getItem("dm_projects") || "[]");
      const project = projects.find((p: any) => p.id === pid);
      if (project) {
        setProjectInfo(project.id, project.name);
        if (project.content) {
          const data = JSON.parse(project.content);
          if (data.objects) setObjects(data.objects);
          if (data.layers) setLayers(data.layers);
          if (data.activeLayerId) setActiveLayer(data.activeLayerId);
        }
      }
    }
  }, [searchParams, setProjectInfo, setObjects, setLayers, setActiveLayer]);

  return (
    <div className="flex flex-col h-screen bg-[#2b2d30] text-gray-200 overflow-hidden font-sans">
      {/* Top Bar / Title */}
      <div className="h-8 bg-[#1f2023] flex items-center px-4 border-b border-black text-xs select-none">
        <div className="bg-white rounded-full w-5 h-5 flex items-center justify-center mr-4">
          <Triangle fill="black" className="text-black w-3 h-3 rotate-90" />
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <span className="text-white">Matrix::Draft Pro</span>
          <span className="opacity-50">
            {projectName || "Untitled_Sheet"}.dmx
          </span>
        </div>
      </div>

      {/* Ribbon Interface */}
      <Ribbon activeTool={tool} setTool={setTool} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Layer Manager (Docked) */}
        <div className="w-48 hidden xl:flex flex-col border-r border-black">
          <LayerManager />
        </div>

        {/* Unified CAD Viewport */}
        <ThreeLayer activeTool={tool} setTool={setTool} />

        {/* Right Properties Panel (Docked) */}
        <div className="hidden lg:flex">
          <PropertiesPanel />
        </div>
      </div>

      {/* Bottom Bar Area */}
      <StatusBar />

      {/* AI Prompt Panel (Floating) */}
      <AIPromptPanel />
    </div>
  );
}
