"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  FolderKanban,
  LogOut,
  Save,
  Video,
} from "lucide-react";

import {
  getLocalProjects,
  mergeProjectLists,
  normalizeProjectListPayload,
  ProjectListItem,
} from "@/lib/project-storage";
import { UserPresence } from "@/store";

type RecentProject = ProjectListItem & {
  id?: string;
  projectId?: string;
};

const Dashboard = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [presenceData, setPresenceData] = useState<
    Record<string, Record<string, UserPresence>>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      const loadLocalProjects = () => {
        setRecentProjects(getLocalProjects().slice(0, 3));
        setLoading(false);
      };

      if (!session?.user?.email) {
        loadLocalProjects();
        return;
      }

      try {
        const res = await fetch(
          `/api/projects?ownerEmail=${session.user.email}`
        );
        if (res.ok) {
          const payload = await res.json();
          const cloudProjects = normalizeProjectListPayload(payload);
          setRecentProjects(
            mergeProjectLists(getLocalProjects(), cloudProjects).slice(0, 3)
          );
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch recent projects:", err);
      }

      loadLocalProjects();
    };

    const fetchPresence = async () => {
      try {
        const res = await fetch(`/api/presence`);
        if (res.ok) {
          setPresenceData(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch presence:", err);
      }
    };

    fetchRecent();
    fetchPresence();

    // Poll presence every 10s
    const pInterval = setInterval(fetchPresence, 10000);
    return () => clearInterval(pInterval);
  }, [session]);

  const cards = [
    {
      title: "Draw Sheet",
      description:
        "Access your architectural designs and DrawMatrix workspace.",
      icon: <FolderKanban className="w-8 h-8 text-cyan-400" />,
      action: () => router.push("/editor?new=true"),
      bg: "bg-blue-950/50",
      border: "border-blue-800",
    },
    {
      title: "Schedules",
      description: "Manage project timelines and deadlines.",
      icon: <Calendar className="w-8 h-8 text-green-400" />,
      action: () => router.push("/dashboard/schedules"),
      bg: "bg-green-950/50",
      border: "border-green-800",
    },
    {
      title: "New Meeting",
      description: "Start a secure video conference.",
      icon: <Video className="w-8 h-8 text-purple-400" />,
      action: () => router.push("/video-call"),
      bg: "bg-purple-950/50",
      border: "border-purple-800",
    },
    {
      title: "Saved Sheets",
      description: "View your saved architectural drawings.",
      icon: <Save className="w-8 h-8 text-orange-400" />,
      action: () => router.push("/dashboard/projects"),
      bg: "bg-orange-950/50",
      border: "border-orange-800",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-black text-white flex flex-col items-center justify-center p-6 font-sans selection:bg-cyan-500/30">
      {/* Top Right Logout */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium text-slate-300 hover:text-white"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6 shadow-lg shadow-cyan-500/20">
          <span className="text-3xl font-bold">D</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400">
          Draw Matrix
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Your centralized workspace for architectural design and collaboration.
        </p>
      </motion.div>

      {/* Recent Work Section */}
      {!loading && recentProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-4xl mb-12"
        >
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Work
            </h2>
            <button
              onClick={() => router.push("/dashboard/projects")}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentProjects.map((p) => {
              const projectId =
                [p.projectId, p.id].find(
                  (value): value is string => typeof value === "string"
                ) || "";
              const projectPresence = presenceData[projectId];
              const members = Object.values(projectPresence);

              return (
                <div
                  key={projectId}
                  onClick={() => router.push(`/editor?projectId=${projectId}`)}
                  className="group relative p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden shadow-2xl"
                >
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <FileText size={16} />
                      </div>

                      {/* Active Members Avatars */}
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {members.map((member, i) => (
                          <div
                            key={i}
                            title={member.name}
                            className="w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center text-[8px] font-bold text-white uppercase"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.name.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                        {p.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        Edited{" "}
                        {new Date(
                          p.lastModified ||
                            p.updatedAt ||
                            p.createdAt ||
                            Date.now()
                        ).toLocaleDateString()}
                        {members.length > 0 && (
                          <span className="text-cyan-500 ml-auto flex items-center gap-0.5 font-bold">
                            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
                            {members.length} Active
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Subtle Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            onClick={card.action}
            className={`group relative overflow-hidden rounded-3xl border ${card.border} ${card.bg} p-6 cursor-pointer hover:border-white/20 hover:shadow-2xl gpu-hover`}
          >
            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="mb-4 p-2.5 bg-white/5 rounded-xl inline-block backdrop-blur-sm border border-white/10">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                {card.title}
              </h3>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                {card.description}
              </p>

              <div className="flex items-center text-xs font-semibold tracking-wide uppercase text-white/50 group-hover:text-white transition-colors">
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
};

export default Dashboard;
