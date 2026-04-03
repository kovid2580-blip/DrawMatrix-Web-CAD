"use client";

import { ReactNode, useEffect, useState } from "react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useCall } from "@/providers/CallContext";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY?.trim();

/** Get (or create) a stable anonymous user ID stored in localStorage. */
function getAnonymousUserId(): string {
  if (typeof window === "undefined") return "ssr-placeholder";
  const key = "drawmatrix_user_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `dm-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

const StreamClientProvider = ({ children }: { children: ReactNode }) => {
  const { inCall, setError } = useCall();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(
    null
  );

  useEffect(() => {
    if (!inCall) {
      setVideoClient(null);
      return;
    }

    if (!API_KEY) {
      console.warn("[Stream] NEXT_PUBLIC_STREAM_API_KEY is not set");
      setError("Video calling is unavailable right now.");
      return;
    }

    let isMounted = true;
    let client: StreamVideoClient | null = null;

    const initClient = async () => {
      try {
        const userId = getAnonymousUserId();
        const savedName = localStorage.getItem("drawmatrix_display_name");
        const displayName = savedName || `User-${userId.slice(-4)}`;

        console.log("[Stream] Initializing client for user:", userId);
        setError(null);

        const tokenProvider = async () => {
          try {
            const domain =
              typeof window !== "undefined" ? window.location.origin : "";
            const url = `${domain}/api/stream/token`;

            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            });

            if (!res.ok) throw new Error(`Token API failed: ${res.status}`);
            const data = await res.json();
            return data.token as string;
          } catch (err) {
            console.error("[Stream] Token error:", err);
            throw err;
          }
        };

        const newClient = new StreamVideoClient({
          apiKey: API_KEY,
          user: { id: userId, name: displayName },
          tokenProvider,
        });

        // Deep Core Fix: Wait for the client to stabilize its internal state
        // This prevents the "Cannot read properties of undefined (reading 'find')" error
        // which occurs when accessing client.state before its collections are initialized.
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (isMounted) {
          client = newClient;
          setVideoClient(newClient);
          console.log("[Stream] Client ready and set to state");
        }
      } catch (err) {
        console.error("[Stream] Client initialization failed:", err);
        setVideoClient(null);
        setError("Video calling is unavailable right now.");
      }
    };

    initClient();

    return () => {
      isMounted = false;
      if (client) {
        void client.disconnectUser().catch(() => {
          // Ignore cleanup failures to keep teardown non-fatal.
        });
        console.log("[Stream] Cleanup: Component unmounting");
      }
    };
  }, [inCall, setError]);

  if (!videoClient) {
    return <>{children}</>;
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamClientProvider;
