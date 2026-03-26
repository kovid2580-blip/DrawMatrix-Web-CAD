/**
 * CAD ACTION DISPATCHER
 * Converts DrawCommand[] into ThreeObject instances and dispatches
 * them to the threeStore via addObject().
 */

import { ThreeObject, ThreeObjectType } from "@/store/threeStore";
import { DrawCommand } from "@/store/ai-store";

const generateId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

function commandToThreeObject(
  cmd: DrawCommand,
  layerId: string
): ThreeObject | null {
  switch (cmd.action) {
    case "create_wall": {
      const start = cmd.params.start as [number, number, number];
      const end = cmd.params.end as [number, number, number];
      const midX = (start[0] + end[0]) / 2;
      const midZ = (start[2] + end[2]) / 2;
      const dx = end[0] - start[0];
      const dz = end[2] - start[2];
      const length = Math.sqrt(dx * dx + dz * dz);

      // Angle with X-axis (where the box width naturally lies)
      const angle = -Math.atan2(dz, dx);

      // Convert angle to quaternion (rotation around Y axis)
      const sy = Math.sin(angle / 2);
      const cy = Math.cos(angle / 2);

      const materialColors: Record<string, string> = {
        concrete: "#4a4a4a",
        glass: "#a5f3fc",
        brick: "#b91c1c",
        timber: "#78350f",
        steel: "#334155",
      };

      const color = cmd.params.material
        ? materialColors[cmd.params.material.toLowerCase()] || "#404040"
        : "#404040";

      return {
        id: generateId(),
        type: "wall",
        layerId,
        transform: {
          position: [midX, (cmd.params.height || 2.8) / 2, midZ],
          rotation: [0, sy, 0, cy],
          scale: [1, 1, 1],
        },
        properties: {
          width: length,
          height: cmd.params.height || 2.8,
          thickness: cmd.params.thickness || 0.2,
          wallName: cmd.params.wallName,
          material: cmd.params.material,
          roomLabel: cmd.params.roomLabel,
        },
        color,
      };
    }

    case "create_rect":
    case "create_room": {
      // Room is represented as a group of walls; handled by design-intent-parser
      return null;
    }

    case "create_slab": {
      const labelColors: Record<string, string> = {
        garden: "#22c55e",
        pool: "#3b82f6",
        parking_lot: "#334155",
        fountain: "#0ea5e9",
      };

      const color = cmd.params.label
        ? labelColors[cmd.params.label.toLowerCase()] || "#8a8a8a"
        : "#8a8a8a";

      return {
        id: generateId(),
        type: "slab",
        layerId,
        transform: {
          position: [cmd.params.x || 0, 0, cmd.params.z || 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
        properties: {
          width: cmd.params.width || 5,
          depth: cmd.params.depth || 5,
          thickness: cmd.params.thickness || 0.15,
          label: cmd.params.label,
        },
        color,
      };
    }

    case "insert_door": {
      return {
        id: generateId(),
        type: "door",
        layerId,
        transform: {
          position: [cmd.params.x || 0, 1.05, cmd.params.z || 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
        properties: {
          width: cmd.params.width || 0.9,
          height: cmd.params.height || 2.1,
          wall: cmd.params.wall,
        },
        color: "#8B4513",
      };
    }

    case "insert_window": {
      return {
        id: generateId(),
        type: "window",
        layerId,
        transform: {
          position: [cmd.params.x || 0, 1.5, cmd.params.z || 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
        properties: {
          width: cmd.params.width || 1.2,
          height: cmd.params.height || 1.2,
          wall: cmd.params.wall,
        },
        color: "#87CEEB",
      };
    }

    case "create_stairs": {
      return {
        id: generateId(),
        type: "stairs",
        layerId,
        transform: {
          position: [cmd.params.x || 0, 0, cmd.params.z || 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
        properties: {
          stepCount: cmd.params.stepCount || 15,
          width: cmd.params.width || 1.0,
          riserHeight: cmd.params.riserHeight || 0.18,
          treadDepth: cmd.params.treadDepth || 0.28,
        },
        color: "#a0a0a0",
      };
    }

    case "create_column": {
      return {
        id: generateId(),
        type: "box",
        layerId,
        transform: {
          position: [
            cmd.params.x || 0,
            (cmd.params.height || 3) / 2,
            cmd.params.z || 0,
          ],
          rotation: [0, 0, 0, 1],
          scale: [
            cmd.params.width || 0.3,
            cmd.params.height || 3,
            cmd.params.depth || 0.3,
          ],
        },
        properties: {
          isColumn: true,
        },
        color: "#c0c0c0",
      };
    }

    case "create_roof": {
      return {
        id: generateId(),
        type: "roof",
        layerId,
        transform: {
          position: [cmd.params.x || 0, 2.8, cmd.params.z || 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
        properties: {
          width: cmd.params.width || 5,
          depth: cmd.params.depth || 5,
          pitch: cmd.params.pitch || 30,
        },
        color: "#8B0000",
      };
    }

    case "create_line": {
      return {
        id: generateId(),
        type: "line",
        layerId,
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
        properties: {
          start: cmd.params.start || [0, 0, 0],
          end: cmd.params.end || [5, 0, 0],
        },
        color: "#ffffff",
      };
    }

    case "create_circle": {
      return {
        id: generateId(),
        type: "circle",
        layerId,
        transform: {
          position: [cmd.params.x || 0, 0, cmd.params.z || 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
        },
        properties: {
          radius: cmd.params.radius || 2,
        },
        color: "#ffffff",
      };
    }

    default:
      console.warn(`Unknown CAD action: ${cmd.action}`);
      return null;
  }
}

/**
 * Convert an array of DrawCommands into ThreeObjects.
 * If NEXT_PUBLIC_CAD_ENGINE_URL is defined, this could be extended to
 * fetch objects from an external Colab-hosted engine.
 */
export function generateObjects(
  commands: DrawCommand[],
  layerId: string
): ThreeObject[] {
  const objects: ThreeObject[] = [];

  // Local Rule-Based Generation
  for (const cmd of commands) {
    const obj = commandToThreeObject(cmd, layerId);
    if (obj) objects.push(obj);
  }

  return objects;
}

/**
 * Example function to fetch from External Colab Engine
 */
export async function generateFromExternalEngine(
  prompt: string,
  layerId: string
): Promise<ThreeObject[]> {
  const engineUrl = process.env.NEXT_PUBLIC_CAD_ENGINE_URL;
  if (!engineUrl || engineUrl.includes("your-ngrok-url")) {
    console.warn("External CAD Engine URL not configured.");
    return [];
  }

  try {
    const response = await fetch(`${engineUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, layerId }),
    });
    const data = await response.json();
    return data.objects || [];
  } catch (err) {
    console.error("Failed to fetch from external CAD engine:", err);
    return [];
  }
}
