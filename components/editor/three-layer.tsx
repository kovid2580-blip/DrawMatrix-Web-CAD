"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  Html,
  Line,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  Text as Text3D,
  TransformControls,
} from "@react-three/drei";
import * as THREE from "three";

import { Layer, ThreeObject, useThreeStore } from "@/store";
import { socket } from "@/lib/socket";
import { GeometryEngine } from "@/lib/geometryEngine";
import { useAIStore } from "@/store/ai-store";

import { RemoteCursors } from "./remote-cursors";
import { CommentPin } from "./comment-pin";

const USER_ID =
  typeof window !== "undefined"
    ? window.localStorage.getItem("cad_user_id") ||
      Math.random().toString(36).substr(2, 9)
    : "guest";
if (typeof window !== "undefined")
  window.localStorage.setItem("cad_user_id", USER_ID);

const USER_COLOR = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
const USER_NAME = `Architect_${Math.floor(Math.random() * 1000)}`;

/**
 * 2D Primitive Renderer (Line, Circle, Arc etc.)
 */
const DraftingObject = ({ obj, layer, isSelected, onClick }: any) => {
  const points = useMemo(() => {
    switch (obj.type) {
      case "line":
        return [
          new THREE.Vector3(...(obj.properties.start || [0, 0, 0])),
          new THREE.Vector3(...(obj.properties.end || [1, 0, 1])),
        ];
      case "circle":
        const curve = new THREE.EllipseCurve(
          0,
          0,
          obj.properties.radius || 1,
          obj.properties.radius || 1,
          0,
          2 * Math.PI,
          false,
          0
        );
        return curve.getPoints(64).map((p) => new THREE.Vector3(p.x, 0, p.y));
      case "rect":
        const w = obj.properties.width || 1;
        const d = obj.properties.depth || obj.properties.height || 1;
        return [
          new THREE.Vector3(-w / 2, 0, -d / 2),
          new THREE.Vector3(w / 2, 0, -d / 2),
          new THREE.Vector3(w / 2, 0, d / 2),
          new THREE.Vector3(-w / 2, 0, d / 2),
          new THREE.Vector3(-w / 2, 0, -d / 2),
        ];
      case "arc":
        const arcCurve = new THREE.ArcCurve(
          0,
          0,
          obj.properties.radius || 1,
          0,
          Math.PI,
          false
        );
        return arcCurve
          .getPoints(32)
          .map((p) => new THREE.Vector3(p.x, 0, p.y));
      default:
        return [];
    }
  }, [obj]);

  if (points.length === 0) return null;

  return (
    <group
      position={obj.transform.position}
      quaternion={obj.transform.rotation}
      scale={obj.transform.scale}
      onClick={onClick}
    >
      <Line
        points={points as any}
        color={isSelected ? "#ffcc00" : layer?.color || "#ffffff"}
        lineWidth={2}
      />
    </group>
  );
};

/**
 * Main CAD Object Renderer
 */
