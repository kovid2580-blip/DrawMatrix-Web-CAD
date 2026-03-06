"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Key, Hash, ArrowRight, Lock } from "lucide-react";
import ParticleBackground from "@/components/particle-background";

const ProjectAccessPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        projectId: "",
        password: "",
    });
    const [isError, setIsError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Permanent ID validation (Multiple Allowed)
        const isValid =
            (formData.projectId === "1234567890" && formData.password === "test1") ||
            (formData.projectId === "8008411819" && formData.password === "test2");

        if (isValid) {
            router.push("/dashboard");
        } else {
            setIsError(true);
            setTimeout(() => setIsError(false), 2000);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400 font-sans text-white">
            <ParticleBackground />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="glass-panel p-10 rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg mx-auto mb-6">
                            <Shield className="text-white w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">Security Verification</h2>
                        <p className="text-blue-100/60 text-sm">
                            Enter project credentials to gain access.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">
                                Project ID
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-cyan-400 transition-colors">
                                    <Hash size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. DM-990-ALPHA"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10 outline-none transition-all font-mono text-sm placeholder:text-white/20"
                                    value={formData.projectId}
                                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 ml-1">
                                Access Password
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-cyan-400 transition-colors">
                                    <Key size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10 outline-none transition-all font-mono text-sm placeholder:text-white/20"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 ${isError
                                ? "bg-rose-500 text-white"
                                : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-cyan-500/20"
                                }`}
                        >
                            {isError ? (
                                "Invalid Credentials"
                            ) : (
                                <>
                                    Connect to Engine <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Info */}
                    <div className="mt-8 pt-8 border-t border-white/10 text-center">
                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            <Lock size={12} />
                            <span>AES-256 Encrypted Connection</span>
                        </div>
                    </div>
                </div>

                {/* Floating Technical Elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full" />
            </motion.div>
        </div>
    );
};

export default ProjectAccessPage;
