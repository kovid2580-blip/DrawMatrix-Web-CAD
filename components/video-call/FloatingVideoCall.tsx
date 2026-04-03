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
          <>
            {isMinimized ? (
              <>
                <div className="pointer-events-none fixed -left-[9999px] top-0 z-0 h-px w-px overflow-hidden opacity-0">
                  <ZegoMeetingRoom
                    roomId={channelName}
                    displayName={profile.displayName || "Guest"}
                    isInitiator={isInitiator}
                    onLeaveRoom={leaveCall}
                    onStatusChange={setStatus}
                    className="h-px w-px"
                  />
                </div>
                <motion.button
                  key="floating-call-bubble"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ type: "spring", stiffness: 280, damping: 30 }}
                  onClick={toggleMinimize}
                  className="fixed bottom-5 right-5 z-[100] flex h-20 w-20 flex-col items-center justify-center rounded-full border border-cyan-400/30 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl"
                >
                  <span className="absolute left-3 top-3 h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                  <Video size={20} className="mb-1 text-cyan-300" />
                  <span className="max-w-[52px] truncate text-[10px] font-black uppercase tracking-wider">
                    Live
                  </span>
                </motion.button>
                <button
                  onClick={leaveCall}
                  title={isInitiator ? "End whole call" : "Leave call"}
                  className="fixed bottom-6 right-28 z-[101] rounded-full border border-rose-500/30 bg-rose-500/15 p-3 text-rose-300 shadow-xl transition hover:bg-rose-500/25 hover:text-rose-100"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
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
                  width: "82vw",
                  height: "85vh",
                  borderRadius: 12,
                  y: 0,
                }}
                exit={{ opacity: 0, scale: 0.85, y: 20 }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
                className="fixed left-[9vw] top-8 z-[100] flex flex-col overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl"
                style={{ willChange: "transform, opacity" }}
              >
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

                <div className="relative flex-1 overflow-hidden">
                  <ZegoMeetingRoom
                    roomId={channelName}
                    displayName={profile.displayName || "Guest"}
                    isInitiator={isInitiator}
                    onLeaveRoom={leaveCall}
                    onStatusChange={setStatus}
                    className="h-full w-full bg-slate-950"
                  />
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
};
