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
              width: isMinimized ? 320 : "82vw",
              height: isMinimized ? 188 : "85vh",
              borderRadius: isMinimized ? 18 : 12,
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
              <div className="flex h-full w-full flex-col overflow-hidden bg-slate-950/95 text-white backdrop-blur-xl">
                <div className="flex h-11 items-center justify-between border-b border-white/10 bg-slate-900/95 px-3">
                  <button
                    onClick={toggleMinimize}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    title="Restore call"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-black uppercase tracking-[0.22em]">
                        Live meeting
                      </div>
                      <div className="truncate text-[10px] text-slate-400">
                        {channelName}
                      </div>
                    </div>
                  </button>
                  <div className="ml-3 flex items-center gap-2">
                    <button
                      onClick={toggleMinimize}
                      title="Restore call"
                      className="rounded-md border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <Video size={14} />
                    </button>
                    <button
                      onClick={leaveCall}
                      title={isInitiator ? "End whole call" : "Leave call"}
                      className="rounded-md border border-rose-500/30 bg-rose-500/15 p-2 text-rose-300 transition hover:bg-rose-500/25 hover:text-rose-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={toggleMinimize}
                  className="relative flex flex-1 flex-col items-start justify-between overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] px-4 py-3 text-left"
                  title="Restore call"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.05),transparent_45%,rgba(168,85,247,0.06))]" />
                  <div className="relative flex w-full items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">
                        Call continues in background
                      </div>
                      <div className="mt-1 truncate text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        {status || "Connected"}
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                      Live
                    </div>
                  </div>
                  <div className="relative mt-3 flex w-full flex-1 items-end">
                    <div className="grid w-full grid-cols-[1.2fr_0.8fr] gap-2">
                      <div className="relative h-20 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(15,23,42,0.08),rgba(34,197,94,0.1))]" />
                        <div className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                          {profile.displayName || "Guest"}
                        </div>
                      </div>
                      <div className="relative h-20 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.15),transparent_60%)]" />
                        <div className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-slate-200">
                          Restore
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
                <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/95 px-4 py-2">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    Click panel to restore
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    Same room kept alive
                  </div>
                </div>
              </div>
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
                      title="Minimize call window"
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
