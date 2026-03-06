"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#0b5cff", "#7c3aed", "#ffaa00", "#10b981"];
const MAX_DELTA_MS = 50; // cap delta to avoid "jump" after tab-out

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;

    interface Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      dx: number;
      dy: number;
    }

    let particles: Particle[] = [];

    const buildParticles = (w: number, h: number) => {
      // Reduce density slightly to stay comfortably under 60fps budget
      const count = Math.min(Math.floor((w * h) / 12000), 200);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 2 + 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
      }));
    };

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      buildParticles(w, h);
    };

    const animate = (now: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const rawDelta = now - lastTime;
      if (rawDelta < 16) return; // skip frame – already rendered within 16ms (~60fps)
      const delta = Math.min(rawDelta, MAX_DELTA_MS);
      lastTime = now;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.dx * (delta / 16.67); // normalise to 60fps speed
        p.y += p.dy * (delta / 16.67);

        if (p.x + p.radius > w || p.x - p.radius < 0) p.dx = -p.dx;
        if (p.y + p.radius > h || p.y - p.radius < 0) p.dy = -p.dy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    };

    window.addEventListener("resize", resize);
    resize();
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-50"
      style={{ willChange: "transform" }}
    />
  );
};

export default ParticleBackground;
