"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  Html,
  Line,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  TransformControls,
} from "@react-three/drei";
import * as THREE from "three";

import {
  DEFAULT_LAYER_ID,
  Layer,
  ThreeObject,
  ThreeObjectType,
  UserPresence,
  useThreeStore,
} from "@/store";
import { socket } from "@/lib/socket";
import { getCurrentUserProfile, getOrCreatePresenceKey } from "@/lib/auth";
import { GeometryEngine } from "@/lib/geometryEngine";
import { getLocalProjectById } from "@/lib/project-storage";
import { useAIStore } from "@/store/ai-store";

import { RemoteCursors } from "./remote-cursors";

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
type DraftingObjectProps = {
  obj: ThreeObject;
  layer?: Layer;
  isSelected: boolean;
  onClick: ClickHandler;
};

type CADObjectProps = {
  obj: ThreeObject;
  isSelected: boolean;
  onSelect: SelectHandler;
  setRef: React.Dispatch<React.SetStateAction<THREE.Mesh | null>>;
  activeTool: string;
};

type PresenceSocketPayload = UserPresence & {
  userId: string;
};

type SetTool = React.Dispatch<React.SetStateAction<string>>;
// eslint-disable-next-line no-unused-vars
type ClickHandler = (..._args: [ThreeEvent<MouseEvent>]) => void;
// eslint-disable-next-line no-unused-vars
type SelectHandler = (..._args: [string | null]) => void;

