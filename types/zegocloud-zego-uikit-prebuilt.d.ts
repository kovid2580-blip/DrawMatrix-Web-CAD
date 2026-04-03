declare module "@zegocloud/zego-uikit-prebuilt" {
  export const ZegoUIKitPrebuilt: {
    GroupCall: unknown;
    create: (token: string) => {
      destroy: () => void;
      joinRoom: (options: {
        container: HTMLDivElement;
        sharedLinks?: Array<{ name: string; url: string }>;
        scenario: { mode: unknown };
        turnOnCameraWhenJoining?: boolean;
        turnOnMicrophoneWhenJoining?: boolean;
        showScreenSharingButton?: boolean;
        showTextChat?: boolean;
        maxUsers?: number;
        onJoinRoom?: () => void;
        onLeaveRoom?: () => void;
        onUserJoin?: () => void;
        onUserLeave?: () => void;
      }) => void;
    };
    generateKitTokenForTest: (
      appId: number,
      serverSecret: string,
      roomId: string,
      userId: string,
      displayName: string
    ) => string;
  };
}
