"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import ParticleBackground from "@/components/particle-background";

const Login = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/project-access");
    } else if (status === "unauthenticated") {
      signIn("google", { callbackUrl: "/project-access" });
    }
  }, [status, router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-12 rounded-3xl w-full max-w-sm mx-4 relative z-10 bg-white/10 border border-white/20 shadow-2xl backdrop-blur-xl text-center"
      >
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-400/20">
              <span className="text-white font-black text-2xl">D</span>
            </div>
            <span className="text-3xl font-black tracking-tighter text-white">
              Draw Matrix
            </span>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">Redirecting to Google...</h2>
            <p className="text-blue-100/70 text-sm">
                Authenticating your session for a secure workspace.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 animate-pulse" />
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin relative z-10" />
            </div>
            
            <button 
                onClick={() => signIn("google", { callbackUrl: "/project-access" })}
                className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
            >
                Not redirecting? Click here
            </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
