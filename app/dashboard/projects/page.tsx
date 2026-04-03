"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Clock, FileText, Loader2, Save } from "lucide-react";

import {
  deleteLocalProject,
  getLocalProjects,
  mergeProjectLists,
  normalizeProjectListPayload,
  renameLocalProject,
  StoredProject,
} from "@/lib/project-storage";

const ProjectsPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const loadLocalProjects = () => {
        setProjects(getLocalProjects());
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
          setProjects(mergeProjectLists(getLocalProjects(), cloudProjects));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Cloud fetch failed, falling back to local:", err);
      }

      loadLocalProjects();
    };

    fetchProjects();
  }, [session]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60)
      return `${diffInMins} minute${diffInMins === 1 ? "" : "s"} ago`;
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This will remove all drawing data, schedules, and messages permanently."
      )
    )
      return;

    deleteLocalProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    if (!session?.user?.email) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Cloud delete failed with status:", res.status);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleRename = async (
    e: React.MouseEvent,
    projectId: string,
    currentName: string
  ) => {
    e.stopPropagation();
    const newName = window.prompt("Enter new project name:", currentName);
    if (!newName || newName === currentName) return;

    renameLocalProject(projectId, newName);
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p))
    );

    if (!session?.user?.email) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        console.error("Cloud rename failed with status:", res.status);
      }
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto py-10">
        <div className="flex items-center gap-6 mb-12">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <Save size={32} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Saved Projects
            </h1>
            <p className="text-slate-400 mt-1">
              Manage and access your historical architectural drawings.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
            <p className="text-sm font-medium tracking-widest uppercase text-slate-500">
              Connecting to Cloud...
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
            <FileText size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500">
              No saved projects found. Start drawing to see them here.
            </p>
            <button
              onClick={() => router.push("/editor?new=true")}
              className="mt-6 px-6 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-sm font-bold rounded-xl border border-orange-500/30 transition-all"
            >
              Create New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="group p-6 border border-white/10 rounded-2xl bg-slate-900/50 hover:bg-slate-900 hover:border-orange-500/50 transition-all cursor-pointer relative overflow-hidden"
                onClick={() => router.push(`/editor?projectId=${p.id}`)}
              >
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => handleRename(e, p.id, p.name)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Rename"
                  >
                    <FileText size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, p.id)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                    title="Delete"
                  >
                    <Clock size={14} className="rotate-45" />
                  </button>
                </div>
                <div className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-2 opacity-70">
                  .dmx Drawing
                </div>
                <div className="text-xl font-bold text-white group-hover:text-orange-100 transition-colors uppercase truncate pr-16">
                  {p.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-4 font-medium tracking-tight">
                  <Clock size={12} />
                  <span>Edited {formatTimeAgo(p.lastModified)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
