import { useEffect, useState } from "react";

export const AUTH_STORAGE_KEYS = [
  "dm_auth_mock",
  "drawmatrix_display_name",
  "drawmatrix_token",
  "drawmatrix_user_id",
  "drawmatrix_user_email",
  "drawmatrix_user_color",
  "drawmatrix_meeting_name",
  "drawmatrix_presence_key",
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
      displayName: "Guest",
      email: "",
      userId: "guest",
    };
  }

  const storedDisplayName =
    window.localStorage.getItem("drawmatrix_display_name") || "Guest";
  const displayName =
    storedDisplayName === "Guest User" ? "Guest" : storedDisplayName;
  const email = window.localStorage.getItem("drawmatrix_user_email") || "";
  const userId = window.localStorage.getItem("drawmatrix_user_id") || "guest";

  if (displayName !== storedDisplayName) {
    window.localStorage.setItem("drawmatrix_display_name", displayName);
  }

  return { displayName, email, userId };
};

export const ensureLocalAccessProfile = () => {
  if (typeof window === "undefined") {
    return {
      displayName: "Guest",
      email: "",
      userId: "guest",
    };
  }

  const existing = getCurrentUserProfile();
  if (
    existing.displayName !== "Guest" ||
    existing.email ||
    existing.userId !== "guest"
  ) {
    return existing;
  }

  const presenceKey = getOrCreatePresenceKey();
  const guestId = `guest-${presenceKey.slice(-6)}`;
  const profile = {
    displayName: "Guest",
    email: "",
    userId: guestId,
  };

  window.localStorage.setItem("drawmatrix_display_name", profile.displayName);
  window.localStorage.setItem("drawmatrix_user_email", profile.email);
  window.localStorage.setItem("drawmatrix_user_id", profile.userId);
  window.localStorage.setItem("cad_user_id", profile.userId);

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

export const useRequireAuth = () => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    setIsCheckingAuth(false);
  }, []);

  return { isCheckingAuth };
};
