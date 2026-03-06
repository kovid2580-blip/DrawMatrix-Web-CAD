"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Call,
    CallingState,
    PaginatedGridLayout,
    SpeakerLayout,
    StreamCall,
    useStreamVideoClient,
    useCallStateHooks,
    useCall as useStreamCall,
    VideoPreview,
    DeviceSettings,
    ParticipantView,
} from "@stream-io/video-react-sdk";
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MonitorX,
    LayoutGrid, LayoutList, Users, Settings, Search,
    Copy, Check, Minimize2, Maximize2, X, Loader2,
} from "lucide-react";
import { useCall as useCallCtx } from "@/providers/CallContext";

interface StreamVideoCallProps {
    roomName: string;
    onEndCall: () => void;
}

type LayoutType = "grid" | "speaker-left" | "speaker-right";

// ── Custom control bar ───────────────────────────────────────────────────────
const ControlBar = ({
    roomName,
    onEndCall,
    layout,
    setLayout,
    showParticipants,
    setShowParticipants,
    showSettings,
    setShowSettings,
    onScreenShare,
    isScreenSharing,
}: {
    roomName: string;
    onEndCall: () => void;
    layout: LayoutType;
    setLayout: (l: LayoutType) => void;
    showParticipants: boolean;
    setShowParticipants: (v: boolean) => void;
    showSettings: boolean;
    setShowSettings: (v: boolean) => void;
    onScreenShare: () => void;
    isScreenSharing: boolean;
}) => {
    const call = useStreamCall();
    const { useMicrophoneState, useCameraState } = useCallStateHooks();
    const { isMute: isMicMuted } = useMicrophoneState();
    const { isMute: isCamMuted } = useCameraState();
    const { toggleMinimize, isMinimized } = useCallCtx();
    const [copied, setCopied] = useState(false);

    const toggleMic = () => call?.microphone.toggle();
    const toggleCam = () => call?.camera.toggle();

    const copyId = () => {
        navigator.clipboard.writeText(roomName);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-20 shrink-0 flex items-center justify-between px-6 bg-slate-900/95 backdrop-blur border-t border-slate-700">
            {/* Left – mic & camera */}
            <div className="flex items-center gap-3">
                {/* Mic */}
                <button
                    onClick={toggleMic}
                    title={isMicMuted ? "Unmute" : "Mute"}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all text-xs font-semibold ${isMicMuted
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-gray-200"
                        }`}
                >
                    {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    <span>{isMicMuted ? "Unmute" : "Mute"}</span>
                </button>

                {/* Camera */}
                <button
                    onClick={toggleCam}
                    title={isCamMuted ? "Start Video" : "Stop Video"}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all text-xs font-semibold ${isCamMuted
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-gray-200"
                        }`}
                >
                    {isCamMuted ? <VideoOff size={18} /> : <Video size={18} />}
                    <span>{isCamMuted ? "Start Cam" : "Stop Cam"}</span>
                </button>

                {/* Screen share */}
                <button
                    onClick={onScreenShare}
                    title={isScreenSharing ? "Stop sharing" : "Share screen"}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all text-xs font-semibold ${isScreenSharing
                        ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-gray-200"
                        }`}
                >
                    {isScreenSharing ? <MonitorX size={18} /> : <MonitorUp size={18} />}
                    <span>{isScreenSharing ? "Stop Share" : "Share"}</span>
                </button>
            </div>

            {/* Centre – leave */}
            <button
                onClick={onEndCall}
                className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-lg shadow-red-900/40"
            >
                <PhoneOff size={18} />
                <span>Leave</span>
            </button>

            {/* Right – layout, participants, settings, float */}
            <div className="flex items-center gap-2">
                {/* Layout switcher */}
                <div className="flex gap-1">
                    {(["grid", "speaker-left", "speaker-right"] as LayoutType[]).map((l) => (
                        <button
                            key={l}
                            onClick={() => setLayout(l)}
                            title={l}
                            className={`p-2 rounded-lg transition-colors ${layout === l ? "bg-cyan-600 text-white" : "bg-slate-700 text-gray-400 hover:bg-slate-600"}`}
                        >
                            {l === "grid" ? <LayoutGrid size={15} /> : <LayoutList size={15} />}
                        </button>
                    ))}
                </div>

                {/* Participants */}
                <button
                    onClick={() => setShowParticipants(!showParticipants)}
                    title="Participants"
                    className={`p-2 rounded-lg transition-colors ${showParticipants ? "bg-cyan-600 text-white" : "bg-slate-700 text-gray-400 hover:bg-slate-600"}`}
                >
                    <Users size={15} />
                </button>

                {/* Settings / meeting info */}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    title="Meeting info"
                    className={`p-2 rounded-lg transition-colors ${showSettings ? "bg-cyan-600 text-white" : "bg-slate-700 text-gray-400 hover:bg-slate-600"}`}
                >
                    <Settings size={15} />
                </button>

                {/* Floating window toggle */}
                <button
                    onClick={toggleMinimize}
                    title={isMinimized ? "Expand" : "Float"}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 transition-colors"
                >
                    {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
                </button>
            </div>

            {/* Settings panel */}
            {showSettings && (
                <div className="absolute bottom-24 right-6 w-80 bg-slate-800 border border-slate-600 rounded-2xl p-5 shadow-2xl z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold text-sm">Meeting Info</h3>
                        <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-semibold">Meeting ID</p>
                            <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2">
                                <span className="flex-1 text-xs font-mono text-white break-all">{roomName}</span>
                                <button onClick={copyId} className="shrink-0 text-slate-400 hover:text-white transition-colors">
                                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500">
                            Share the ID above so others can join this meeting.
                        </div>
                        <div className="border-t border-slate-700 pt-3">
                            <p className="text-slate-400 text-xs mb-2 font-semibold">Device Settings</p>
                            <DeviceSettings />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Inner meeting room ───────────────────────────────────────────────────────
const MeetingRoom = ({ roomName, onEndCall }: { roomName: string; onEndCall: () => void }) => {
    const call = useStreamCall();
    const [layout, setLayout] = useState<LayoutType>("speaker-left");
    const [showParticipants, setShowParticipants] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [participantSearch, setParticipantSearch] = useState("");
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();
    const filtered = participants.filter((p) =>
        (p.name ?? p.userId ?? "").toLowerCase().includes(participantSearch.toLowerCase())
    );

    const toggleScreenShare = async () => {
        if (!call) return;
        try {
            await call.screenShare.toggle();
            setIsScreenSharing((v) => !v);
        } catch (e) {
            console.error("Screen share failed:", e);
        }
    };

    if (callingState !== CallingState.JOINED) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-950">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
        );
    }

    const CallLayout = () => {
        switch (layout) {
            case "grid": return <PaginatedGridLayout />;
            case "speaker-left": return <SpeakerLayout participantsBarPosition="left" />;
            default: return <SpeakerLayout participantsBarPosition="right" />;
        }
    };

    return (
        <section className="relative flex flex-col h-full w-full bg-slate-950 text-white overflow-hidden">
            {/* Participant count badge */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {participants.length} participant{participants.length !== 1 ? "s" : ""}
            </div>

            {/* Video area */}
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-hidden">
                    <CallLayout />
                </div>
                {showParticipants && (
                    <div className="w-72 shrink-0 border-l border-slate-700 bg-slate-900 flex flex-col">
                        <div className="p-4 border-b border-slate-700">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-white">Participants ({participants.length})</span>
                                <button onClick={() => setShowParticipants(false)} className="text-slate-400 hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>
                            {/* Search input */}
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search participants…"
                                    value={participantSearch}
                                    onChange={(e) => setParticipantSearch(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {filtered.length === 0 && (
                                <p className="text-center text-slate-500 text-xs py-4">No participants found</p>
                            )}
                            {filtered.map((p) => (
                                <div key={p.sessionId} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800">
                                    <div className="w-7 h-7 rounded-full bg-cyan-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                        {(p.name ?? p.userId ?? "?")[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm text-slate-200 truncate">{p.name ?? p.userId ?? "Unknown"}</span>
                                    <div className="ml-auto flex gap-1">
                                        {p.isSpeaking && <Mic size={12} className="text-green-400" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom control bar */}
            <div className="relative">
                <ControlBar
                    roomName={roomName}
                    onEndCall={onEndCall}
                    layout={layout}
                    setLayout={setLayout}
                    showParticipants={showParticipants}
                    setShowParticipants={setShowParticipants}
                    showSettings={showSettings}
                    setShowSettings={setShowSettings}
                    onScreenShare={toggleScreenShare}
                    isScreenSharing={isScreenSharing}
                />
            </div>
        </section>
    );
};

// ── Pre-join setup ───────────────────────────────────────────────────────────
const MeetingSetup = ({
    onJoin,
    roomName,
    displayName,
    setDisplayName,
    joining,
}: {
    onJoin: () => void;
    roomName: string;
    displayName: string;
    setDisplayName: (n: string) => void;
    joining?: boolean;
}) => {
    const call = useStreamCall();
    const [micCamOff, setMicCamOff] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!call) return;
        if (micCamOff) { call.camera.disable(); call.microphone.disable(); }
        else { call.camera.enable(); call.microphone.enable(); }
    }, [micCamOff, call]);

    const copyId = () => {
        navigator.clipboard.writeText(roomName);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-5 text-white bg-slate-950 p-6 overflow-y-auto">
            <h2 className="text-2xl font-bold">Ready to join?</h2>

            {/* Camera preview */}
            <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-slate-700 bg-slate-900">
                <VideoPreview />
            </div>

            {/* Name input */}
            <div className="w-full max-w-sm">
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1.5 font-semibold">Your name</label>
                <input
                    type="text"
                    placeholder="Enter your name…"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                />
            </div>

            {/* Meeting ID */}
            <div className="w-full max-w-sm">
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-1.5 font-semibold">Meeting ID</label>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5">
                    <span className="flex-1 text-xs font-mono text-slate-300 break-all">{roomName}</span>
                    <button onClick={copyId} className="text-slate-400 hover:text-white shrink-0 transition-colors">
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                </div>
            </div>

            {/* Mic/cam toggle & device settings */}
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={micCamOff}
                        onChange={(e) => setMicCamOff(e.target.checked)}
                        className="w-4 h-4 accent-cyan-500"
                    />
                    Join muted
                </label>
                <DeviceSettings />
            </div>

            <button
                onClick={onJoin}
                disabled={joining}
                className="w-full max-w-sm px-8 py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-cyan-900/40"
            >
                {joining ? "Joining…" : "Join Meeting"}
            </button>
        </div>
    );
};

// ── Public wrapper ───────────────────────────────────────────────────────────
const StreamVideoCall = ({ roomName, onEndCall }: StreamVideoCallProps) => {
    const client = useStreamVideoClient();
    const [call, setCall] = useState<Call | null>(null);
    const [setupComplete, setSetupComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState(() =>
        typeof window !== "undefined"
            ? localStorage.getItem("drawmatrix_display_name") ?? ""
            : ""
    );

    useEffect(() => {
        if (!client) return;
        const callId = roomName.replace(/[^a-zA-Z0-9_-]/g, "-");
        const c = client.call("default", callId);
        c.getOrCreate()
            .then(() => setCall(c))
            .catch((err) => setError(err?.message ?? "Could not connect to meeting"));
        return () => { c.leave().catch(() => { }); };
    }, [client, roomName]);

    const [joining, setJoining] = useState(false);

    const handleJoin = useCallback(async () => {
        if (!call || !client) return;
        setJoining(true);

        const name = displayName.trim() || `User-${Math.random().toString(36).slice(-4)}`;
        const userId = typeof window !== "undefined" ? localStorage.getItem("drawmatrix_user_id") ?? "" : "";
        localStorage.setItem("drawmatrix_display_name", name);

        try {
            // Reconnect with the real display name so all participants see it correctly
            await (client as any).disconnectUser();
            await (client as any).connectUser(
                { id: userId, name },
                async () => {
                    const res = await fetch("/api/stream/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId }),
                    });
                    const { token } = await res.json();
                    return token as string;
                }
            );
        } catch (err) {
            console.warn("[Stream] Reconnect skipped:", err);
        }

        try {
            await call.join();
        } catch (err) {
            console.error("[Stream] Join failed:", err);
        }

        setJoining(false);
        setSetupComplete(true);
    }, [call, client, displayName]);

    if (error) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-white bg-slate-950 p-6 text-center">
                <p className="text-red-400 font-semibold">{error}</p>
                <button onClick={onEndCall} className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-full text-sm font-bold">Close</button>
            </div>
        );
    }

    if (!call) {
        return (
            <div className="flex h-full items-center justify-center gap-3 text-white bg-slate-950">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-gray-400">Connecting…</span>
            </div>
        );
    }

    return (
        <StreamCall call={call}>
            {setupComplete
                ? <MeetingRoom roomName={roomName} onEndCall={onEndCall} />
                : (
                    <MeetingSetup
                        onJoin={handleJoin}
                        roomName={roomName}
                        displayName={displayName}
                        setDisplayName={setDisplayName}
                        joining={joining}
                    />
                )
            }
        </StreamCall>
    );
};

export default StreamVideoCall;
