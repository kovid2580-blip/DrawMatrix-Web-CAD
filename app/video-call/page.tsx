"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Copy, Loader2, Users, Video } from "lucide-react";
import dynamic from "next/dynamic";

import { getCurrentUserProfile } from "@/lib/auth";
import { useCall } from "@/providers/CallContext";

const ZegoMeetingRoom = dynamic(
  () => import("@/components/video-call/ZegoMeetingRoom"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[75vh] items-center justify-center rounded-[2rem] bg-slate-950 text-slate-300">
        <Loader2 size={24} className="mr-3 animate-spin" />
        Loading meeting room...
      </div>
    ),
  }
);

const VideoCallPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { joinCall, leaveCall, inCall, channelName, isInitiator, error } =
    useCall();
  const profile = useMemo(() => getCurrentUserProfile(), []);

  const roomIdFromLink = searchParams.get("roomID") || "";
  const [meetingId, setMeetingId] = useState(roomIdFromLink);
  const [newMeetingId, setNewMeetingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (roomIdFromLink) {
      setMeetingId(roomIdFromLink);
    }
  }, [roomIdFromLink]);

  useEffect(() => {
    if (roomIdFromLink && (!inCall || channelName !== roomIdFromLink)) {
      joinCall(roomIdFromLink, { initiator: false });
    }
  }, [channelName, inCall, joinCall, roomIdFromLink]);

  const handleCreateMeeting = async () => {
    setCreating(true);
    const id = `drawmatrix-${Math.floor(100000000 + Math.random() * 900000000)}`;

    try {
      setNewMeetingId(id);
      joinCall(id, { initiator: true });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = meetingId.trim();
    if (!trimmed) return;

    joinCall(trimmed, { initiator: false });
  };

  const handleCopy = () => {
    if (!newMeetingId) return;
    navigator.clipboard.writeText(newMeetingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inCall && channelName) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-6 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between pb-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Dashboard
            </span>
          </button>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
              ZEGOCLOUD Room
            </div>
            <div className="font-mono text-sm text-slate-200">
              {channelName}
            </div>
          </div>
        </div>
        <div className="mx-auto mb-4 flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
          <div>
            {isInitiator
              ? "Host controls are enabled. Use the participant list to remove people, or end the whole call below."
              : "You joined as a participant."}
          </div>
          <button
            onClick={leaveCall}
            className="rounded-lg border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-200 transition hover:bg-rose-500/25"
          >
            {isInitiator ? "End For All" : "Leave Call"}
          </button>
        </div>
        <ZegoMeetingRoom
          roomId={channelName}
          displayName={profile.displayName || "Guest"}
          isInitiator={isInitiator}
          onLeaveRoom={leaveCall}
          onStatusChange={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-slate-900 p-4">
      <button
        onClick={() => router.push("/dashboard")}
        className="group absolute left-8 top-8 z-50 flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
      >
        <div className="rounded-lg bg-slate-800 p-2 transition-colors group-hover:bg-slate-700">
          <ArrowLeft size={18} />
        </div>
        <span className="text-sm font-bold uppercase tracking-wide opacity-70 group-hover:opacity-100">
          Return to Dashboard
        </span>
      </button>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <div className="hidden flex-col justify-center text-white md:flex">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-lg shadow-cyan-500/20">
            <Video size={32} />
          </div>
          <h1 className="mb-4 text-5xl font-bold leading-tight">
            Premium
            <br />
            Video Meetings
          </h1>
          <p className="max-w-sm text-lg text-slate-400">
            HD video, screen share, and live room links powered by ZEGOCLOUD.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            Group rooms, invite links, and browser-based joining
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-8 flex self-start items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mb-8">
            <button
              onClick={handleCreateMeeting}
              disabled={creating}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-4 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-orange-600 hover:to-pink-600 disabled:opacity-60"
            >
              {creating ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <Video size={22} />
              )}
              <span className="text-lg">
                {creating ? "Creating room..." : "New Meeting"}
              </span>
            </button>
            <p className="mt-3 text-center text-sm text-slate-500">
              Start an instant HD meeting room.
            </p>
          </div>

          {newMeetingId && (
            <div className="mb-8 rounded-2xl border border-slate-600 bg-slate-900/60 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Meeting ID
              </p>
              <div className="flex items-center gap-3">
                <span className="flex-1 break-all font-mono text-sm font-bold text-white">
                  {newMeetingId}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                >
                  {copied ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Share this ID or invite link so others can join the room.
              </p>
            </div>
          )}

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700" />
            <span className="mx-4 flex-shrink text-sm text-slate-500">
              Or join existing
            </span>
            <div className="flex-grow border-t border-slate-700" />
          </div>

          <form onSubmit={handleJoinMeeting} className="mt-6 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Paste meeting ID here"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-900 p-4 pl-12 text-white outline-none transition-all focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-500"
              />
              <Users
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={20}
              />
            </div>
            <button
              type="submit"
              disabled={!meetingId.trim()}
              className="w-full rounded-xl bg-slate-700 py-4 font-bold text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
