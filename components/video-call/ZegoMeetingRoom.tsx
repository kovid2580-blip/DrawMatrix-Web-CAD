"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ZegoMeetingRoomProps {
  roomId: string;
  displayName: string;
  onLeaveRoom: () => void;
  isInitiator?: boolean;
  className?: string;
  // eslint-disable-next-line no-unused-vars
  onStatusChange?: (_status: string) => void;
}

type ZegoMeetingInstance = {
  destroy: () => void;
  hangUp: () => void;
};

const getStableMeetingUserId = (roomId: string) => {
  if (typeof window === "undefined") {
    return `user-${Math.random().toString(36).slice(2, 10)}`;
  }

  const storageKey = `drawmatrix_meeting_user_id:${roomId}`;
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const generated = `user-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(storageKey, generated);
  return generated;
};

const ZegoMeetingRoom = ({
  roomId,
  displayName,
  onLeaveRoom,
  isInitiator = false,
  className,
  onStatusChange,
}: ZegoMeetingRoomProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const meetingRef = useRef<ZegoMeetingInstance | null>(null);
  const onLeaveRoomRef = useRef(onLeaveRoom);
  const onStatusChangeRef = useRef(onStatusChange);
  const [error, setError] = useState<string | null>(null);
  const userId = useMemo(() => getStableMeetingUserId(roomId), [roomId]);

  useEffect(() => {
    onLeaveRoomRef.current = onLeaveRoom;
  }, [onLeaveRoom]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    let isCancelled = false;

    const pushStatus = (status: string) => {
      onStatusChangeRef.current?.(status);
    };

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
        pushStatus("Loading ZEGOCLOUD meeting...");

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

        pushStatus("Joining room...");

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
          showUserList: true,
          showRemoveUserButton: isInitiator,
          showTurnOffRemoteCameraButton: isInitiator,
          showTurnOffRemoteMicrophoneButton: isInitiator,
          rightPanelExpandedType: "RoomMembers" as never,
          showLeaveRoomConfirmDialog: true,
          endCallWhenInitiatorLeave: isInitiator,
          maxUsers: 12,
          onJoinRoom: () => {
            if (!isCancelled) {
              pushStatus(
                isInitiator
                  ? "Meeting live • host controls enabled"
                  : "Meeting live"
              );
            }
          },
          onLeaveRoom: () => {
            if (!isCancelled) {
              onLeaveRoomRef.current();
            }
          },
          onUserJoin: () => {
            if (!isCancelled) {
              pushStatus("Participant joined");
            }
          },
          onUserLeave: () => {
            if (!isCancelled) {
              pushStatus("Participant left");
            }
          },
          onYouRemovedFromRoom: () => {
            if (!isCancelled) {
              setError("You were removed from the meeting by the host.");
              pushStatus("Removed from room");
              onLeaveRoomRef.current();
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
  }, [displayName, isInitiator, roomId, userId]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-8 text-white">
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
      ref={containerRef}
      className={className || "h-[75vh] w-full rounded-[2rem] bg-slate-950"}
    />
  );
};

export default ZegoMeetingRoom;