const DraftingObject = ({
  obj,
  layer,
  isSelected,
  onClick,
}: DraftingObjectProps) => {
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
        points={points}
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
  isSelected,
  onSelect,
  setRef,
  activeTool,
}: CADObjectProps) => {
  const layers = useThreeStore((s) => s.layers);
  const presences = useThreeStore((s) => s.presences);
  const isDragging = useThreeStore((s) => s.isDragging);

  // Architectural Special Handling (Parametric) - Moved to top level
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

  const layer = layers.find((l) => l.id === obj.layerId);
  if (layer && !layer.visible) return null;

  const isLocked = !!obj.lockedBy && obj.lockedBy !== USER_ID;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    if (isLocked || (layer && layer.locked)) return;
    onSelect(obj.id);
  };

  const position = new THREE.Vector3(...obj.transform.position);
  const quaternion = new THREE.Quaternion(...obj.transform.rotation);
  const scale = new THREE.Vector3(...obj.transform.scale);

  const lockingUser = obj.lockedBy
    ? Object.values(presences).find((p) => p.id === obj.lockedBy)
    : null;
  const lockColor = lockingUser?.color || "#444";

  const material = (
    <meshStandardMaterial
      color={
        isSelected
          ? "#ffcc00"
          : isLocked
            ? lockColor
            : layer?.color || obj.color
      }
      opacity={isLocked ? 0.6 : 1}
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

  const commonProps = {
    position: !isSelected || !isDragging ? position : undefined,
    quaternion: !isSelected || !isDragging ? quaternion : undefined,
    scale: !isSelected || !isDragging ? scale : undefined,
    onClick: handleClick,
    ref: (ref: THREE.Mesh | null) => isSelected && setRef(ref),
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

  if (obj.type === "text") {
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
        {isLocked && lockingUser && (
          <Html position={[0, (obj.properties.height || 1) + 0.5, 0]} center>
            <div
              className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xl flex items-center gap-1 border border-white/20"
              style={{ backgroundColor: lockColor }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Editing: {lockingUser.name}
            </div>
          </Html>
        )}
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
        {isLocked && lockingUser && (
          <Html position={[0, (obj.properties.height || 1) + 0.5, 0]} center>
            <div
              className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xl flex items-center gap-1 border border-white/20"
              style={{ backgroundColor: lockColor }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Editing: {lockingUser.name}
            </div>
          </Html>
        )}
      </mesh>
    );
  }

  // Render 3D Primitives (fallback for non-parametric)
  return (
    <mesh {...commonProps}>
      {obj.type === "box" && <boxGeometry />}
      {obj.type === "cylinder" && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
      {obj.type === "sphere" && <sphereGeometry args={[0.5, 32, 32]} />}
      {obj.type === "door" && <boxGeometry args={[0.9, 2.1, 0.1]} />}
      {obj.type === "window" && <boxGeometry args={[1.2, 1.2, 0.1]} />}
      {material}
      {isLocked && lockingUser && (
        <Html position={[0, 1.5, 0]} center>
          <div
            className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xl flex items-center gap-1 border border-white/20"
            style={{ backgroundColor: lockColor }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Editing: {lockingUser.name}
          </div>
        </Html>
      )}
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
  setTool: SetTool;
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
  const { camera } = useThree();
  const surfaceRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);
  const lastEmitRef = useRef(0);
  const lastPresenceEmitRef = useRef(0);

  // Update global isDragging state for components to see
  useEffect(() => {
    useThreeStore.setState({ isDragging });
  }, [isDragging]);

  // Keep drawing surface and light following the camera for "infinite" reach
  useFrame(() => {
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

  const { projectId, setObjects, setLayers } = useThreeStore();

  // STABILITY RULE: Operational WebSocket Listeners
  useEffect(() => {
    socket.connect();

    if (projectId) {
      const profile = getCurrentUserProfile();
      const currentColor =
        (typeof window !== "undefined" &&
          window.localStorage.getItem("drawmatrix_user_color")) ||
        USER_COLOR;
      socket.emit("join_project", {
        projectId,
        userId: profile.userId || USER_ID,
        username: profile.displayName || USER_NAME,
        email: profile.email || "",
        presenceKey: getOrCreatePresenceKey(),
        color: currentColor,
      });
    }

    socket.on("load_project", (data) => {
      const activeProjectId = useThreeStore.getState().projectId;
      const localProject = activeProjectId
        ? getLocalProjectById(activeProjectId)
        : null;

      if (localProject) {
        try {
          const parsed = JSON.parse(localProject.content);
          const localObjects = Array.isArray(parsed.objects)
            ? parsed.objects
            : [];
          const localLayers = Array.isArray(parsed.layers) ? parsed.layers : [];
          const remoteObjects = Array.isArray(data.objects) ? data.objects : [];
          const remoteLayers = Array.isArray(data.layers) ? data.layers : [];
          const remoteIsEmpty =
            remoteObjects.length === 0 && remoteLayers.length === 0;

          if (remoteIsEmpty && localObjects.length > 0) {
            setObjects(localObjects);
            if (localLayers.length > 0) {
              setLayers(localLayers);
            }
            useThreeStore.setState({
              projectName:
                localProject.name || data.projectName || "Untitled Sheet",
              activeLayerId: parsed.activeLayerId || DEFAULT_LAYER_ID,
            });
            useThreeStore.getState().resetHistory();
            return;
          }
        } catch (error) {
          console.error(
            "Failed to parse local project during socket load:",
            error
          );
        }
      }

      if (data.objects) setObjects(data.objects);
      if (data.layers) setLayers(data.layers);
      if (data.projectName) {
        useThreeStore.setState({ projectName: data.projectName });
      }
      useThreeStore.getState().resetHistory();
    });

    socket.on("create_object", ({ payload }) => {
      addObject(payload, { recordHistory: false });
    });
    socket.on("delete_object", ({ objectId }) => {
      deleteObject(objectId, { recordHistory: false });
    });
    socket.on("transform_object", ({ objectId, payload }) => {
      // Throttled logging to avoid console lag
      // console.log(`[Socket] Remote Transform: ${objectId}`);
      updateObject(
        objectId,
        { transform: payload.transform },
        { recordHistory: false }
      );
    });
    socket.on("update_property", ({ objectId, payload }) =>
      updateObject(
        objectId,
        { properties: payload.properties },
        { recordHistory: false }
      )
    );

    socket.on("presence-update", (data) =>
      updatePresence(data.userId, data.presence)
    );
    socket.on(
      "room_presence_list",
      (list: Record<string, PresenceSocketPayload>) => {
        Object.values(list).forEach((presence) => {
          updatePresence(presence.userId, presence);
        });
      }
    );
    socket.on("presence-disconnect", (userId) => removePresence(userId));
    socket.on("replace_geometry", ({ objectId, geometryData }) =>
      updateObject(objectId, { geometryData }, { recordHistory: false })
    );
    socket.on("lock_object", ({ objectId, userId }) =>
      updateObject(objectId, { lockedBy: userId }, { recordHistory: false })
    );
    socket.on("unlock_object", ({ objectId }) =>
      updateObject(objectId, { lockedBy: null }, { recordHistory: false })
    );
    socket.on("unlock_all_by_user", ({ userId }) => {
      useThreeStore.getState().objects.forEach((obj) => {
        if (obj.lockedBy === userId) {
          updateObject(obj.id, { lockedBy: null }, { recordHistory: false });
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [
    projectId,
    addObject,
    deleteObject,
    updateObject,
    updatePresence,
    removePresence,
    setObjects,
    setLayers,
  ]);

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
                typeof nearestWall.properties.width === "number"
                  ? nearestWall.properties.width
                  : 4,
                typeof nearestWall.properties.height === "number"
                  ? nearestWall.properties.height
                  : 2.5,
                typeof nearestWall.properties.thickness === "number"
                  ? nearestWall.properties.thickness
                  : 0.2
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
                projectId,
                objectId: nearestWall.id,
                geometryData,
                userId: USER_ID,
              });
            }
          }
        }

        // Throttled Socket Update for smooth collaboration
        const now = Date.now();
        if (isFinal || now - lastEmitRef.current > 30) {
          socket.emit("transform_object", {
            projectId,
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
    [selectedMesh, selectedObjectId, updateObject, objects, projectId]
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (activeTool === "select" || activeTool === "none" || cinematicMode)
        return;
      const pt = snap(e.point);
      setDrawingStart(pt);
      setCurrentPoint(pt);
    },
    [activeTool, snap, cinematicMode]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (cinematicMode) return;
      const pt = snap(e.point);
      setCurrentPoint(pt);
      useThreeStore.getState().setLocalCursor([pt.x, pt.y, pt.z]);

      // Presence Update - Throttled to 100ms
      const now = Date.now();
      if (now - lastPresenceEmitRef.current > 100) {
        const profile = getCurrentUserProfile();
        const currentColor =
          (typeof window !== "undefined" &&
            window.localStorage.getItem("drawmatrix_user_color")) ||
          USER_COLOR;
        socket.emit("presence-update", {
          projectId,
          userId: profile.userId || USER_ID,
          presence: {
            id: profile.userId || USER_ID,
            name: profile.displayName || USER_NAME,
            color: currentColor,
            cursor: [pt.x, pt.y, pt.z],
            cameraPosition: [
              camera.position.x,
              camera.position.y,
              camera.position.z,
            ],
            status: "online",
          },
        });
        lastPresenceEmitRef.current = now;
      }
    },
    [camera, snap, cinematicMode, projectId]
  );

  const handlePointerUp = useCallback(() => {
    if (!drawingStart || !currentPoint || cinematicMode) return;

    const userId =
      typeof window !== "undefined"
        ? window.localStorage.getItem("cad_user_id")
        : "guest";
    const props: ThreeObject["properties"] = {};
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
      type: activeTool as ThreeObjectType,
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
      projectId,
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
          typeof nearestWall.properties.width === "number"
            ? nearestWall.properties.width
            : 4,
          typeof nearestWall.properties.height === "number"
            ? nearestWall.properties.height
            : 2.5,
          typeof nearestWall.properties.thickness === "number"
            ? nearestWall.properties.thickness
            : 0.2
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
          projectId,
          objectId: nearestWall.id,
          geometryData,
          userId,
        });
      }
    }

    setDrawingStart(null);
    setCurrentPoint(null);
    setTool("select");
  }, [
    drawingStart,
    currentPoint,
    activeTool,
    activeLayerId,
    addObject,
    updateObject,
    objects,
    projectId,
    setTool,
    cinematicMode,
  ]);

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
            onMouseDown={() => {
              setIsDragging(true);
              socket.emit("lock_object", {
                projectId,
                objectId: selectedObjectId,
                userId: USER_ID,
              });
            }}
            onMouseUp={() => {
              setIsDragging(false);
              socket.emit("unlock_object", {
                projectId,
                objectId: selectedObjectId,
              });
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
            (activeTool === "select" || activeTool === "none") &&
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

const ThreeLayer = ({
  activeTool,
  setTool,
}: {
  activeTool: string;
  setTool: SetTool;
}) => {
  const {
    selectedObjectId,
    setSelectedObjectId,
    deleteObject,
    presences,
    viewMode,
    cinematicMode,
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
            position={[0, 20, 0]}
            zoom={40}
            rotation={[-Math.PI / 2, 0, 0]}
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
            {Object.values(presences).map((u: UserPresence) => (
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
};

export default ThreeLayer;
