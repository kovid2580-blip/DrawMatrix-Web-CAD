"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Hexagon, Layers, Monitor, Zap } from "lucide-react";

import ParticleBackground from "@/components/particle-background";
import {
  clearAuthStorage,
  ensureLocalAccessProfile,
  getCurrentUserProfile,
} from "@/lib/auth";

const LandingPage = () => {
  const router = useRouter();
  const profile = getCurrentUserProfile();
  const hasLocalUser =
    profile.userId !== "guest" || profile.displayName !== "Guest User";

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans text-white selection:bg-cyan-500 selection:text-white bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400">
      <ParticleBackground />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-white/10 border-b border-white/20">
        <div
          className="flex items-center space-x-3 group cursor-pointer"
          onClick={() => router.push("/")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-cyan-400/50 transition-all duration-300 transform group-hover:scale-110">
            <Hexagon className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white">
            Draw Matrix
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-blue-100 tracking-wide"></div>

        <div className="flex items-center space-x-4">
          {hasLocalUser ? (
            <>
              <div className="text-white/80 px-4 py-2 text-sm font-bold flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-white/20 bg-cyan-500/20 flex items-center justify-center text-xs font-black">
                  {profile.displayName.charAt(0)}
                </div>
                <span>{profile.displayName}</span>
              </div>
              <button
                onClick={() => {
                  clearAuthStorage();
                  router.push("/");
                }}
                className="bg-gray-900/50 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200 border border-white/10"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  ensureLocalAccessProfile();
                  router.push("/project-access");
                }}
                className="text-white/80 hover:text-white px-4 py-2 text-sm font-bold transition-colors"
              >
                Enter
              </button>
              <button
                onClick={() => {
                  ensureLocalAccessProfile();
                  router.push("/project-access");
                }}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
              >
                Open Studio
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 pt-48 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">
              v2.0 Architectural Edition
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9] text-white/95">
            Design the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 animate-gradient bg-300% text-glow">
              Impossible.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100/70 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Draw Matrix is the next-generation architectural workspace.
            <br className="hidden md:block" />
            Zero-latency collaboration, infinite 3D canvas, and parametric
            modeling.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
            <button
              onClick={() => {
                ensureLocalAccessProfile();
                router.push("/project-access");
              }}
              className="w-full md:w-auto px-10 py-5 rounded-full bg-white text-gray-900 font-bold text-lg hover:bg-cyan-50 transition-all shadow-xl hover:shadow-cyan-400/20 flex items-center justify-center space-x-2 transform hover:-translate-y-1"
            >
              <span>{hasLocalUser ? "Launch Studio" : "Get Started"}</span>
              <ArrowRight size={20} />
            </button>

            <button
              onClick={() => {
                ensureLocalAccessProfile();
                router.push("/project-access");
              }}
              className="w-full md:w-auto px-10 py-5 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/20 font-bold text-lg hover:bg-black/40 transition-all flex items-center justify-center space-x-2"
            >
              <span>Enter Workspace</span>
            </button>
          </div>
        </motion.div>

        {/* Cinematic Stats */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4">
          <FeatureCard
            icon={<Zap size={32} className="text-cyan-400" />}
            title="Real-Time Engine"
            desc="Shared state synchronized via low-latency binary protocols for instant feedback."
          />
          <FeatureCard
            icon={<Layers size={32} className="text-blue-400" />}
            title="Parametric Design"
            desc="Advanced architectural primitives with auto-cutting openings and smart alignment."
          />
          <FeatureCard
            icon={<Monitor size={32} className="text-purple-400" />}
            title="Multi-Engine View"
            desc="Switch seamlessly between 2D drafting and cinematic 3D modeling modes."
          />
        </div>
      </main>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="glass-panel p-8 rounded-3xl text-left hover:-translate-y-2 transition-transform duration-300 bg-white/10 backdrop-blur-md border border-white/20">
    <div className="mb-6 p-4 bg-gray-50 rounded-2xl inline-block shadow-inner">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
    <p className="text-gray-200 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
