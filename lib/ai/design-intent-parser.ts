import { DrawCommand, ParsedEntity, ParsedPrompt } from "@/store/ai-store";

import { ARCHITECTURAL_DEFAULTS } from "./requirement-engine";
import {
  detectLayoutType,
  generateArchitecturalSpecs,
  RoomSpec,
  specsToCommands,
} from "./layout-generator";

// ── Fallback Individual Entity Dispatcher ────────────────────────────────────

function entityToCommands(
  entity: ParsedEntity,
  context: { offsetX: number; offsetZ: number }
): DrawCommand[] {
  const label = entity.label?.toLowerCase() || "";
  const type = entity.type;

  // Handle generic room types and specific room types
  const isRoomType = [
    "room",
    "rect",
    "bedroom",
    "master_bedroom",
    "living_room",
    "kitchen",
    "bathroom",
    "conference_room",
    "office_layout",
    "office",
    "meeting_room",
    "classroom",
    "ward",
    "icu",
  ].includes(type);

  if (isRoomType) {
    const spec: RoomSpec = {
      name: label || type.toUpperCase(),
      type: type,
      width: entity.dimensions.width || 5,
      depth: entity.dimensions.depth || 4,
      x: context.offsetX,
      z: context.offsetZ,
      hasDoor: true,
      hasWindow: type !== "bathroom",
      windowCount: entity.dimensions.count || 1,
    };
    return specsToCommands([spec]);
  }

  if (type === "stairs" || type === "staircase") {
    return [
      {
        action: "create_stairs",
        params: {
          x: context.offsetX,
          z: context.offsetZ,
          width: entity.dimensions.width || 1.0,
          stepCount: entity.dimensions.stepCount || 15,
        },
      },
    ];
  }

  if (type === "column" || type === "columns") {
    return [
      {
        action: "create_column",
        params: {
          x: context.offsetX,
          z: context.offsetZ,
          width: entity.dimensions.width || 0.3,
          depth: entity.dimensions.depth || 0.3,
          height: entity.dimensions.height || 3.0,
        },
      },
    ];
  }

  if (label.startsWith("material:")) {
    const mat = label.split(":")[1];
    return [
      { action: "create_wall", params: { material: mat, updateAll: true } },
      { action: "create_slab", params: { material: mat, updateAll: true } },
    ];
  }

  return [];
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseDesignIntent(parsed: ParsedPrompt): DrawCommand[] {
  // STEP 1-3: Identify Overall Layout
  const layoutType = detectLayoutType(parsed.rawPrompt);
  if (layoutType) {
    const houseCount = parsed.entities.find((e) => e.type === "building")
      ?.dimensions.count;
    const specs = generateArchitecturalSpecs(layoutType, houseCount);
    return specsToCommands(specs);
  }

  const allCommands: DrawCommand[] = [];
  const context = { offsetX: 0, offsetZ: 0 };
  for (const entity of parsed.entities) {
    const entityCommands = entityToCommands(entity, context);
    allCommands.push(...entityCommands);
    // Offset for next entity to avoid overlapping if multiple are specified
    if (entity.dimensions.width) {
      context.offsetX += entity.dimensions.width + 2;
    } else {
      context.offsetX += 7;
    }
  }
  return allCommands;
}
