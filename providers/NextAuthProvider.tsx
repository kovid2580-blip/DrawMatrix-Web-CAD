"use client";

import { SessionProvider, useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { getOrCreatePresenceKey } from "@/lib/auth";

const UserSync = () => {
  const { data: session } = useSession();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:3001";

  useEffect(() => {
    const presenceKey = getOrCreatePresenceKey();
    const palette = [
      "#38bdf8",
      "#22c55e",
      "#f59e0b",
      "#a855f7",
      "#ef4444",
      "#14b8a6",
    ];
    const colorSeed = presenceKey
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const assignedColor = palette[colorSeed % palette.length];

    fetch(`${API_BASE_URL}/upsert-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presenceKey,
        email: session?.user?.email || "",
        username: session?.user?.name || "",
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Sync failed with status ${response.status}`);
        }

        const payload = await response.json();
        const user = payload?.user;
        if (!user || typeof window === "undefined") {
          return;
        }

        window.localStorage.setItem(
          "drawmatrix_display_name",
          user.assignedName || user.username || "Guest User"
        );
        window.localStorage.setItem(
          "drawmatrix_user_id",
          user.userId || user.presenceKey || presenceKey
        );
        window.localStorage.setItem(
          "cad_user_id",
          user.userId || user.presenceKey || presenceKey
        );
        window.localStorage.setItem(
          "drawmatrix_user_email",
          user.email || session?.user?.email || ""
        );
        window.localStorage.setItem("drawmatrix_user_color", assignedColor);
      })
      .catch((err) => console.error("Sync error:", err));
  }, [session, API_BASE_URL]);
  return null;
};

export const NextAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <SessionProvider>
      <UserSync />
      {children}
    </SessionProvider>
  );
};
