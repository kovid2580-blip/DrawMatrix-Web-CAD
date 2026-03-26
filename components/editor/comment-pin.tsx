"use client";

import React from "react";
import { Html } from "@react-three/drei";
import { MessageSquare } from "lucide-react";

export const CommentPin = ({
  position,
  text,
  color,
  onSelect,
  isSelected,
}: any) => {
  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? "#ffcc00" : color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      <Html distanceFactor={8} position={[0, 0.3, 0]} center>
        {isSelected && (
          <div className="bg-black/80 backdrop-blur-md p-2 rounded border border-white/20 shadow-2xl min-w-[120px]">
            <div className="flex items-center gap-1.5 mb-1 opacity-60">
              <MessageSquare size={10} className="text-blue-400" />
              <span className="text-[8px] uppercase tracking-wider font-bold text-white">
                Comment
              </span>
            </div>
            <p className="text-[10px] text-gray-200 leading-tight">
              {text || "No content"}
            </p>
          </div>
        )}
      </Html>
    </group>
  );
};
