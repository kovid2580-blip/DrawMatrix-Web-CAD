"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

import ParticleBackground from "@/components/particle-background";

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  useState(() => {
    // Check for auto-login on component mount
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("dm_auth_mock");
      if (isAuth === "true") {
        router.push("/project-info");
      }
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.email && formData.password) {
      // Simulate successful login
      if (typeof window !== "undefined") {
        localStorage.setItem("dm_auth_mock", "true");
        localStorage.setItem(
          "drawmatrix_display_name",
          formData.email.split("@")[0]
        );
      }
      router.push("/project-info");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400">
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-panel p-8 rounded-3xl w-full max-w-md mx-4 relative z-10 bg-white/10 border-white/20 shadow-2xl backdrop-blur-xl"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Draw Matrix
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-blue-100 mt-2">
            Sign in to continue your journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Log In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-200">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-white font-semibold hover:underline"
          >
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
