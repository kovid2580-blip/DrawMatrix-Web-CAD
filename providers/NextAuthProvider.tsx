"use client";

import { SessionProvider } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { ensureLocalAccessProfile, syncAssignedIdentity } from "@/lib/auth";

export const NextAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const hydrateAssignedIdentity = async () => {
      ensureLocalAccessProfile();
      const result = await syncAssignedIdentity();

      if (!isCancelled && result.changed) {
        setProfileVersion((value) => value + 1);
      }
    };

    void hydrateAssignedIdentity();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <SessionProvider>
      <React.Fragment key={profileVersion}>{children}</React.Fragment>
    </SessionProvider>
  );
};
