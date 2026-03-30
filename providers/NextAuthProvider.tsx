"use client";

import { SessionProvider, useSession } from "next-auth/react";
import React, { useEffect } from "react";

const UserSync = () => {
  const { data: session } = useSession();
  const API_BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
  
  useEffect(() => {
    if (session?.user?.email) {
      fetch(`${API_BASE_URL}/upsert-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          username: session.user.name,
        }),
      }).catch((err) => console.error("Sync error:", err));
    }
  }, [session, API_BASE_URL]);
  return null;
};

export const NextAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <UserSync />
      {children}
    </SessionProvider>
  );
};
