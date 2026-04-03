"use client";

import React from "react";
import { Html } from "@react-three/drei";
import { MousePointer2 } from "lucide-react";

import { UserPresence, useThreeStore } from "@/store";

export const RemoteCursors = () => {
  const presences = useThreeStore((state) => state.presences);

  return (
    <>
      {Object.values(presences).map((user: UserPresence) => {
        if (!user.cursor) return null;

        return (
          <group key={user.id} position={user.cursor}>
            <Html distanceFactor={6} style={{ pointerEvents: "none" }}>
              <div className="flex flex-col items-center">
                <div
                  className="max-w-[72px] truncate rounded-full px-1.5 py-px text-[8px] font-bold text-white shadow-lg whitespace-nowrap"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name}
                </div>
                <div style={{ color: user.color }}>
                  <MousePointer2 size={12} fill="currentColor" />
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
};
