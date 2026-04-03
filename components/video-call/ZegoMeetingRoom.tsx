"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Maximize2, Minimize2 } from "lucide-react";

interface ZegoMeetingRoomProps {
  roomId: string;
  displayName: string;
  onLeaveRoom: () => void;
}

const createUserId = () => `user-${Math.random().toString(36).slice(2, 10)}`;

const ZegoMeetingRoom = ({
  roomId,
  displayName,
  onLeaveRoom,
}: ZegoMeetingRoomProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const meetingRef = useRef<{ destroy: () => void } | null>(null);
  const onLeaveRoomRef = useRef(onLeaveRoom);
  const [status, setStatus] = useState("Preparing your meeting room...");
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const userId = useMemo(() => createUserId(), []);

  useEffect(() => {
    onLeaveRoomRef.current = onLeaveRoom;
  }, [onLeaveRoom]);

  useEffect(() => {
    let isCancelled = false;

    const setupMeeting = async () => {
      const rawAppId = process.env.NEXT_PUBLIC_ZEGO_APP_ID?.trim() || "";
      const appId = Number(rawAppId);
      const serverSecret =
        process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET?.trim() || "";

      if (!appId || !serverSecret) {
        setError(
          "Missing ZEGOCLOUD credentials. Set NEXT_PUBLIC_ZEGO_APP_ID and NEXT_PUBLIC_ZEGO_SERVER_SECRET in your current environment and redeploy."
        );
        return;
      }

      if (!containerRef.current) return;

      try {
        setStatus("Loading ZEGOCLOUD meeting kit...");

        const { ZegoUIKitPrebuilt } = await import(
          "@zegocloud/zego-uikit-prebuilt"
        );

        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => resolve());
        });

        const container = containerRef.current;

        if (isCancelled || !container.isConnected) return;

        const token = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appId,
          serverSecret,
          roomId,
          userId,
          displayName
        );

        const meeting = ZegoUIKitPrebuilt.create(token);
        meetingRef.current = meeting;
        const inviteBaseUrl =
          process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

        setStatus("Joining room...");

        meeting.joinRoom({
          container,
          sharedLinks: [
            {
              name: "Join meeting",
              url: `${inviteBaseUrl}/video-call?roomID=${roomId}`,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true,
          showScreenSharingButton: true,
          showTextChat: true,
          maxUsers: 12,
          onJoinRoom: () => {
            if (!isCancelled) {
              setStatus("Meeting live");
            }
          },
          onLeaveRoom: () => {
            if (!isCancelled) {
              onLeaveRoomRef.current();
            }
          },
          onUserJoin: () => {
            if (!isCancelled) {
              setStatus("Participant joined");
            }
          },
          onUserLeave: () => {
            if (!isCancelled) {
              setStatus("Participant left");
            }
          },
        });
      } catch (setupError) {
        console.error(setupError);
        setError(
          "Unable to start the ZEGOCLOUD meeting. Check your credentials and browser permissions."
        );
      }
    };

    setupMeeting();

    return () => {
      isCancelled = true;
      meetingRef.current?.destroy();
      meetingRef.current = null;
    };
  }, [displayName, roomId, userId]);

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-8 text-white">
        <div className="max-w-xl text-center">
          <AlertTriangle className="mx-auto mb-4 text-rose-300" size={36} />
          <h2 className="mb-3 text-2xl font-bold">
            Meeting setup needs attention
          </h2>
          <p className="text-sm leading-relaxed text-rose-100/90">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isMinimized
          ? "fixed bottom-5 right-5 z-[70] w-[330px] overflow-hidden rounded-2xl border border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
          : "overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-2xl"
      }
    >
      <div
        className={
          isMinimized
            ? "flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-slate-200"
            : "flex items-center justify-between border-b border-white/10 px-5 py-3 text-sm text-slate-300"
        }
      >
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin text-pink-300" size={16} />
          <span>{isMinimized ? "Live meeting" : status}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white transition hover:bg-white/10"
        >
          {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          {isMinimized ? "Expand" : "Minimize"}
        </button>
      </div>
      <div
        ref={containerRef}
        className={
          isMinimized
            ? "h-[190px] w-full bg-slate-950"
            : "h-[75vh] w-full bg-slate-950"
        }
      />
    </div>
  );
};

export default ZegoMeetingRoom;
