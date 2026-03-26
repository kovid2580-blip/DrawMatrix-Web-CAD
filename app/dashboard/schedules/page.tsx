"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useThreeStore } from "@/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TEAM_MEMBERS = [
  { id: "1", name: "Alice Johnson" },
  { id: "2", name: "Bob Smith" },
  { id: "3", name: "Charlie Davis" },
  { id: "4", name: "Diana Prince" },
];

export default function SchedulesPage() {
  const router = useRouter();
  const { presences } = useThreeStore();
  const [schedules, setSchedules] = useState<
    { id: string; title: string; date: string; time: string; type: string }[]
  >([]);
  const [messages, setMessages] = useState<
    { id: string; user: string; text: string; time: string }[]
  >([
    {
      id: "1",
      user: "Alice",
      text: "Excited for the design review!",
      time: "09:45 AM",
    },
    {
      id: "2",
      user: "Bob",
      text: "I'll be sharing the latest mockups.",
      time: "10:15 AM",
    },
    {
      id: "3",
      user: "Charlie",
      text: "Great, looking forward to it.",
      time: "11:00 AM",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState("Meeting");

  const isInitialLoad = React.useRef(true);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("drawmatrix_schedules");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSchedules(parsed);
        }
      } catch (e) {
        console.error("Failed to parse schedules:", e);
      }
    }
    isInitialLoad.current = false;
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialLoad.current) {
      localStorage.setItem("drawmatrix_schedules", JSON.stringify(schedules));
    }
  }, [schedules]);

  // Cleanup logic
  const cleanupSchedules = useCallback(() => {
    const now = new Date();
    setSchedules((prev) => {
      const filtered = prev.filter((s) => {
        if (!s.date || !s.time) return true;
        const scheduleTime = new Date(`${s.date}T${s.time}`);
        // If invalid date, keep it just in case
        if (isNaN(scheduleTime.getTime())) return true;
        return scheduleTime > now;
      });
      // Only update if something was actually filtered to avoid infinite loops/unnecessary saves
      return filtered.length === prev.length ? prev : filtered;
    });
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) return;
    cleanupSchedules();
    const interval = setInterval(cleanupSchedules, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [cleanupSchedules]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now().toString(),
      user: "Me",
      text: newMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  const handleAddSchedule = () => {
    if (!newTitle || !newDate || !newTime) return;
    const newSchedule = {
      id: Date.now().toString(),
      title: newTitle,
      date: newDate,
      time: newTime,
      type: newType,
    };
    setSchedules([...schedules, newSchedule]);
    setNewTitle("");
    setNewDate("");
    setNewTime("");
    setNewType("Meeting");
    setShowForm(false);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            + New Schedule
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* List Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="text-green-400" /> Upcoming
            </h2>
            {schedules.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-3xl bg-slate-900/50 text-slate-500 text-center">
                No active schedules found.
              </div>
            ) : (
              schedules.map((s) => (
                <div
                  key={s.id}
                  className="p-6 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-colors"
                >
                  <div>
                    <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
                      {s.type}
                    </div>
                    <div className="text-lg font-bold text-white">
                      {s.title}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {s.date} at {s.time}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-all"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Project Feed Section */}
          <div className="flex flex-col h-[600px] bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-400" /> Project
                Live Feed
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 group">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold group-hover:text-white transition-colors">
                        Live Online
                      </span>
                      <ChevronDown
                        size={12}
                        className="text-slate-500 group-hover:text-white transition-colors"
                      />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-slate-900/95 backdrop-blur-xl border-white/10 p-2 shadow-2xl"
                >
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500 px-2 py-1.5">
                    Active Now
                  </DropdownMenuLabel>
                  {Object.values(presences).length > 0 ? (
                    Object.values(presences).map((user) => (
                      <DropdownMenuItem
                        key={user.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-default focus:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">
                              {user.name}
                            </span>
                            <span className="text-[9px] text-slate-500 uppercase tracking-tighter">
                              Active in Editor
                            </span>
                          </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-[10px] text-slate-600 italic text-center">
                      No other editors online
                    </div>
                  )}

                  <DropdownMenuSeparator className="bg-white/5 my-2" />

                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500 px-2 py-1.5">
                    Offline
                  </DropdownMenuLabel>
                  {TEAM_MEMBERS.filter(
                    (m) =>
                      !Object.values(presences).find((p) =>
                        p.name.includes(m.name)
                      )
                  ).map((member) => (
                    <DropdownMenuItem
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg opacity-50 grayscale"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                          {member.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400">
                            {member.name}
                          </span>
                          <span className="text-[9px] text-slate-600 uppercase tracking-tighter">
                            Away
                          </span>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-slate-700" />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm custom-scrollbar">
              <table className="w-full border-collapse">
                <thead className="text-[10px] text-slate-500 uppercase tracking-tighter border-b border-white/5 sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold w-24">User</th>
                    <th className="px-4 py-2 text-left font-bold">Message</th>
                    <th className="px-4 py-2 text-right font-bold w-24">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {messages.map((m) => (
                      <motion.tr
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`font-bold ${m.user === "Me" ? "text-blue-400" : "text-slate-300"}`}
                          >
                            {m.user}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-200 break-words max-w-[150px]">
                          {m.text}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 text-[10px] tabular-nums align-top">
                          {m.time}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10">
              <div className="relative group">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message to project group..."
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 pr-14 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 group-hover:border-white/20"
                />
                <button
                  onClick={handleSendMessage}
                  className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Create Schedule</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Design Review"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                  Meeting Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="Meeting">🏠 General Meeting</option>
                  <option value="Review">🎨 Design Review</option>
                  <option value="Sync">🔄 Project Sync</option>
                  <option value="Workshop">💡 Workshop</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSchedule}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold transition-colors shadow-lg shadow-blue-500/20"
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
}
