"use client";

import React from "react";
import { useThreeStore } from "@/store";
import { Settings2, Trash2, Lock, Unlock } from "lucide-react";

export const PropertiesPanel = () => {
    const { objects, selectedObjectId, updateObject, deleteObject } = useThreeStore();
    const selectedObj = objects.find(o => o.id === selectedObjectId);

    if (!selectedObj) {
        return (
            <div className="w-64 bg-[#1e1f22] border-l border-black p-4 text-gray-400 text-xs flex flex-col items-center justify-center text-center">
                <Settings2 size={48} className="mb-4 opacity-20" />
                <p>Select an object to view and edit its properties.</p>
            </div>
        );
    }

    const handlePropChange = (key: string, value: any) => {
        updateObject(selectedObj.id, { properties: { ...selectedObj.properties, [key]: value } });
    };

    return (
        <div className="w-64 bg-[#1e1f22] border-l border-black p-4 text-gray-200 text-xs flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-2">
                <h3 className="font-bold uppercase tracking-widest text-cyan-500">Properties</h3>
                <div className="flex space-x-2">
                    <button onClick={() => deleteObject(selectedObj.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <span className="text-gray-500 uppercase text-[9px] font-bold">Type</span>
                    <div className="bg-black/30 p-2 rounded border border-white/5 font-mono text-[10px] uppercase text-white">
                        {selectedObj.type}
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-gray-500 uppercase text-[9px] font-bold">ID</span>
                    <div className="bg-black/30 p-2 rounded border border-white/5 font-mono text-[9px] truncate">
                        {selectedObj.id}
                    </div>
                </div>

                {/* Common Properties */}
                <div className="space-y-2 pt-2 border-t border-gray-800">
                    <span className="text-gray-500 uppercase text-[9px] font-bold italic">Geometry</span>
                    {Object.entries(selectedObj.properties).map(([key, value]) => {
                        if (typeof value === "object") return null;
                        return (
                            <div key={key} className="flex items-center justify-between">
                                <span className="capitalize">{key}</span>
                                <input
                                    type={typeof value === "number" ? "number" : "text"}
                                    value={value}
                                    onChange={(e) => handlePropChange(key, typeof value === "number" ? parseFloat(e.target.value) : e.target.value)}
                                    className="bg-black/50 border border-white/10 rounded px-2 py-1 w-24 text-right hover:border-cyan-500/50 focus:border-cyan-500 transition-all outline-none"
                                />
                            </div>
                        );
                    })}
                </div>

                {selectedObj.type === "text" && (
                    <div className="space-y-2 pt-2">
                        <span className="text-gray-500 uppercase text-[9px] font-bold italic">Text Content</span>
                        <textarea
                            value={selectedObj.properties.text || ""}
                            onChange={(e) => handlePropChange("text", e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded p-2 min-h-[60px] outline-none focus:border-cyan-500"
                        />
                    </div>
                )}
            </div>

            <div className="mt-auto pt-4 text-[9px] text-gray-600 border-t border-gray-800 flex justify-between">
                <span>DrawMatrix v1.0</span>
                <span>UUID Sync Active</span>
            </div>
        </div>
    );
};
