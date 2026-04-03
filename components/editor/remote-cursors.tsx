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
        const label = user.name === "Guest User" ? "Guest" : user.name;

        return (
          <group key={user.id} position={user.cursor}>
            <Html
              center
              distanceFactor={1}
              style={{ pointerEvents: "none" }}
              transform
              sprite
            >
              <div
                className="flex flex-col items-center"
                style={{ transform: "scale(0.18)" }}
              >
                <div
                  className="max-w-[88px] truncate rounded-full px-2 py-1 text-[10px] font-bold text-white shadow-lg whitespace-nowrap"
                  style={{ backgroundColor: user.color }}
                >
                  {label}
                </div>
                <div style={{ color: user.color }}>
                  <MousePointer2 size={16} fill="currentColor" />
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
};
