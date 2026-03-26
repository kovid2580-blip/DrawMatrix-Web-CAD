"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Box,
  Info,
  Layout,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

import ParticleBackground from "@/components/particle-background";

const ProjectInfoPage = () => {
  const router = useRouter();

  const features = [
    {
      icon: <Box className="w-8 h-8 text-cyan-400" />,
      title: "Advanced 3D Modeling",
      description:
        "Harness the power of parametric modeling. Design complex structures with real-time feedback and intelligent constraints.",
    },
    {
      icon: <Layout className="w-8 h-8 text-blue-400" />,
      title: "2D Drafting Precision",
      description:
        "Seamlessly transition between 3D visualization and precise 2D drafting for technical blueprints and floor plans.",
    },
    {
      icon: <Users className="w-8 h-8 text-purple-400" />,
      title: "Real-Time Collaboration",
      description:
        "Work together on a single project. See your team's cursors and changes instantly across the network.",
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: "Zero-Latency Performance",
      description:
        "Built for speed. Enjoy 60fps performance even with complex architectural designs and high-poly models.",
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400 font-sans text-white">
      <ParticleBackground />

      <main className="relative z-10 w-full max-w-5xl px-6 py-20 flex flex-col items-center">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-6">
            <Info size={16} className="text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-100">
              Project Overview
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-none">
            Welcome to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
              Draw Matrix Studio
            </span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100/70 max-w-2xl mx-auto leading-relaxed">
            The next generation of collaborative architectural design.
            Experience the future of drafting where precision meets real-time
            creativity.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-cyan-400/50 transition-all duration-300 group"
            >
              <div className="mb-6 p-4 bg-white/5 rounded-2xl inline-block group-hover:scale-110 transition-transform duration-300 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-blue-100/60 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Access Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <button
            onClick={() => router.push("/project-access")}
            className="group relative px-12 py-5 rounded-full bg-white text-blue-900 font-black text-xl hover:shadow-2xl hover:shadow-cyan-400/30 transition-all transform hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-300 group-hover:h-full group-hover:opacity-10" />
            <span className="relative flex items-center gap-3">
              Access Project <ArrowRight size={24} />
            </span>
          </button>

          <div className="flex items-center gap-2 text-blue-100/40 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={14} />
            <span>Project Security Active</span>
          </div>
        </motion.div>
      </main>

      {/* Decorative Technical Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
        <div className="absolute top-10 left-10 border-l border-t border-white w-20 h-20" />
        <div className="absolute top-10 right-10 border-r border-t border-white w-20 h-20" />
        <div className="absolute bottom-10 left-10 border-l border-bottom border-white w-20 h-20" />
        <div className="absolute bottom-10 right-10 border-r border-bottom border-white w-20 h-20" />
      </div>
    </div>
  );
};

export default ProjectInfoPage;
