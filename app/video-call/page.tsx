"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Loader2, Video, Users } from "lucide-react";
import { useCall } from "@/providers/CallContext";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";

export default function VideoCallPage() {
  const router = useRouter();
  const client = useStreamVideoClient();
  const { joinCall, inCall, error } = useCall();

  const [meetingId, setMeetingId] = useState("");
  const [newMeetingId, setNewMeetingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /* ── Create a room directly via Stream SDK ── */
  const handleCreateMeeting = async () => {
    if (!client) { setCreateError("Video client not ready — check your Stream API keys."); return; }
    setCreating(true);
    setCreateError(null);

    const id = `drawmatrix-${Math.floor(100000000 + Math.random() * 900000000)}`;
    try {
      const call = client.call("default", id);
      await call.getOrCreate();
      setNewMeetingId(id);
      joinCall(id);
    } catch (err: any) {
      setCreateError(err?.message ?? "Failed to create meeting");
    } finally {
      setCreating(false);
    }
  };

  /* ── Join an existing room ── */
  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = meetingId.trim();
    if (!trimmed || !client) return;
    try {
      const call = client.call("default", trimmed);
      await call.getOrCreate();
      joinCall(trimmed);
      router.push("/editor");
    } catch (err: any) {
      setCreateError(err?.message ?? "Could not join meeting");
    }
  };

  const handleCopy = () => {
    if (!newMeetingId) return;
    navigator.clipboard.writeText(newMeetingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-4 relative">
      <button
        onClick={() => router.push("/dashboard")}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-50 group"
      >
        <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
          <ArrowLeft size={18} />
        </div>
        <span className="font-bold text-sm tracking-wide uppercase opacity-70 group-hover:opacity-100">Return to Dashboard</span>
      </button>
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Branding */}
        <div className="hidden md:flex flex-col justify-center text-white">
          <div className="mb-6 bg-gradient-to-br from-blue-600 to-cyan-400 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Video size={32} />
          </div>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Premium<br />Video Meetings</h1>
          <p className="text-slate-400 text-lg max-w-sm">
            HD video, screen share, chat — powered by Stream Video SDK.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Grid, Speaker-Left, Speaker-Right layouts
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 flex flex-col justify-center">
          <button onClick={() => router.push("/dashboard")}
            className="self-start mb-8 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          {(error || createError) && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error ?? createError}
            </div>
          )}

          {/* New Meeting */}
          {!inCall ? (
            <div className="mb-8">
              <button onClick={handleCreateMeeting} disabled={creating || !client}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                {creating ? <Loader2 size={22} className="animate-spin" /> : <Video size={22} />}
                <span className="text-lg">{creating ? "Creating room…" : "New Meeting"}</span>
              </button>
              <p className="text-center text-slate-500 text-sm mt-3">
                {!client ? "Connecting to Stream…" : "Start an instant HD meeting."}
              </p>
            </div>
          ) : newMeetingId ? (
            <div className="mb-8 p-5 bg-slate-900/60 rounded-2xl border border-slate-600">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-3 font-semibold">Meeting ID</p>
              <div className="flex items-center gap-3">
                <span className="flex-1 text-sm font-mono font-bold text-white break-all">{newMeetingId}</span>
                <button onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white transition-colors">
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-3">Share this ID — others paste it in the Join field.</p>
              <button onClick={() => router.push("/editor")}
                className="mt-4 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold transition-colors">
                Open Editor →
              </button>
            </div>
          ) : null}

          {!inCall && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-700" />
                <span className="flex-shrink mx-4 text-slate-500 text-sm">Or join existing</span>
                <div className="flex-grow border-t border-slate-700" />
              </div>
              <form onSubmit={handleJoinMeeting} className="mt-6 space-y-4">
                <div className="relative">
                  <input type="text" placeholder="Paste meeting ID here" value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 pl-12 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                </div>
                <button type="submit" disabled={!meetingId.trim() || !client}
                  className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors">
                  Join
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
