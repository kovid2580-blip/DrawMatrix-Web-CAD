import { useEffect, useState } from "react";

import { buildBackendUrl } from "@/lib/api-base";

const DEFAULT_LOCAL_DISPLAY_NAME = "Kovid";

export const AUTH_STORAGE_KEYS = [
  "dm_auth_mock",
  "drawmatrix_display_name",
  "drawmatrix_token",
  "drawmatrix_user_id",
  "drawmatrix_user_email",
  "drawmatrix_user_color",
  "drawmatrix_meeting_name",
  "drawmatrix_presence_key",
  "drawmatrix_profile_sync_key",
] as const;

export const isAuthenticated = () => {
  // Temporary bypass: allow app usage without login while auth backend is unstable.
  return true;
};

export const clearAuthStorage = () => {
  if (typeof window === "undefined") return;

  AUTH_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
};

export const getCurrentUserProfile = () => {
  if (typeof window === "undefined") {
    return {
      displayName: DEFAULT_LOCAL_DISPLAY_NAME,
      email: "",
      userId: "guest",
    };
  }

  const storedDisplayName =
    window.localStorage.getItem("drawmatrix_display_name") ||
    DEFAULT_LOCAL_DISPLAY_NAME;
  const displayName =
    storedDisplayName === "Guest User" || storedDisplayName === "Guest"
      ? DEFAULT_LOCAL_DISPLAY_NAME
      : storedDisplayName;
  const email = window.localStorage.getItem("drawmatrix_user_email") || "";
  const userId = window.localStorage.getItem("drawmatrix_user_id") || "guest";

  if (displayName !== storedDisplayName) {
    window.localStorage.setItem("drawmatrix_display_name", displayName);
  }

  return { displayName, email, userId };
};

const persistUserProfile = ({
  displayName,
  email,
  userId,
}: {
  displayName: string;
  email: string;
  userId: string;
}) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem("drawmatrix_display_name", displayName);
  window.localStorage.setItem("drawmatrix_user_email", email);
  window.localStorage.setItem("drawmatrix_user_id", userId);
  window.localStorage.setItem("cad_user_id", userId);
};

export const updateLocalDisplayName = (displayName: string) => {
  if (typeof window === "undefined") return;

  const nextName = displayName.trim() || DEFAULT_LOCAL_DISPLAY_NAME;
  const existing = getCurrentUserProfile();

  persistUserProfile({
    displayName: nextName,
    email: existing.email || "",
    userId: existing.userId || "guest",
  });
};

export const ensureLocalAccessProfile = () => {
  if (typeof window === "undefined") {
    return {
      displayName: DEFAULT_LOCAL_DISPLAY_NAME,
      email: "",
      userId: "guest",
    };
  }

  const existing = getCurrentUserProfile();
  if (
    existing.displayName !== DEFAULT_LOCAL_DISPLAY_NAME ||
    existing.email ||
    existing.userId !== "guest"
  ) {
    return existing;
  }

  const presenceKey = getOrCreatePresenceKey();
  const guestId = `guest-${presenceKey.slice(-6)}`;
  const profile = {
    displayName: DEFAULT_LOCAL_DISPLAY_NAME,
    email: "",
    userId: guestId,
  };

  persistUserProfile(profile);

  return profile;
};

export const getOrCreatePresenceKey = () => {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem("drawmatrix_presence_key");
  if (existing) return existing;

  const generated = `presence-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  window.localStorage.setItem("drawmatrix_presence_key", generated);
  return generated;
};

export const syncAssignedIdentity = async () => {
  if (typeof window === "undefined") {
    return {
      changed: false,
      profile: {
        displayName: DEFAULT_LOCAL_DISPLAY_NAME,
        email: "",
        userId: "guest",
      },
    };
  }

  const localProfile = ensureLocalAccessProfile();
  const presenceKey = getOrCreatePresenceKey();
  const lastSyncedPresenceKey =
    window.localStorage.getItem("drawmatrix_profile_sync_key") || "";

  if (
    lastSyncedPresenceKey === presenceKey &&
    localProfile.displayName !== DEFAULT_LOCAL_DISPLAY_NAME &&
    localProfile.displayName !== "Guest User"
  ) {
    return { changed: false, profile: localProfile };
  }

  try {
    const response = await fetch(buildBackendUrl("/upsert-user"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        presenceKey,
        email: localProfile.email || "",
        username: localProfile.displayName || DEFAULT_LOCAL_DISPLAY_NAME,
      }),
    });

    if (!response.ok) {
      return { changed: false, profile: localProfile };
    }

    const data = (await response.json()) as {
      user?: {
        assignedName?: string;
        username?: string;
        email?: string;
        userId?: string;
        presenceKey?: string;
      };
    };
    const assignedUser = data.user;
    const nextProfile = {
      displayName:
        assignedUser?.assignedName ||
        assignedUser?.username ||
        localProfile.displayName ||
        DEFAULT_LOCAL_DISPLAY_NAME,
      email: assignedUser?.email || localProfile.email || "",
      userId:
        assignedUser?.userId ||
        assignedUser?.presenceKey ||
        localProfile.userId ||
        `guest-${presenceKey.slice(-6)}`,
    };
    const changed =
      nextProfile.displayName !== localProfile.displayName ||
      nextProfile.email !== localProfile.email ||
      nextProfile.userId !== localProfile.userId;

    persistUserProfile(nextProfile);
    window.localStorage.setItem("drawmatrix_profile_sync_key", presenceKey);

    return { changed, profile: nextProfile };
  } catch {
    return { changed: false, profile: localProfile };
  }
};

export const useRequireAuth = () => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    setIsCheckingAuth(false);
  }, []);

  return { isCheckingAuth };
};
