"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, FileText, Save } from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("dm_projects");
    if (saved) {
      setProjects(
        JSON.parse(saved).sort(
          (a: any, b: any) =>
            new Date(b.lastModified).getTime() -
            new Date(a.lastModified).getTime()
        )
      );
    }
  }, []);

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

        {projects.length === 0 ? (
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
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Clock size={16} className="text-orange-400" />
                </div>
                <div className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-2 opacity-70">
                  .dmx Drawing
                </div>
                <div className="text-xl font-bold text-white group-hover:text-orange-100 transition-colors uppercase truncate pr-8">
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
}
