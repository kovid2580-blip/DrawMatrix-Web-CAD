"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import ParticleBackground from "@/components/particle-background";
import { ensureLocalAccessProfile } from "@/lib/auth";

const Login = () => {
  const router = useRouter();

  useEffect(() => {
    ensureLocalAccessProfile();
    router.replace("/project-access");
  }, [router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      <ParticleBackground />

      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 blur-[120px] rounded-full animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-panel p-10 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl backdrop-blur-2xl text-center overflow-hidden group">
          {/* Hover Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          <div className="mb-10 relative">
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/20 mb-6"
            >
              <span className="text-white font-black text-4xl">D</span>
            </motion.div>

            <h1 className="text-4xl font-black tracking-tighter text-white mb-3">
              DRAWMATRIX
            </h1>
            <p className="text-blue-100/60 text-sm font-medium tracking-wide">
              Architectural Studio & Parametric Canvas
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">
                Entering Workspace
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
