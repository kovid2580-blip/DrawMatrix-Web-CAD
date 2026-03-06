"use client";

import React, { useEffect, useRef, useState } from "react";
import { Layer, Line, Rect, Stage } from "react-konva";
import {
  ArrowBigUp,
  Maximize,
  Minus,
  Move,
  Plus,
  RotateCw,
} from "lucide-react";

import { socket } from "@/lib/socket";

interface CanvasLayerProps {
  tool: string;
  setTool: (tool: string) => void;
}

export default function CanvasLayer({ tool, setTool }: CanvasLayerProps) {
  const stageRef = useRef<any>(null);
  const [shapes, setShapes] = useState<any[]>([]);
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Zoom/Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // rAF throttle for mousemove – avoid redundant renders mid-frame
  const rafMoveRef = useRef<number | null>(null);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    socket.connect();

    socket.on("draw-shape", (newShape: any) => {
      setShapes((prev) => [...prev, newShape]);
    });

    return () => {
      socket.off("draw-shape");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Prevent default browser scroll
    };

    // Add passive: false to allow preventDefault
    const stageContainer = stageRef.current?.container();
    if (stageContainer) {
      stageContainer.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (stageContainer) {
        stageContainer.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    setScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setPosition(newPos);
  };

  const handleMouseDown = (e: any) => {
    if (tool === "pan") return; // Handled by draggable prop

    const stage = e.target.getStage();
    const point = stage.getRelativePointerPosition();
    setIsDrawing(true);
    setStartPos(point);

    const id = `${socket.id}-${Date.now()}`;

    if (tool === "line") {
      setCurrentShape({
        id,
        type: "line",
        points: [point.x, point.y, point.x, point.y],
        stroke: "#fff",
        strokeWidth: 2,
      });
    } else if (tool === "rect") {
      setCurrentShape({
        id,
        type: "rect",
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        stroke: "#fff",
        strokeWidth: 2,
      });
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !currentShape) return;

    const stage = e.target.getStage();
    const point = stage.getRelativePointerPosition();

    // Store point and schedule one update per animation frame
    pendingPointRef.current = point;
    if (rafMoveRef.current === null) {
      rafMoveRef.current = requestAnimationFrame(() => {
        rafMoveRef.current = null;
        const p = pendingPointRef.current;
        if (!p) return;
        pendingPointRef.current = null;
        setCurrentShape((prev: any) => {
          if (!prev) return prev;
          if (tool === "line") {
            return { ...prev, points: [startPos.x, startPos.y, p.x, p.y] };
          } else if (tool === "rect") {
            return { ...prev, width: p.x - startPos.x, height: p.y - startPos.y };
          }
          return prev;
        });
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    // Cancel any pending rAF on mouse-up so we don't ghost a frame
    if (rafMoveRef.current !== null) {
      cancelAnimationFrame(rafMoveRef.current);
      rafMoveRef.current = null;
    }
    setIsDrawing(false);
    if (currentShape) {
      setShapes((prev) => [...prev, currentShape]);
      socket.emit("draw-shape", currentShape);
      setCurrentShape(null);
    }
  };

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Safe window access for Next.js SSR
    setDimensions({ width: window.innerWidth, height: window.innerHeight });

    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (dimensions.width === 0) return null; // Wait for mount

  return (
    <div className="flex-1 bg-[#212223] relative cursor-crosshair overflow-hidden h-full">
      {/* CAD Grid Background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>

      <Stage
        width={dimensions.width - 300} // Adjust for panels
        height={dimensions.height - 150} // Adjust for bars
        draggable={tool === "pan"}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {/* Mock 3D Isometric Structure (Fire Station) */}
          <Line
            points={[100, 300, 300, 400, 300, 200, 100, 100]}
            closed
            stroke="#00FFFF"
            strokeWidth={2}
          />
          {/* Left Wall */}
          <Line
            points={[300, 400, 600, 300, 600, 100, 300, 200]}
            closed
            stroke="#FFFF00"
            strokeWidth={2}
          />
          {/* Front Wall */}
          <Line
            points={[100, 100, 300, 200, 600, 100, 400, 0]}
            closed
            stroke="#FF00FF"
            strokeWidth={2}
          />
          {/* Roof */}
          {/* Windows */}
          <Rect
            x={350}
            y={250}
            width={40}
            height={60}
            stroke="#00FF00"
            strokeWidth={1}
            rotation={-15}
            skewX={-0.2}
          />
          <Rect
            x={450}
            y={220}
            width={40}
            height={60}
            stroke="#00FF00"
            strokeWidth={1}
            rotation={-15}
            skewX={-0.2}
          />
          {/* Garage Door */}
          <Line
            points={[520, 280, 580, 260, 580, 150, 520, 170]}
            closed
            stroke="#FFA500"
            strokeWidth={2}
          />
          {shapes.map((shape) => {
            if (shape.type === "line") {
              return (
                <Line
                  key={shape.id}
                  points={shape.points}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth / scale}
                  lineCap="round"
                  lineJoin="round"
                />
              );
            } else if (shape.type === "rect") {
              return (
                <Rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth / scale}
                />
              );
            }
            return null;
          })}
          {currentShape &&
            (currentShape.type === "line" ? (
              <Line
                points={currentShape.points}
                stroke={currentShape.stroke}
                strokeWidth={currentShape.strokeWidth / scale}
                lineCap="round"
                lineJoin="round"
              />
            ) : (
              <Rect
                x={currentShape.x}
                y={currentShape.y}
                width={currentShape.width}
                height={currentShape.height}
                stroke={currentShape.stroke}
                strokeWidth={currentShape.strokeWidth / scale}
              />
            ))}
        </Layer>
      </Stage>

      {/* View Cube */}
      <div className="absolute top-4 right-4 w-28 h-28 pointer-events-none opacity-90 transition-opacity hover:opacity-100">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          <path
            d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z"
            fill="#2b2d30"
            stroke="#666"
            strokeWidth="1"
          />
          <path d="M50 50 L90 30" stroke="#666" strokeWidth="1" />
          <path d="M50 50 L10 30" stroke="#666" strokeWidth="1" />
          <path d="M50 50 L50 90" stroke="#666" strokeWidth="1" />
          <text
            x="50"
            y="28"
            textAnchor="middle"
            fill="#ccc"
            fontSize="8"
            fontWeight="bold"
          >
            TOP
          </text>
          <text
            x="25"
            y="65"
            textAnchor="middle"
            fill="#ccc"
            fontSize="8"
            fontWeight="bold"
            transform="rotate(-30 25,65)"
          >
            LEFT
          </text>
          <text
            x="75"
            y="65"
            textAnchor="middle"
            fill="#ccc"
            fontSize="8"
            fontWeight="bold"
            transform="rotate(30 75,65)"
          >
            RIGHT
          </text>
          {/* Compass Ring */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#444"
            strokeWidth="4"
            strokeDasharray="10 5"
            opacity="0.5"
          />
          <text x="50" y="8" textAnchor="middle" fill="#888" fontSize="6">
            N
          </text>
          <text x="50" y="96" textAnchor="middle" fill="#888" fontSize="6">
            S
          </text>
          <text x="94" y="52" textAnchor="middle" fill="#888" fontSize="6">
            E
          </text>
          <text x="6" y="52" textAnchor="middle" fill="#888" fontSize="6">
            W
          </text>
        </svg>
      </div>

      {/* UCS Icon */}
      <div className="absolute bottom-12 left-12 w-12 h-12 pointer-events-none">
        <svg viewBox="0 0 50 50" className="w-full h-full">
          <line
            x1="5"
            y1="45"
            x2="45"
            y2="45"
            stroke="#ff0000"
            strokeWidth="2"
          />{" "}
          {/* X Axis */}
          <line
            x1="5"
            y1="45"
            x2="5"
            y2="5"
            stroke="#00ff00"
            strokeWidth="2"
          />{" "}
          {/* Y Axis */}
          <text x="45" y="42" fill="#ff0000" fontSize="10" fontWeight="bold">
            X
          </text>
          <text x="8" y="10" fill="#00ff00" fontSize="10" fontWeight="bold">
            Y
          </text>
          <rect x="3" y="43" width="4" height="4" fill="#333" />
        </svg>
      </div>

      {/* Navigation Bar (Right Side) */}
      <div className="absolute top-36 right-4 flex flex-col bg-[#2b2d30]/90 rounded-lg shadow-lg border border-gray-700 overflow-hidden pointer-events-auto">
        <button
          className="p-2 hover:bg-gray-600 text-gray-300"
          title="Full Navigation Wheel"
        >
          <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>
        </button>
        <button className="p-2 hover:bg-gray-600 text-gray-300" title="Pan">
          <Move size={18} />
        </button>
        <button
          className="p-2 hover:bg-gray-600 text-gray-300"
          title="Zoom Extents"
        >
          <Maximize size={18} />
        </button>
        <button className="p-2 hover:bg-gray-600 text-gray-300" title="Orbit">
          <RotateCw size={18} />
        </button>
      </div>

      {/* Layout Tabs */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#2b2d30] flex items-center px-1 border-t border-black pointer-events-auto">
        <button className="px-3 py-1 bg-[#404246] text-white text-xs font-medium border-t-2 border-green-500">
          Model
        </button>
        <button className="px-3 py-1 text-gray-400 hover:bg-[#35373a] text-xs">
          Layout1
        </button>
        <button className="px-3 py-1 text-gray-400 hover:bg-[#35373a] text-xs">
          Layout2
        </button>
        <button className="px-2 text-gray-400 hover:text-white">
          <Plus size={12} />
        </button>
      </div>

      {/* Command Line */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-1/2 bg-[#2b2d30]/90 backdrop-blur-sm border border-gray-600 shadow-xl rounded flex flex-col text-gray-300 font-mono text-xs pointer-events-auto">
        <div className="h-6 px-2 flex items-center border-b border-gray-700 opacity-50 text-[10px]">
          <span className="mr-auto">Command Line</span>
          <button className="hover:text-white">
            <Minus size={10} />
          </button>
        </div>
        <div className="p-2 h-16 overflow-y-auto">
          <div className="text-gray-500">Type a command</div>
          <div className="flex items-center">
            <span className="text-gray-400 mr-2">Command:</span>
            <input
              type="text"
              className="bg-transparent border-none outline-none text-white w-full"
              autoFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
}
