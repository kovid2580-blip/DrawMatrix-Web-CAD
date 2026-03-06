"use client";

import { Grid, Lock, Maximize, MousePointer2, Settings } from "lucide-react";
import { useThreeStore } from "@/store";

export const CommandBar = () => {
  return (
    <div className="h-8 bg-[#2b2d30] border-t border-gray-600 flex items-center px-2 text-gray-300 text-xs font-mono">
      <span className="text-gray-500 mr-2">Command:</span>
      <input
        type="text"
        className="bg-transparent border-none outline-none flex-1 text-gray-200 placeholder-gray-600 h-full"
        placeholder="Type a command"
      />
    </div>
  );
};

export const StatusBar = () => {
  const localCursor = useThreeStore((s: any) => s.localCursor);
  const [x, y, z] = localCursor || [0, 0, 0];

  return (
    <div className="h-6 bg-[#1f2023] border-t border-gray-700 flex items-center justify-between px-2 text-[10px] text-gray-400 select-none">
      <div className="flex items-center space-x-4">
        <span className="min-w-[150px]">{x.toFixed(2)}, {y.toFixed(2)}, {z.toFixed(2)}</span>
        <div className="w-px h-3 bg-gray-600"></div>
        <div className="flex space-x-2">
          <button className="hover:text-white flex items-center space-x-1">
            <Grid size={10} /> <span>GRID</span>
          </button>
          <button className="hover:text-white flex items-center space-x-1">
            <Lock size={10} /> <span>SNAP</span>
          </button>
          <button className="hover:text-white flex items-center space-x-1">
            <MousePointer2 size={10} /> <span>ORTHO</span>
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="hover:text-white">
          <Settings size={12} />
        </button>
        <button className="hover:text-white">
          <Maximize size={12} />
        </button>
      </div>
    </div>
  );
};
