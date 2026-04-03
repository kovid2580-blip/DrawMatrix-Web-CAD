"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CallContextType {
  inCall: boolean;
  channelName: string;
  isMinimized: boolean;
  isInitiator: boolean;
  error: string | null;
  joinCall: (channel: string, options?: { initiator?: boolean }) => void;
  leaveCall: () => void;
  toggleMinimize: () => void;
  setError: (err: string | null) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const [inCall, setInCall] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinCall = (channel: string, options?: { initiator?: boolean }) => {
    setError(null);
    setChannelName(channel);
    setInCall(true);
    setIsMinimized(false);
    setIsInitiator(Boolean(options?.initiator));
  };

  const leaveCall = () => {
    setInCall(false);
    setChannelName("");
    setIsMinimized(false);
    setIsInitiator(false);
    setError(null);
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  return (
    <CallContext.Provider
      value={{
        inCall,
        channelName,
        isMinimized,
        isInitiator,
        error,
        joinCall,
        leaveCall,
        toggleMinimize,
        setError,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};
