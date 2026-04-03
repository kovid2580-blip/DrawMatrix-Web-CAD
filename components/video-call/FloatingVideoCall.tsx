"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, ShieldAlert, Users, Video, X } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { useCall } from "@/providers/CallContext";
import { getCurrentUserProfile } from "@/lib/auth";

const ZegoMeetingRoom = dynamic(
  () => import("@/components/video-call/ZegoMeetingRoom"),
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
  const pathname = usePathname();
  const {
    inCall,
    channelName,
    isMinimized,
    isInitiator,
    leaveCall,
    toggleMinimize,
  } = useCall();
  const constraintsRef = useRef(null);
  const profile = getCurrentUserProfile();
  const [status, setStatus] = useState("Preparing meeting...");

  if (pathname === "/video-call") {
    return null;
  }

  return (
    <>
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-50"
      />
      <AnimatePresence>
        {inCall && (
          <motion.div
            drag={!isMinimized}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            dragElastic={0}
            key="floating-call"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              width: isMinimized ? 96 : "82vw",
              height: isMinimized ? 96 : "85vh",
              borderRadius: isMinimized ? 999 : 12,
              x: 0,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className={`fixed z-[100] overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl ${
              isMinimized
                ? "bottom-5 right-5"
                : "left-[9vw] top-8 flex flex-col"
            }`}
            style={{ willChange: "transform, opacity" }}
          >
            {isMinimized ? (
              <button
                onClick={toggleMinimize}
                className="relative flex h-full w-full flex-col items-center justify-center bg-slate-900/95 text-white backdrop-blur-xl"
                title="Restore call"
              >
                <span className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                <Video size={22} className="mb-1 text-cyan-300" />
                <span className="max-w-[56px] truncate text-[10px] font-black uppercase tracking-wider">
                  Live
                </span>
              </button>
            ) : (
              <>
                <div className="flex h-12 shrink-0 select-none items-center justify-between border-b border-slate-700 bg-slate-800 px-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <Video size={14} className="text-slate-400" />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold uppercase tracking-wider text-white">
                        {channelName}
                      </div>
                      <div className="truncate text-[10px] text-slate-400">
                        {status}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isInitiator && (
                      <>
                        <div className="hidden items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 lg:flex">
                          <Users size={12} />
                          Remove users in participant list
                        </div>
                        <button
                          onClick={leaveCall}
                          title="End whole call"
                          className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/15 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-200 transition hover:bg-rose-500/25"
                        >
                          <ShieldAlert size={12} />
                          End For All
                        </button>
                      </>
                    )}
                    {!isInitiator && (
                      <button
                        onClick={leaveCall}
                        title="Leave call"
                        className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/15 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-200 transition hover:bg-rose-500/25"
                      >
                        <X size={12} />
                        Leave
                      </button>
                    )}
                    <button
                      onClick={toggleMinimize}
                      title="Minimize to bubble"
                      className="text-slate-400 transition-colors hover:text-white"
                    >
                      <Minimize2 size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}

            <div
              className={
                isMinimized
                  ? "pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
                  : "relative flex-1 overflow-hidden"
              }
            >
              <ZegoMeetingRoom
                roomId={channelName}
                displayName={profile.displayName || "Guest"}
                isInitiator={isInitiator}
                onLeaveRoom={leaveCall}
                onStatusChange={setStatus}
                className={
                  isMinimized ? "h-px w-px" : "h-full w-full bg-slate-950"
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
