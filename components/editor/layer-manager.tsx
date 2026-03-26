"use client";

import React from "react";
import { Eye, EyeOff, Lock, Plus, Trash2, Unlock } from "lucide-react";

import { Layer, useThreeStore } from "@/store";

export const LayerManager = () => {
  const { layers, activeLayerId, setActiveLayer, updateLayer, addLayer } =
    useThreeStore();

  const handleToggleVisibility = (id: string, visible: boolean) => {
    updateLayer(id, { visible: !visible });
  };

  const handleToggleLock = (id: string, locked: boolean) => {
    updateLayer(id, { locked: !locked });
  };

  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: `layer-${Math.random().toString(36).substr(2, 5)}`,
      name: `New Layer ${layers.length}`,
      visible: true,
      locked: false,
      color: "#ffffff",
      order: layers.length,
    };
    addLayer(newLayer);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1f22] text-xs">
      <div className="p-3 border-b border-black flex items-center justify-between bg-black/20">
        <span className="font-bold uppercase tracking-widest text-emerald-500">
          Layers
        </span>
        <button
          onClick={handleAddLayer}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center px-3 py-2 space-x-2 hover:bg-white/5 cursor-default group ${activeLayerId === layer.id ? "bg-blue-500/20" : ""}`}
            onClick={() => setActiveLayer(layer.id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleVisibility(layer.id, layer.visible);
              }}
              className={`${layer.visible ? "text-cyan-400" : "text-gray-600"} hover:text-white transition-colors`}
            >
              {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLock(layer.id, layer.locked);
              }}
              className={`${layer.locked ? "text-amber-500" : "text-gray-600"} hover:text-white transition-colors`}
            >
              {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>

            <div
              className="w-3 h-3 rounded-full border border-white/10"
              style={{ backgroundColor: layer.color }}
            />

            <span
              className={`flex-1 truncate ${activeLayerId === layer.id ? "text-white font-bold" : "text-gray-400"}`}
            >
              {layer.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
