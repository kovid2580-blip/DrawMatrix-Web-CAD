"use client";

import React, { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2, Video, X } from "lucide-react";
import dynamic from "next/dynamic";

import { useCall } from "@/providers/CallContext";

// Dynamically import StreamVideoCall to avoid SSR
const StreamVideoCall = dynamic(
  () => import("@/components/video-call/StreamVideoCall"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center gap-3 text-white bg-slate-950">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading video engine…</span>
      </div>
    ),
  }
);

export const FloatingVideoCall = () => {
  const { inCall, channelName, isMinimized, leaveCall, toggleMinimize } =
    useCall();
  const constraintsRef = useRef(null);

  return (
    <>
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-50"
      />
      <AnimatePresence>
        {inCall && (
          <motion.div
            drag
            dragConstraints={constraintsRef}
            dragMomentum={false}
            dragElastic={0}
            key="floating-call"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              width: isMinimized ? 320 : "82vw",
              height: isMinimized ? 220 : "85vh",
              borderRadius: isMinimized ? 20 : 12,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className={`fixed z-[100] bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col ${
              isMinimized ? "bottom-4 right-4" : "top-8 left-[9vw]"
            }`}
            style={{ willChange: "transform, opacity" }}
          >
            {/* Header */}
            <div className="h-10 bg-slate-800 flex items-center justify-between px-4 cursor-move select-none shrink-0 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <Video size={12} className="text-slate-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[160px]">
                  {channelName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMinimize}
                  title={isMinimized ? "Expand" : "Minimise"}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 size={14} />
                  ) : (
                    <Minimize2 size={14} />
                  )}
                </button>
                <button
                  onClick={leaveCall}
                  title="End call"
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Stream Video */}
            <div className="flex-1 relative overflow-hidden">
              <StreamVideoCall roomName={channelName} onEndCall={leaveCall} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
