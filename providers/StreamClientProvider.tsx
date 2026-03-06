"use client";

import { ReactNode, useEffect, useState } from "react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

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
    const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

    useEffect(() => {
        if (!API_KEY) {
            console.warn("[Stream] NEXT_PUBLIC_STREAM_API_KEY is not set");
            return;
        }

        const userId = getAnonymousUserId();

        const tokenProvider = async () => {
            const res = await fetch("/api/stream/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const { token } = await res.json();
            return token as string;
        };

        const displayName = localStorage.getItem("drawmatrix_display_name");

        const client = new StreamVideoClient({
            apiKey: API_KEY,
            user: { id: userId, name: displayName || `User-${userId.slice(-4)}` },
            tokenProvider,
        });

        setVideoClient(client);

        return () => {
            client.disconnectUser();
        };
    }, []);

    if (!videoClient) {
        // Render children without Stream wrapper during SSR / before client init
        return <>{children}</>;
    }

    return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamClientProvider;
