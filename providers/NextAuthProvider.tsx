"use client";

import { SessionProvider } from "next-auth/react";
import React, { useEffect } from "react";

import { ensureLocalAccessProfile } from "@/lib/auth";

export const NextAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    ensureLocalAccessProfile();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
};