const CADObject = ({
  obj,
  objects,
  isSelected,
  onSelect,
  setRef,
  activeTool,
}: any) => {
  const isLocked = !!obj.lockedBy && obj.lockedBy !== USER_ID;
  const layers = useThreeStore((s) => s.layers);
  const layer = layers.find((l) => l.id === obj.layerId);

  if (layer && !layer.visible) return null;

  const handleClick = (e: any) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    if (isLocked || (layer && layer.locked)) return;
    onSelect(obj.id);
  };

  const position = new THREE.Vector3(...obj.transform.position);
  const quaternion = new THREE.Quaternion(...obj.transform.rotation);
  const scale = new THREE.Vector3(...obj.transform.scale);

  const material = (
    <meshStandardMaterial
      color={
        isSelected ? "#ffcc00" : isLocked ? "#444" : layer?.color || obj.color
      }
      opacity={isLocked ? 0.5 : 1}
      transparent={isLocked}
      wireframe={isLocked && !isSelected}
      clippingPlanes={
        obj.properties.clippingEnabled
          ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.5)]
          : []
      }
      clipShadows={true}
    />
  );

  const isDragging = useThreeStore((s) => s.isDragging);

  const commonProps = {
    position: !isSelected || !isDragging ? position : undefined,
    quaternion: !isSelected || !isDragging ? quaternion : undefined,
    scale: !isSelected || !isDragging ? scale : undefined,
    onClick: handleClick,
    ref: (ref: any) => isSelected && setRef(ref),
    castShadow: true,
    receiveShadow: true,
  };

  // Check if it's a 2D Drafting object
  if (["line", "circle", "arc", "rect", "ellipse"].includes(obj.type)) {
    return (
      <DraftingObject
        obj={obj}
        layer={layer}
        isSelected={isSelected}
        onClick={handleClick}
      />
    );
  }

  // Architectural Special Handling (Parametric)
  const geometry = useMemo(() => {
    switch (obj.type) {
      case "wall":
        return GeometryEngine.createWall(
          obj.properties.width || 4,
          obj.properties.height || 2.5,
          obj.properties.thickness || 0.2
        );
      case "slab":
        return GeometryEngine.createSlab(
          obj.properties.width || 4,
          obj.properties.depth || 4,
          obj.properties.thickness || 0.2
        );
      case "stairs":
        return GeometryEngine.createStair(
          obj.properties.stepCount || 10,
          0.18,
          0.28,
          1.2
        );
      case "roof":
        return GeometryEngine.createRoof(
          obj.properties.width || 5,
          obj.properties.depth || 5,
          obj.properties.pitch || 30
        );
      case "dimension":
        const start = new THREE.Vector3(...(obj.properties.start || [0, 0, 0]));
        const end = new THREE.Vector3(...(obj.properties.end || [2, 0, 0]));
        return GeometryEngine.createDimensionLines(
          start,
          end,
          obj.properties.offset || 0.5
        );
      default:
        return null;
    }
  }, [obj.type, obj.properties]);

  if (obj.type === "text" || obj.type === "mtext") {
    return (
      <Html position={obj.transform.position} center>
        <div className="bg-black/50 backdrop-blur px-2 py-1 rounded text-white text-[10px] whitespace-nowrap border border-white/20 select-none">
          {obj.properties.text || "New Text"}
        </div>
      </Html>
    );
  }

  if (obj.type === "dimension") {
    const dist = new THREE.Vector3(...(obj.properties.start || [0, 0, 0]))
      .distanceTo(new THREE.Vector3(...(obj.properties.end || [2, 0, 0])))
      .toFixed(2);
    return (
      <group position={obj.transform.position}>
        <primitive object={geometry as object} attach="geometry" />
        <meshBasicMaterial
          color={isSelected ? "#ffcc00" : layer?.color || "#ffffff"}
        />
        <Html position={[1, 0.6, 0]} center>
          <div className="text-[10px] text-cyan-400 font-bold bg-black/80 px-1 rounded">
            {dist}m
          </div>
        </Html>
      </group>
    );
  }

  if (geometry) {
    return (
      <mesh {...commonProps}>
        <primitive
          object={
            (obj.geometryData
              ? new THREE.BufferGeometry().copy(JSON.parse(obj.geometryData))
              : geometry) as object
          }
          attach="geometry"
        />
        {material}
      </mesh>
    );
  }

  if (!obj.type) return null;

  // Render 3D Primitives (fallback for non-parametric)
  return (
    <mesh {...commonProps}>
      {obj.type === "box" && <boxGeometry />}
      {obj.type === "cylinder" && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
      {obj.type === "sphere" && <sphereGeometry args={[0.5, 32, 32]} />}
      {obj.type === "door" && <boxGeometry args={[0.9, 2.1, 0.1]} />}
      {obj.type === "window" && <boxGeometry args={[1.2, 1.2, 0.1]} />}
      {material}
    </mesh>
  );
};

