declare module "@zegocloud/zego-uikit-prebuilt" {
  export enum RightPanelExpandedType {
    None = "None",
    RoomDetails = "RoomDetails",
    RoomMembers = "RoomMembers",
    RoomMessages = "RoomMessages",
  }

  export const ZegoUIKitPrebuilt: {
    GroupCall: unknown;
    create: (token: string) => {
      destroy: () => void;
      hangUp: () => void;
      joinRoom: (options: {
        container: HTMLDivElement;
        sharedLinks?: Array<{ name: string; url: string }>;
        scenario: { mode: unknown };
        turnOnCameraWhenJoining?: boolean;
        turnOnMicrophoneWhenJoining?: boolean;
        showScreenSharingButton?: boolean;
        showTextChat?: boolean;
        showUserList?: boolean;
        showRemoveUserButton?: boolean;
        showTurnOffRemoteCameraButton?: boolean;
        showTurnOffRemoteMicrophoneButton?: boolean;
        rightPanelExpandedType?: RightPanelExpandedType;
        showLeaveRoomConfirmDialog?: boolean;
        endCallWhenInitiatorLeave?: boolean;
        maxUsers?: number;
        onJoinRoom?: () => void;
        onLeaveRoom?: () => void;
        onUserJoin?: (users: Array<{ userID: string; userName: string }>) => void;
        onUserLeave?: (
          users: Array<{ userID: string; userName: string }>
        ) => void;
        onYouRemovedFromRoom?: () => void;
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
