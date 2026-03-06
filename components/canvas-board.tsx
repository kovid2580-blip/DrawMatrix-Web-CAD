"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { useMenuStore, useToolbarStore } from "@/store";
import { ACTION_MENU_ITEMS, ACTIVE_MENU_ITEMS } from "@/constants";

const CanvasBoard = () => {
  const { theme } = useTheme();

  const { activeMenuItem, actionMenuItem, setActionMenu } = useMenuStore();
  const { tools } = useToolbarStore();

  const { color, size } = tools[activeMenuItem];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldDraw = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const canvasHistory = useRef<ImageData[]>([]);
  const historyPosition = useRef(0);

  // rAF throttle refs
  const rafPendingRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    if (actionMenuItem === ACTION_MENU_ITEMS.DOWNLOAD) {
      const URL = canvas.toDataURL();

      ctx.fillStyle = theme === "dark" ? "#09090B" : "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const link = document.createElement("a");
      link.href = URL;
      link.download = `DRAWMATRIX-${Date.now()}.jpg`;
      link.click();
    } else if (
      actionMenuItem === ACTION_MENU_ITEMS.UNDO ||
      actionMenuItem === ACTION_MENU_ITEMS.REDO
    ) {
      if (
        historyPosition.current > 0 &&
        actionMenuItem === ACTION_MENU_ITEMS.UNDO
      ) {
        historyPosition.current--;
        ctx.putImageData(canvasHistory.current[historyPosition.current], 0, 0);
      }

      if (
        historyPosition.current < canvasHistory.current.length - 1 &&
        actionMenuItem === ACTION_MENU_ITEMS.REDO
      ) {
        historyPosition.current++;
        ctx.putImageData(canvasHistory.current[historyPosition.current], 0, 0);
      }
    } else if (actionMenuItem === ACTION_MENU_ITEMS.CLEAR) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      canvasHistory.current.push(imageData);
      historyPosition.current = canvasHistory.current.length - 1;
      ctx.putImageData(canvasHistory.current[historyPosition.current], 0, 0);

      setActionMenu(null);
    }

    setActionMenu(null);
  }, [actionMenuItem, setActionMenu, theme]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return;

    // Resize canvas with devicePixelRatio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
    };
    resize();

    // Pre-set ctx defaults for performance
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = size;

    const handleStartDrawing = (x: number, y: number) => {
      shouldDraw.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
      startX.current = x;
      startY.current = y;
    };

    // Core draw logic – called inside rAF
    const flushDraw = (x: number, y: number) => {
      if (!shouldDraw.current) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = size;

      if (canvasHistory.current.length > 0) {
        ctx.putImageData(canvasHistory.current[historyPosition.current], 0, 0);
      }

      if (activeMenuItem === ACTIVE_MENU_ITEMS.LINE) {
        ctx.beginPath();
        ctx.moveTo(startX.current, startY.current);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (activeMenuItem === ACTIVE_MENU_ITEMS.RECTANGLE) {
        const width = x - startX.current;
        const height = y - startY.current;
        ctx.strokeRect(startX.current, startY.current, width, height);
      } else if (activeMenuItem === ACTIVE_MENU_ITEMS.DIAMOND) {
        const width = x - startX.current;
        const height = y - startY.current;
        ctx.beginPath();
        ctx.moveTo(startX.current + width / 2, startY.current);
        ctx.lineTo(startX.current, startY.current + height / 2);
        ctx.lineTo(startX.current + width / 2, startY.current + height);
        ctx.lineTo(startX.current + width, startY.current + height / 2);
        ctx.closePath();
        ctx.stroke();
      } else if (activeMenuItem === ACTIVE_MENU_ITEMS.ELLIPSE) {
        const radiusX = Math.abs(x - startX.current);
        const radiusY = Math.abs(y - startY.current);
        ctx.beginPath();
        ctx.ellipse(
          startX.current,
          startY.current,
          radiusX,
          radiusY,
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
      } else {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    };

    const handleDrawing = (x: number, y: number) => {
      if (!shouldDraw.current) return;
      // Store latest pointer position and schedule a single rAF flush
      pendingMoveRef.current = { x, y };
      if (rafPendingRef.current === null) {
        rafPendingRef.current = requestAnimationFrame(() => {
          rafPendingRef.current = null;
          if (pendingMoveRef.current) {
            flushDraw(pendingMoveRef.current.x, pendingMoveRef.current.y);
            pendingMoveRef.current = null;
          }
        });
      }
    };

    const handleStopDrawing = () => {
      if (!shouldDraw.current) return;
      shouldDraw.current = false;
      // Flush any pending move
      if (rafPendingRef.current !== null) {
        cancelAnimationFrame(rafPendingRef.current);
        rafPendingRef.current = null;
      }
      if (pendingMoveRef.current) {
        flushDraw(pendingMoveRef.current.x, pendingMoveRef.current.y);
        pendingMoveRef.current = null;
      }
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvasHistory.current.push(imageData);
      historyPosition.current = canvasHistory.current.length - 1;
    };

    const handleMouseDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      handleStartDrawing(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: PointerEvent) => {
      handleDrawing(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: PointerEvent) => {
      handleStopDrawing();
    };

    // Unified pointer events (mouse + touch + stylus)
    canvas.addEventListener("pointerdown", handleMouseDown);
    canvas.addEventListener("pointermove", handleMouseMove);
    canvas.addEventListener("pointerup", handleMouseUp);
    canvas.addEventListener("pointercancel", handleMouseUp);

    return () => {
      if (rafPendingRef.current !== null) {
        cancelAnimationFrame(rafPendingRef.current);
        rafPendingRef.current = null;
      }
      canvas.removeEventListener("pointerdown", handleMouseDown);
      canvas.removeEventListener("pointermove", handleMouseMove);
      canvas.removeEventListener("pointerup", handleMouseUp);
      canvas.removeEventListener("pointercancel", handleMouseUp);
    };
  }, [activeMenuItem, color, size]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
  }, [color, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ touchAction: "none", willChange: "transform" }}
    />
  );
};

export default CanvasBoard;