const ThreeScene = ({
  transformMode,
  activeTool,
  setTool,
}: {
  transformMode: "translate" | "rotate" | "scale";
  activeTool: string;
  setTool: (tool: string) => void;
}) => {
  const {
    objects,
    selectedObjectId,
    setSelectedObjectId,
    updateObject,
    updatePresence,
    removePresence,
    addObject,
    deleteObject,
    viewMode,
    activeLayerId,
    gridSpacing,
    cinematicMode,
  } = useThreeStore();

  const [selectedMesh, setSelectedMesh] = useState<THREE.Mesh | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [drawingStart, setDrawingStart] = useState<THREE.Vector3 | null>(null);
  const [currentPoint, setCurrentPoint] = useState<THREE.Vector3 | null>(null);
  const { camera, gl, scene } = useThree();
  const surfaceRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const controlsRef = useRef<any>(null);
  const lastEmitRef = useRef(0);

  // Update global isDragging state for components to see
  useEffect(() => {
    useThreeStore.setState({ isDragging });
  }, [isDragging]);

  // Keep drawing surface and light following the camera for "infinite" reach
  useFrame((state) => {
    if (surfaceRef.current) {
      surfaceRef.current.position.x = camera.position.x;
      surfaceRef.current.position.z = camera.position.z;
    }
    if (lightRef.current) {
      lightRef.current.position.set(
        camera.position.x + 50,
        100,
        camera.position.z + 50
      );
      lightRef.current.target.position.set(
        camera.position.x,
        0,
        camera.position.z
      );
      lightRef.current.target.updateMatrixWorld();
    }

    // Cinematic Auto-Orbit
    if (cinematicMode && controlsRef.current) {
      const time = state.clock.getElapsedTime();
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 2.0;
      controlsRef.current.update();
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  });

  const snap = useCallback(
    (pt: THREE.Vector3) => {
      const s = gridSpacing || 1;
      return new THREE.Vector3(
        Math.round(pt.x / s) * s,
        Math.round(pt.y / s) * s,
        Math.round(pt.z / s) * s
      );
    },
    [gridSpacing]
  );

  // STABILITY RULE: Operational WebSocket Listeners
  useEffect(() => {
    socket.connect();

    socket.on("create_object", ({ payload }) => addObject(payload));
    socket.on("delete_object", ({ objectId }) => deleteObject(objectId));
    socket.on("transform_object", ({ objectId, payload }) =>
      updateObject(objectId, { transform: payload.transform })
    );
    socket.on("update_property", ({ objectId, payload }) =>
      updateObject(objectId, { properties: payload.properties })
    );

    socket.on("presence-update", (data) =>
      updatePresence(data.userId, data.presence)
    );
    socket.on("presence-disconnect", (userId) => removePresence(userId));
    socket.on("replace_geometry", ({ objectId, geometryData }) =>
      updateObject(objectId, { geometryData })
    );

    return () => {
      socket.disconnect();
    };
  }, [addObject, deleteObject, updateObject, updatePresence, removePresence]);

  // Cursor tracking
  const handleTransformChange = useCallback(
    (isFinal = false) => {
      if (selectedMesh && selectedObjectId) {
        const pos = selectedMesh.position;
        const quat = selectedMesh.quaternion;
        const sca = selectedMesh.scale;

        const transform = {
          position: [pos.x, pos.y, pos.z] as [number, number, number],
          rotation: [quat.x, quat.y, quat.z, quat.w] as [
            number,
            number,
            number,
            number,
          ],
          scale: [sca.x, sca.y, sca.z] as [number, number, number],
        };

        // Only update store on final mouse up to prevent state-fighting loops
        if (isFinal) {
          updateObject(selectedObjectId, { transform });

          // Architectural Logic: Auto-cut openings (only on final placement)
          const movingObj = objects.find((o) => o.id === selectedObjectId);
          if (
            movingObj &&
            (movingObj.type === "door" || movingObj.type === "window")
          ) {
            const nearestWall = objects.find(
              (o) =>
                o.type === "wall" &&
                new THREE.Vector3(...o.transform.position).distanceTo(pos) < 2
            );

            if (nearestWall) {
              const wallGeom = GeometryEngine.createWall(
                nearestWall.properties.width || 4,
                nearestWall.properties.height || 2.5,
                nearestWall.properties.thickness || 0.2
              );
              const openingGeom =
                movingObj.type === "door"
                  ? new THREE.BoxGeometry(0.9, 2.1, 0.4)
                  : new THREE.BoxGeometry(1.2, 1.2, 0.4);

              const resultGeom = GeometryEngine.cutOpeningInWall(
                wallGeom,
                nearestWall.transform.position,
                openingGeom,
                [pos.x, pos.y, pos.z]
              );

              const geometryData = JSON.stringify(resultGeom.toJSON());
              updateObject(nearestWall.id, { geometryData });
              socket.emit("replace_geometry", {
                objectId: nearestWall.id,
                geometryData,
                userId: USER_ID,
              });
            }
          }
        }

        // Throttled Socket Update for smooth collaboration
        const now = Date.now();
        if (isFinal || now - lastEmitRef.current > 50) {
          socket.emit("transform_object", {
            type: "transform_object",
            objectId: selectedObjectId,
            userId: USER_ID,
            timestamp: now,
            payload: { transform },
          });
          lastEmitRef.current = now;
        }
      }
    },
    [selectedMesh, selectedObjectId, updateObject, objects]
  );

  const handlePointerDown = useCallback(
    (e: any) => {
      if (
        activeTool === "select" ||
        (activeTool as any) === "none" ||
        cinematicMode
      )
        return;
      const pt = snap(e.point);
      setDrawingStart(pt);
      setCurrentPoint(pt);
    },
    [activeTool, snap, cinematicMode]
  );

  const handlePointerMove = useCallback(
    (e: any) => {
      if (cinematicMode) return;
      const pt = snap(e.point);
      setCurrentPoint(pt);
      useThreeStore.getState().setLocalCursor([pt.x, pt.y, pt.z]);

      // Presence Update
      socket.emit("presence-update", {
        userId: USER_ID,
        presence: {
          id: USER_ID,
          name: USER_NAME,
          color: USER_COLOR,
          cursor: [pt.x, pt.y, pt.z],
          cameraPosition: [
            camera.position.x,
            camera.position.y,
            camera.position.z,
          ],
        },
      });
    },
    [camera, snap, cinematicMode]
  );

  const handlePointerUp = useCallback(
    (e: any) => {
      if (!drawingStart || !currentPoint || cinematicMode) return;

      const userId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("cad_user_id")
          : "guest";
      const props: any = {};
      let pos: [number, number, number] = [
        drawingStart.x,
        drawingStart.y,
        drawingStart.z,
      ];

      if (activeTool === "line") {
        props.start = [0, 0, 0];
        props.end = [
          currentPoint.x - drawingStart.x,
          0,
          currentPoint.z - drawingStart.z,
        ];
      } else if (activeTool === "circle") {
        props.radius = drawingStart.distanceTo(currentPoint);
      } else if (
        activeTool === "box" ||
        activeTool === "wall" ||
        activeTool === "slab" ||
        activeTool === "rect"
      ) {
        props.width = Math.abs(currentPoint.x - drawingStart.x) || 1;
        props.depth = Math.abs(currentPoint.z - drawingStart.z) || 1;
        props.height = 2.5;
        props.thickness = 0.2;
        pos = [
          (drawingStart.x + currentPoint.x) / 2,
          0,
          (drawingStart.z + currentPoint.z) / 2,
        ];
      }

      const newObj: ThreeObject = {
        id: Math.random().toString(36).substr(2, 9),
        type: activeTool as any,
        layerId: activeLayerId,
        transform: {
          position: pos,
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
        properties: props,
        color: "#ffffff",
        lastModifiedBy: userId || "unknown",
      };

      addObject(newObj);
      socket.emit("create_object", {
        type: "create_object",
        objectId: newObj.id,
        userId,
        timestamp: Date.now(),
        payload: newObj,
      });

      // Architectural Logic for New Placement: Auto-cut openings
      if (newObj.type === "door" || newObj.type === "window") {
        const nearestWall = objects.find(
          (o) =>
            o.type === "wall" &&
            new THREE.Vector3(...o.transform.position).distanceTo(
              new THREE.Vector3(...pos)
            ) < 2
        );

        if (nearestWall) {
          const wallGeom = GeometryEngine.createWall(
            nearestWall.properties.width || 4,
            nearestWall.properties.height || 2.5,
            nearestWall.properties.thickness || 0.2
          );
          const openingGeom =
            newObj.type === "door"
              ? new THREE.BoxGeometry(0.9, 2.1, 0.4)
              : new THREE.BoxGeometry(1.2, 1.2, 0.4);

          const resultGeom = GeometryEngine.cutOpeningInWall(
            wallGeom,
            nearestWall.transform.position,
            openingGeom,
            pos
          );

          const geometryData = JSON.stringify(resultGeom.toJSON());
          updateObject(nearestWall.id, { geometryData });
          socket.emit("replace_geometry", {
            objectId: nearestWall.id,
            geometryData,
            userId,
          });
        }
      }

      setDrawingStart(null);
      setCurrentPoint(null);
      setTool("select");
    },
    [
      drawingStart,
      currentPoint,
      activeTool,
      activeLayerId,
      addObject,
      updateObject,
      objects,
      setTool,
      cinematicMode,
    ]
  );

  const localCursor = useThreeStore((s) => s.localCursor);

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight
        ref={lightRef}
        position={[50, 100, 50]}
        intensity={1.5}
        castShadow
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-mapSize={[2048, 2048]}
      />

      <Suspense fallback={null}>
        {/* Massive Drawing Surface that follows the camera */}
        <mesh
          ref={surfaceRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 0]}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          visible={!cinematicMode}
        >
          <planeGeometry args={[100000, 100000]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.4}
          scale={100}
          blur={2.5}
          far={4}
        />

        {/* Local Cursor Marker for Feedback */}
        {activeTool !== "select" && !cinematicMode && (
          <mesh position={localCursor}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="cyan" />
          </mesh>
        )}

        {objects.map((obj) => (
          <CADObject
            key={obj.id}
            obj={obj}
            objects={objects}
            isSelected={obj.id === selectedObjectId}
            onSelect={setSelectedObjectId}
            setRef={setSelectedMesh}
            activeTool={activeTool}
          />
        ))}

        {/* AI Preview Ghost Objects */}
        {useAIStore.getState().previewObjects.map((obj) => (
          <CADObject
            key={`preview-${obj.id}`}
            obj={{ ...obj, color: "#00ffff" }}
            objects={[]}
            isSelected={false}
            onSelect={() => {}}
            setRef={() => {}}
            activeTool="select"
          />
        ))}

        {/* Preview Object */}
        {drawingStart && currentPoint && !cinematicMode && (
          <mesh
            position={[
              (drawingStart.x + currentPoint.x) / 2,
              (drawingStart.y + currentPoint.y) / 2,
              (drawingStart.z + currentPoint.z) / 2,
            ]}
          >
            <boxGeometry
              args={[
                Math.abs(currentPoint.x - drawingStart.x) || 0.1,
                Math.abs(currentPoint.y - drawingStart.y) || 0.1,
                Math.abs(currentPoint.z - drawingStart.z) || 0.1,
              ]}
            />
            <meshBasicMaterial color="cyan" transparent opacity={0.3} />
          </mesh>
        )}

        {selectedMesh && selectedObjectId && !cinematicMode && (
          <TransformControls
            object={selectedMesh}
            mode={transformMode}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => {
              setIsDragging(false);
              handleTransformChange(true);
            }}
            onChange={() => {
              if (isDragging) handleTransformChange(false);
            }}
          />
        )}
        {!cinematicMode && <RemoteCursors />}
        <Grid
          infiniteGrid
          fadeDistance={10000}
          fadeStrength={cinematicMode ? 2 : 5}
          cellSize={1}
          sectionSize={5}
          sectionColor={cinematicMode ? "#333" : "#444"}
          cellColor={cinematicMode ? "#111" : "#222"}
          visible={!cinematicMode || viewMode === "2D"}
        />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={!cinematicMode && !isDragging}
          enableDamping={true}
          dampingFactor={0.05}
          screenSpacePanning={viewMode === "2D"}
          enableRotate={
            (activeTool === "select" || (activeTool as any) === "none") &&
            viewMode === "3D" &&
            !selectedMesh
          }
          enablePan={!selectedMesh}
        />
        <Environment preset="city" />
      </Suspense>
    </group>
  );
};

