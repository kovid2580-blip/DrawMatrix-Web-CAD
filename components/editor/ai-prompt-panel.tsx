"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Eye,
  Loader2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import {
  generateFromExternalEngine,
  generateObjects,
} from "@/lib/ai/cad-dispatcher";
import { parseDesignIntent } from "@/lib/ai/design-intent-parser";
import { detectLayoutType, generateLayout } from "@/lib/ai/layout-generator";
import { interpretPrompt } from "@/lib/ai/prompt-interpreter";
import { validateAndCorrect } from "@/lib/ai/rule-engine";
import { socket, USER_ID } from "@/lib/socket";
import { useAIStore } from "@/store/ai-store";
import { useThreeStore } from "@/store/threeStore";

const EXAMPLE_PROMPTS = [
  "Draw a 10m x 8m living room with two windows on the north wall",
  "Create a staircase with 15 steps and 1m width",
  "Generate a 2 bedroom apartment layout",
  "Draw a rectangular building footprint 20m by 12m",
  "Add four columns spaced evenly",
  "Create a 3BHK apartment floor plan",
  "Draw a wall 6m wide and 3m tall",
  "Create an office layout",
];

type PromptHistoryItem = {
  prompt: string;
  timestamp: number;
};

export const AIPromptPanel = () => {
  const {
    isOpen,
    currentPrompt,
    promptHistory,
    previewObjects,
    isProcessing,
    setPrompt,
    setProcessing,
    setParsedResult,
    setDrawCommands,
    setPreviewObjects,
    addToHistory,
    addToConversation,
    clearPreview,
    clearAll,
    setOpen,
  } = useAIStore();

  const { addObject, activeLayerId, pushHistory, projectId } = useThreeStore();

  const [showHistory, setShowHistory] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ── Pipeline Execution ───────────────────────────────────────────────

  const executePrompt = useCallback(
    async (mode: "generate" | "preview") => {
      const prompt = currentPrompt.trim();
      if (!prompt || isProcessing) return;

      setProcessing(true);
      setWarnings([]);
      setShowExamples(false);

      try {
        addToHistory(prompt);
        addToConversation(prompt);

        let drawCommands;

        // Check if it's a layout request first
        const layoutType = detectLayoutType(prompt);
        if (layoutType) {
          drawCommands = generateLayout(layoutType);
        } else {
          // Standard prompt pipeline
          const parsed = interpretPrompt(prompt);
          setParsedResult(parsed);
          drawCommands = parseDesignIntent(parsed);
        }

        // Validate against architectural rules
        const validation = validateAndCorrect(drawCommands);
        if (validation.warnings.length > 0) {
          setWarnings(validation.warnings);
        }
        drawCommands = validation.correctedCommands;
        setDrawCommands(drawCommands);

        // Generate ThreeObjects
        let objects;
        const engineUrl = process.env.NEXT_PUBLIC_CAD_ENGINE_URL;

        if (engineUrl) {
          // Try external engine (Colab) first
          objects = await generateFromExternalEngine(prompt, activeLayerId);
          if (objects.length === 0) {
            // Fallback to local dispatcher
            objects = generateObjects(drawCommands, activeLayerId);
          }
        } else {
          // Local-only generation
          objects = generateObjects(drawCommands, activeLayerId);
        }

        if (mode === "preview") {
          setPreviewObjects(objects);
        } else {
          // Commit directly
          pushHistory();
          for (const obj of objects) {
            addObject(obj);
            // Sync to cloud
            socket.emit("create_object", {
              projectId,
              type: "create_object",
              objectId: obj.id,
              userId: USER_ID,
              timestamp: Date.now(),
              payload: obj,
            });
          }
          clearPreview();
          setPrompt("");
        }
      } catch (err) {
        console.error("AI Pipeline error:", err);
        setWarnings([
          "Failed to process prompt. Please try a different description.",
        ]);
      } finally {
        setProcessing(false);
      }
    },
    [
      currentPrompt,
      isProcessing,
      activeLayerId,
      addObject,
      pushHistory,
      setProcessing,
      setParsedResult,
      setDrawCommands,
      setPreviewObjects,
      addToHistory,
      addToConversation,
      clearPreview,
      projectId,
      setPrompt,
    ]
  );

  const acceptPreview = useCallback(() => {
    pushHistory();
    for (const obj of previewObjects) {
      addObject(obj);
      // Sync to cloud
      socket.emit("create_object", {
        projectId,
        type: "create_object",
        objectId: obj.id,
        userId: USER_ID,
        timestamp: Date.now(),
        payload: obj,
      });
    }
    clearPreview();
    setPrompt("");
    setWarnings([]);
  }, [
    previewObjects,
    addObject,
    pushHistory,
    clearPreview,
    setPrompt,
    setWarnings,
    projectId,
  ]);

  const rejectPreview = useCallback(() => {
    clearPreview();
    setWarnings([]);
  }, [clearPreview]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        executePrompt("generate");
      }
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        executePrompt("preview");
      }
    },
    [executePrompt]
  );

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-[#1a1c1e]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-cyan-500/5 overflow-hidden">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              AI Drawing Assistant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-gray-500 hover:text-white transition-colors p-1"
              title="Prompt History"
            >
              <Clock size={14} />
            </button>
            <button
              onClick={() => {
                clearAll();
                setOpen(false);
              }}
              className="text-gray-500 hover:text-white transition-colors p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Prompt History Dropdown ──────────────────────────── */}
        {showHistory && promptHistory.length > 0 && (
          <div className="max-h-32 overflow-y-auto border-b border-white/5 bg-black/30">
            {promptHistory.map((item: PromptHistoryItem, i: number) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(item.prompt);
                  setShowHistory(false);
                }}
                className="w-full text-left px-4 py-2 text-[11px] text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
              >
                <Clock size={10} className="opacity-50 flex-shrink-0" />
                <span className="truncate">{item.prompt}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Example Prompts ─────────────────────────────────── */}
        {showExamples && !currentPrompt && (
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-bold">
              Try these prompts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.slice(0, 4).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all border border-white/5 hover:border-cyan-500/20"
                >
                  {ex.length > 40 ? ex.slice(0, 40) + "…" : ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Warnings ────────────────────────────────────────── */}
        {warnings.length > 0 && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
            {warnings.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[10px] text-amber-400"
              >
                <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Preview Controls ────────────────────────────────── */}
        {previewObjects.length > 0 && (
          <div className="px-4 py-2.5 bg-cyan-500/5 border-b border-cyan-500/20 flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              Preview: {previewObjects.length} objects generated
            </span>
            <div className="flex gap-2">
              <button
                onClick={acceptPreview}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-[10px] font-bold uppercase hover:bg-green-500/30 transition-all border border-green-500/20"
              >
                <Check size={10} /> Accept
              </button>
              <button
                onClick={rejectPreview}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase hover:bg-rose-500/30 transition-all border border-rose-500/20"
              >
                <X size={10} /> Reject
              </button>
            </div>
          </div>
        )}

        {/* ── Input Area ──────────────────────────────────────── */}
        <div className="flex items-end gap-2 px-4 py-3">
          <textarea
            ref={inputRef}
            value={currentPrompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to draw..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none resize-none leading-relaxed max-h-24"
            disabled={isProcessing}
          />
          <div className="flex gap-1.5 flex-shrink-0 pb-0.5">
            <button
              onClick={() => executePrompt("preview")}
              disabled={!currentPrompt.trim() || isProcessing}
              title="Preview (Shift+Enter)"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-[10px] font-bold uppercase disabled:opacity-30 hover:bg-white/10 hover:text-white transition-all border border-white/5"
            >
              {isProcessing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Eye size={12} />
              )}
              Preview
            </button>
            <button
              onClick={() => executePrompt("generate")}
              disabled={!currentPrompt.trim() || isProcessing}
              title="Generate (Enter)"
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[10px] font-bold uppercase disabled:opacity-30 hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
            >
              {isProcessing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Wand2 size={12} />
              )}
              Generate
            </button>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="px-4 py-1.5 border-t border-white/5 flex items-center justify-between">
          <span className="text-[9px] text-gray-600">
            Enter to generate · Shift+Enter to preview · Esc to close
          </span>
          <span className="text-[9px] text-gray-600">DrawMatrix AI v1.0</span>
        </div>
      </div>
    </div>
  );
};
