"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  MessageSquare,
  Send,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUserProfile, getOrCreatePresenceKey } from "@/lib/auth";
import { buildBackendUrl } from "@/lib/api-base";
import { socket } from "@/lib/socket";
import { UserPresence, useThreeStore } from "@/store";

const ROOM_ID = "1234567890";

type MemberRecord = {
  _id: string;
  username: string;
  email: string;
  assignedName?: string;
  presenceKey?: string;
  userId?: string;
  status?: "online" | "offline";
  isGuest?: boolean;
  joinedOrder?: number;
};

const normalizeMemberRecord = (
  member: Partial<MemberRecord>
): MemberRecord => ({
  _id:
    typeof member._id === "string"
      ? member._id
      : `usr-${Math.random().toString(36).slice(2, 10)}`,
  username: member.username || member.assignedName || "Guest User",
  email: member.email || "",
  assignedName: member.assignedName || member.username || "Guest User",
  presenceKey: member.presenceKey || "",
  userId: member.userId || member.presenceKey || member.email || "",
  status: member.status === "online" ? "online" : "offline",
  isGuest: Boolean(member.isGuest),
  joinedOrder:
    typeof member.joinedOrder === "number" ? member.joinedOrder : 999,
});

type ScheduleItem = {
  _id: string;
  title: string;
  date: string;
  time: string;
  type: string;
};

type FeedMessage = {
  id: string;
  user: string;
  text: string;
  time: string;
};

type PresencePayload = {
  projectId: string;
  userId: string;
  presence: UserPresence;
};

const FALLBACK_MESSAGE: FeedMessage = {
  id: "1",
  user: "System",
  text: "Welcome to the project feed!",
  time: "09:00 AM",
};

const SchedulesPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { presences, updatePresence, removePresence } = useThreeStore();
  const [allUsers, setAllUsers] = useState<MemberRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState("Meeting");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(
    socket.connected
  );
  const isInitialLoad = useRef(true);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(buildBackendUrl("/get-users"));
      if (!response.ok) {
        throw new Error("Server response not ok");
      }

      const data: unknown = await response.json();
      if (Array.isArray(data)) {
        const dedupedUsers = Array.from(
          data
            .map((member) => normalizeMemberRecord(member as MemberRecord))
            .reduce((map, member) => {
              const identityKey =
                member.userId ||
                member.presenceKey ||
                member.email ||
                member._id;
              const existing = map.get(identityKey);

              if (
                !existing ||
                (existing.status !== "online" && member.status === "online")
              ) {
                map.set(identityKey, member);
              }

              return map;
            }, new Map<string, MemberRecord>())
            .values()
        ).sort((a, b) => (a.joinedOrder ?? 999) - (b.joinedOrder ?? 999));

        setAllUsers(dedupedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setAllUsers([]);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const joinRealtimeRoom = () => {
      const realtimeProfile = getCurrentUserProfile();
      const presenceKey = getOrCreatePresenceKey();
      const userPresence: UserPresence = {
        id: realtimeProfile.userId || Math.random().toString(),
        name: realtimeProfile.displayName || session?.user?.name || "Guest",
        color:
          (typeof window !== "undefined" &&
            window.localStorage.getItem("drawmatrix_user_color")) ||
          "#38bdf8",
        cursor: null,
        cameraPosition: [0, 5, 10],
        status: "online",
      };

      socket.emit("join_project", {
        projectId: ROOM_ID,
        userId: realtimeProfile.userId,
        username: realtimeProfile.displayName,
        email: realtimeProfile.email || session?.user?.email || "",
        presenceKey,
      });

      socket.emit("presence-update", {
        projectId: ROOM_ID,
        userId: userPresence.id,
        presence: userPresence,
      });
    };

    const handlePresenceUpdate = ({ userId, presence }: PresencePayload) => {
      updatePresence(userId, presence);
      void fetchUsers();
    };

    const handlePresenceDisconnect = (userId: string) => {
      removePresence(userId);
      void fetchUsers();
    };

    const handlePresenceList = (presenceMap: Record<string, UserPresence>) => {
      Object.values(presenceMap).forEach((presence) => {
        updatePresence(presence.id, presence);
      });
      void fetchUsers();
    };

    const handleConnect = () => {
      setIsRealtimeConnected(true);
      joinRealtimeRoom();
      void fetchUsers();
    };

    const handleDisconnect = () => {
      setIsRealtimeConnected(false);
    };

    const handleConnectError = () => {
      setIsRealtimeConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    socket.on("presence-update", handlePresenceUpdate);
    socket.on("presence-disconnect", handlePresenceDisconnect);
    socket.on("room_presence_list", handlePresenceList);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("presence-update", handlePresenceUpdate);
      socket.off("presence-disconnect", handlePresenceDisconnect);
      socket.off("room_presence_list", handlePresenceList);
    };
  }, [fetchUsers, removePresence, session, updatePresence]);

  useEffect(() => {
    const loadMessagesAndSchedules = async () => {
      try {
        const messagesResponse = await fetch(
          buildBackendUrl(`/api/messages?projectId=${ROOM_ID}`)
        );
        const messagesData: unknown = await messagesResponse.json();
        if (Array.isArray(messagesData) && messagesData.length > 0) {
          setMessages(messagesData as FeedMessage[]);
        } else {
          setMessages([FALLBACK_MESSAGE]);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([FALLBACK_MESSAGE]);
      }

      try {
        const schedulesResponse = await fetch(
          buildBackendUrl(`/api/schedules?projectId=${ROOM_ID}`)
        );
        const schedulesData: unknown = await schedulesResponse.json();
        if (Array.isArray(schedulesData)) {
          setSchedules(schedulesData as ScheduleItem[]);
        }
      } catch (error) {
        console.error("Failed to fetch schedules:", error);
      }

      isInitialLoad.current = false;
    };

    const handleReceiveMessage = (message: FeedMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    void loadMessagesAndSchedules();
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, []);

  const cleanupSchedules = useCallback(() => {
    const now = new Date();
    setSchedules((prev) => {
      const filtered = prev.filter((schedule) => {
        if (!schedule.date || !schedule.time) return true;
        const scheduleTime = new Date(`${schedule.date}T${schedule.time}`);
        if (Number.isNaN(scheduleTime.getTime())) return true;
        return scheduleTime > now;
      });

      return filtered.length === prev.length ? prev : filtered;
    });
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) return;

    cleanupSchedules();
    const interval = setInterval(cleanupSchedules, 60000);
    return () => clearInterval(interval);
  }, [cleanupSchedules]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const author = currentProfile.displayName || session?.user?.name || "Guest";

    const message: Omit<FeedMessage, "id"> & { projectId: string } = {
      projectId: ROOM_ID,
      user: author,
      text: newMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    socket.emit("send_message", message);
    setMessages((prev) => [...prev, { ...message, id: Date.now().toString() }]);
    setNewMessage("");
  };

  const handleAddSchedule = async () => {
    if (!newTitle || !newDate || !newTime) return;

    const scheduleData = {
      title: newTitle,
      date: newDate,
      time: newTime,
      type: newType,
      projectId: ROOM_ID,
      createdBy: session?.user?.email,
    };

    try {
      const response = await fetch(buildBackendUrl("/api/schedules"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });
      const newSchedule: ScheduleItem = await response.json();
      setSchedules((prev) => [...prev, newSchedule]);
      setNewTitle("");
      setNewDate("");
      setNewTime("");
      setNewType("Meeting");
      setShowForm(false);
    } catch (error) {
      console.error("Failed to add schedule:", error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await fetch(buildBackendUrl(`/api/schedules/${id}`), {
        method: "DELETE",
      });
      setSchedules((prev) => prev.filter((schedule) => schedule._id !== id));
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    }
  };

  const onlineUsers = allUsers.filter((user) => user.status === "online");
  const offlineUsers = allUsers.filter((user) => user.status !== "online");
  const currentProfile = getCurrentUserProfile();

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500"
          >
            + New Schedule
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
              <Calendar className="text-green-400" /> Upcoming
            </h2>
            {schedules.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
                No active schedules found.
              </div>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule._id}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 p-6 transition-colors hover:border-blue-500/50"
                >
                  <div>
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-400">
                      {schedule.type}
                    </div>
                    <div className="text-lg font-bold text-white">
                      {schedule.title}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {schedule.date} at {schedule.time}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSchedule(schedule._id)}
                    className="rounded-lg p-2 text-red-400 opacity-0 transition-all hover:bg-red-500/10 group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex h-[600px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-6">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <MessageSquare size={20} className="text-blue-400" /> Project
                Live Feed
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-all active:scale-95 hover:bg-white/10">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${isRealtimeConnected ? "animate-pulse bg-green-500" : "bg-amber-500"}`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white">
                        {isRealtimeConnected
                          ? "Live Online"
                          : "Realtime Offline"}
                      </span>
                      <ChevronDown
                        size={12}
                        className="text-slate-500 transition-colors group-hover:text-white"
                      />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl"
                >
                  <DropdownMenuLabel className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-slate-500">
                    Active Now (Room {ROOM_ID})
                  </DropdownMenuLabel>
                  {onlineUsers.length > 0 ? (
                    onlineUsers.map((user) => (
                      <DropdownMenuItem
                        key={user._id}
                        className="flex cursor-default items-center justify-between rounded-lg p-2 hover:bg-white/5 focus:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black"
                            style={{
                              backgroundColor:
                                Object.values(presences).find(
                                  (presence) =>
                                    presence.id === (user.userId || user.email)
                                )?.color || "#3b82f6",
                            }}
                          >
                            {(user.assignedName || user.username || "?")[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">
                              {user.assignedName || user.username}{" "}
                              {(user.userId &&
                                user.userId === currentProfile.userId) ||
                              (user.email &&
                                user.email === session?.user?.email)
                                ? "(You)"
                                : ""}
                            </span>
                            <span className="text-[9px] uppercase tracking-tighter text-green-500">
                              Online
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-center text-xs italic text-slate-600">
                      {isRealtimeConnected
                        ? "No users active right now"
                        : "Connecting to signaling server..."}
                    </div>
                  )}

                  <DropdownMenuSeparator className="my-2 bg-white/5" />

                  <DropdownMenuLabel className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-slate-500">
                    Offline Members
                  </DropdownMenuLabel>
                  {allUsers.length > 0 ? (
                    offlineUsers.length > 0 ? (
                      offlineUsers.map((user) => (
                        <DropdownMenuItem
                          key={user._id}
                          className="flex items-center justify-between rounded-lg p-2 opacity-50 grayscale"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-slate-400">
                              {(user.assignedName || user.username || "U")[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-400">
                                {user.assignedName ||
                                  user.username ||
                                  user.email}
                              </span>
                              <span className="text-[9px] uppercase tracking-tighter text-slate-600">
                                Offline
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-2 rounded-full bg-slate-700" />
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-3 text-center text-[10px] italic text-slate-600">
                        All members are online
                      </div>
                    )
                  ) : (
                    <div className="px-2 py-3 text-center text-[10px] italic text-slate-600">
                      No members synced in database
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4 font-mono text-sm">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 border-b border-white/5 bg-slate-900/90 text-[10px] uppercase tracking-tighter text-slate-500 backdrop-blur-sm">
                  <tr>
                    <th className="w-24 px-4 py-2 text-left font-bold">User</th>
                    <th className="px-4 py-2 text-left font-bold">Message</th>
                    <th className="w-24 px-4 py-2 text-right font-bold">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.tr
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`font-bold ${
                              message.user === session?.user?.name
                                ? "text-blue-400"
                                : "text-slate-300"
                            }`}
                          >
                            {message.user}
                          </span>
                        </td>
                        <td className="max-w-[150px] break-words px-4 py-3 text-slate-200">
                          {message.text}
                        </td>
                        <td className="px-4 py-3 text-right text-[10px] tabular-nums text-slate-500 align-top">
                          {message.time}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/10 bg-white/5 p-4">
              <div className="group relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={(event) =>
                    event.key === "Enter" && handleSendMessage()
                  }
                  placeholder="Type a message to project group..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 pr-14 text-sm outline-none transition-all placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 group-hover:border-white/20"
                />
                <button
                  onClick={handleSendMessage}
                  className="absolute right-2 top-2 rounded-xl bg-blue-600 p-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 hover:bg-blue-500"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl"
          >
            <h2 className="mb-6 text-2xl font-bold">Create Schedule</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="e.g. Design Review"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(event) => setNewDate(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(event) => setNewTime(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">
                  Meeting Type
                </label>
                <select
                  value={newType}
                  onChange={(event) => setNewType(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-slate-800 p-4 text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Meeting">General Meeting</option>
                  <option value="Review">Design Review</option>
                  <option value="Sync">Project Sync</option>
                  <option value="Workshop">Workshop</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold transition-colors hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSchedule}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-500"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SchedulesPage;