export default function ThreeLayer({
  activeTool,
  setTool,
}: {
  activeTool: string;
  setTool: (tool: string) => void;
}) {
  const {
    selectedObjectId,
    setSelectedObjectId,
    deleteObject,
    presences,
    viewMode,
    cinematicMode,
    setCinematicMode,
  } = useThreeStore();
  const [transformMode, setTransformMode] = useState<
    "translate" | "rotate" | "scale"
  >("translate");

  return (
    <div className="flex-1 bg-[#121214] relative overflow-hidden h-full">
      <Canvas
        shadows
        gl={{ antialias: true, localClippingEnabled: true }}
        onPointerMissed={() => setSelectedObjectId(null)}
      >
        {viewMode === "3D" ? (
          <PerspectiveCamera
            makeDefault
            position={[12, 12, 12]}
            fov={35}
            far={100000}
          />
        ) : (
          <OrthographicCamera
            makeDefault
            position={viewMode === "2D" ? [0, 20, 0] : [20, 0, 0]}
            zoom={40}
            rotation={
              viewMode === "2D" ? [-Math.PI / 2, 0, 0] : [0, Math.PI / 2, 0]
            }
            far={100000}
          />
        )}
        <ThreeScene
          transformMode={transformMode}
          activeTool={activeTool}
          setTool={setTool}
        />
      </Canvas>

      {/* CAD HUD */}
      <div
        className={`absolute top-4 left-4 flex flex-col space-y-3 pointer-events-none text-white font-mono transition-opacity duration-700 ${cinematicMode ? "opacity-0 invisible" : "opacity-100 visible"}`}
      >
        <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-lg border border-white/10 flex items-center gap-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${socket.connected ? "bg-cyan-500" : "bg-rose-500"}`}
            />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black italic">
              Matrix::Core
            </span>
          </div>
          <div className="flex -space-x-2 pointer-events-auto">
            {Object.values(presences).map((u: any) => (
              <div
                key={u.id}
                title={u.name}
                className="w-7 h-7 rounded-full border-2 border-[#121214] flex items-center justify-center text-[10px] font-black text-white"
                style={{ backgroundColor: u.color }}
              >
                {u.name[0]}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-1 pointer-events-auto">
          <div className="flex bg-zinc-900/90 p-1 rounded-lg border border-white/5 shadow-2xl backdrop-blur-md">
            {(["translate", "rotate", "scale"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTransformMode(mode)}
                className={`px-4 py-1.5 text-[10px] uppercase font-bold rounded-md ${transformMode === mode ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {mode === "translate" ? "Move" : mode}
              </button>
            ))}
          </div>
          {selectedObjectId && (
            <div className="flex space-x-1 pt-2">
              <button
                onClick={() => {
                  deleteObject(selectedObjectId);
                  socket.emit("delete_object", {
                    objectId: selectedObjectId,
                    userId: USER_ID,
                  });
                }}
                className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-[10px] text-rose-500 uppercase font-bold rounded-lg border border-rose-500/20 transition-all active:scale-95"
              >
                Discard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
