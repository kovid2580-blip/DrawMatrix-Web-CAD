/**
 * LAYOUT GENERATOR (STEP 3 & 8)
 * Arranges rooms logically using architectural adjacency rules and coordinate mapping.
 */

import { DrawCommand } from "@/store/ai-store";

import {
  ARCHITECTURAL_DEFAULTS,
  getRoomRequirements,
} from "./requirement-engine";

export interface RoomSpec {
  name: string;
  type: string;
  width: number;
  depth: number;
  x?: number;
  z?: number; // Using z for depth in 3D coordinate mapping
  hasDoor: boolean;
  hasWindow: boolean;
  windowCount: number;
}

// ── Step 8: Corridor Helper ──────────────────────────────────────────────────

function addCorridor(rooms: RoomSpec[]): RoomSpec[] {
  const corridorWidth = ARCHITECTURAL_DEFAULTS.corridor_width;
  const bedroomWidth = rooms
    .filter((r) => r.type === "bedroom")
    .reduce((sum, r) => sum + r.width, 0);

  if (bedroomWidth > 0) {
    rooms.push({
      name: "CORRIDOR",
      type: "corridor",
      width: bedroomWidth,
      depth: corridorWidth,
      hasDoor: false,
      hasWindow: false,
      windowCount: 0,
    });
  }
  return rooms;
}

// ── Apartment Templates ──────────────────────────────────────────────────────

function generate1BHK(): RoomSpec[] {
  const reqs = getRoomRequirements([
    "living_room",
    "bedroom",
    "kitchen",
    "bathroom",
  ]);
  return reqs.map((r) => ({
    ...r,
    name: r.type.replace("_", " ").toUpperCase(),
    hasDoor: true,
    hasWindow: r.type !== "bathroom",
    windowCount: 1,
  }));
}

function generate2BHK(): RoomSpec[] {
  const reqs = getRoomRequirements([
    "living_room",
    "bedroom",
    "bedroom",
    "kitchen",
    "bathroom",
  ]);
  const rooms = reqs.map((r, i) => ({
    ...r,
    name:
      r.type === "bedroom"
        ? `BEDROOM ${i + 1}`
        : r.type.replace("_", " ").toUpperCase(),
    hasDoor: true,
    hasWindow: r.type !== "bathroom",
    windowCount: r.type === "living_room" ? 2 : 1,
  }));
  return addCorridor(rooms);
}

function generate3BHK(): RoomSpec[] {
  const reqs = getRoomRequirements([
    "living_room",
    "bedroom",
    "bedroom",
    "bedroom",
    "kitchen",
    "bathroom",
    "bathroom",
  ]);
  let bedIdx = 1;
  let bathIdx = 1;
  const rooms = reqs.map((r) => {
    let name = r.type.replace("_", " ").toUpperCase();
    if (r.type === "bedroom") name = `BEDROOM ${bedIdx++}`;
    if (r.type === "bathroom") name = `BATHROOM ${bathIdx++}`;
    return {
      ...r,
      name,
      hasDoor: true,
      hasWindow: r.type !== "bathroom",
      windowCount: r.type === "living_room" ? 2 : 1,
    };
  });
  return addCorridor(rooms);
}

function generateOffice(): RoomSpec[] {
  const reqs = getRoomRequirements([
    "office",
    "office",
    "meeting_room",
    "kitchen",
    "bathroom",
  ]);
  return reqs.map((r, i) => ({
    ...r,
    name:
      r.type === "office"
        ? `OFFICE ${i + 1}`
        : r.type.replace("_", " ").toUpperCase(),
    hasDoor: true,
    hasWindow: true,
    windowCount: 2,
  }));
}

function generateHospital(): RoomSpec[] {
  const reqs = getRoomRequirements([
    "living_room",
    "bedroom",
    "bedroom",
    "bedroom",
    "bathroom",
  ]); // Mapping to hospital types via logic later or direct
  return reqs.map((r, i) => ({
    ...r,
    name: i === 0 ? "EMERGENCY" : i === 1 ? "ICU" : `WARD ${i - 1}`,
    hasDoor: true,
    hasWindow: i > 1,
    windowCount: 2,
  }));
}

function generateUrbanBlock(houseCount = 10): RoomSpec[] {
  const houses: RoomSpec[] = [];
  for (let i = 1; i <= (houseCount || 10); i++) {
    houses.push({
      name: `HOUSE ${i}`,
      type: "house",
      width: 8,
      depth: 10,
      hasDoor: true,
      hasWindow: true,
      windowCount: 4,
    });
  }
  return houses;
}

// ── Layout Algorithm (STEP 3: LAYOUT_GENERATOR) ──────────────────────────────

function layoutRooms(rooms: RoomSpec[]): RoomSpec[] {
  // 1. Categorize rooms into architectural zones
  const frontZone = rooms.filter((r) =>
    ["living_room", "kitchen", "reception", "entrance", "dining_room"].includes(
      r.type
    )
  );
  const backZone = rooms.filter((r) =>
    ["bedroom", "bathroom", "office", "ward", "icu", "meeting_room"].includes(
      r.type
    )
  );
  const corridor = rooms.find((r) => r.type === "corridor");
  const others = rooms.filter(
    (r) => !frontZone.includes(r) && !backZone.includes(r) && r !== corridor
  );

  // 2. Standardize Depths per row to ensure perfect adjacency
  const frontDepth =
    frontZone.length > 0 ? Math.max(...frontZone.map((r) => r.depth)) : 0;
  const backDepth =
    backZone.length > 0 ? Math.max(...backZone.map((r) => r.depth)) : 0;
  const corridorDepth = corridor ? corridor.depth : 0;

  frontZone.forEach((r) => (r.depth = frontDepth));
  backZone.forEach((r) => (r.depth = backDepth));

  // 3. Calculate Row Widths
  const frontWidth = frontZone.reduce((sum, r) => sum + r.width, 0);
  const backWidth = backZone.reduce((sum, r) => sum + r.width, 0);
  const maxWidth = Math.max(frontWidth, backWidth);

  // 4. Width Balancing (Scale rooms slightly to fit a perfect rectangle)
  if (frontZone.length > 0 && frontWidth < maxWidth) {
    const factor = maxWidth / frontWidth;
    frontZone.forEach((r) => (r.width *= factor));
  }
  if (backZone.length > 0 && backWidth < maxWidth) {
    const factor = maxWidth / backWidth;
    backZone.forEach((r) => (r.width *= factor));
  }
  if (corridor) {
    corridor.width = maxWidth;
  }

  // 5. coordinate Placement
  let currentZ = 0;

  // Place Front Row
  let currentX = 0;
  frontZone.forEach((r) => {
    r.x = currentX;
    r.z = currentZ;
    currentX += r.width;
  });

  // Place Corridor
  if (corridor) {
    currentZ += frontDepth;
    corridor.x = 0;
    corridor.z = currentZ;
    currentZ += corridorDepth;
  } else {
    currentZ += frontDepth;
  }

  // Place Back Row
  currentX = 0;
  backZone.forEach((r) => {
    r.x = currentX;
    r.z = currentZ;
    currentX += r.width;
  });

  // Place others (fallback) at the end
  currentZ += backDepth;
  currentX = 0;
  others.forEach((r) => {
    r.x = currentX;
    r.z = currentZ;
    currentX += r.width;
  });

  return rooms;
}

// ── CAD Integration Helper ──────────────────────────────────────────────────

export function specsToCommands(specs: RoomSpec[]): DrawCommand[] {
  const commands: DrawCommand[] = [];
  const wallH = ARCHITECTURAL_DEFAULTS.wall_height;
  const wallT = ARCHITECTURAL_DEFAULTS.wall_thickness;
  const createdWalls = new Set<string>();

  const getWallKey = (start: number[], end: number[]) => {
    const s = start.map((v) => Math.round(v * 100) / 100);
    const e = end.map((v) => Math.round(v * 100) / 100);
    // Sort to treat A->B same as B->A
    const coords = [s, e].sort((a, b) => a[0] - b[0] || a[2] - b[2]);
    return coords.flat().join(",");
  };

  for (const spec of specs) {
    const x = Math.round((spec.x ?? 0) * 100) / 100;
    const z = Math.round((spec.z ?? 0) * 100) / 100;
    const w = Math.round(spec.width * 100) / 100;
    const d = Math.round(spec.depth * 100) / 100;
    const label = spec.name;

    // Wall construction with corner capping
    // Horizontal walls (South/North) are full width
    // Vertical walls (East/West) are inset by wall thickness to avoid overlap in corners
    const walls = [
      { name: "south", start: [x, 0, z], end: [x + w, 0, z] },
      { name: "north", start: [x, 0, z + d], end: [x + w, 0, z + d] },
      { name: "west", start: [x, 0, z + wallT], end: [x, 0, z + d - wallT] },
      {
        name: "east",
        start: [x + w, 0, z + wallT],
        end: [x + w, 0, z + d - wallT],
      },
    ];

    for (const wall of walls) {
      const key = getWallKey(wall.start, wall.end);
      if (!createdWalls.has(key)) {
        commands.push({
          action: "create_wall",
          params: {
            start: wall.start,
            end: wall.end,
            height: wallH,
            thickness: wallT,
            wallName: wall.name,
            roomLabel: label,
          },
        });
        createdWalls.add(key);
      }
    }

    // Floor slab
    commands.push({
      action: "create_slab",
      params: {
        x: x + w / 2,
        z: z + d / 2,
        width: w,
        depth: d,
        thickness: 0.15,
        label: label,
      },
    });

    // Doors (Place at center of south wall)
    if (spec.hasDoor) {
      const isEntrance =
        label.toUpperCase().includes("LIVING") ||
        label.toUpperCase().includes("RECEPTION");
      commands.push({
        action: "insert_door",
        params: {
          x: x + w / 2,
          z: z,
          width: isEntrance
            ? ARCHITECTURAL_DEFAULTS.entrance_door_width
            : ARCHITECTURAL_DEFAULTS.room_door_width,
          height: 2.1,
          wall: "south",
        },
      });
    }

    // Windows (Place at center of north wall)
    if (spec.hasWindow) {
      const count = spec.windowCount || 1;
      const spacing = w / (count + 1);
      for (let i = 0; i < count; i++) {
        commands.push({
          action: "insert_window",
          params: {
            x: x + spacing * (i + 1),
            z: z + d,
            width: ARCHITECTURAL_DEFAULTS.standard_window_width,
            height: 1.2,
            wall: "north",
          },
        });
      }
    }
  }

  return commands;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function detectLayoutType(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  if (/\b(?:1\s*b(?:ed)?(?:room)?|1\s*bhk|studio)\b/i.test(lower))
    return "1bhk";
  if (/\b(?:2\s*b(?:ed)?(?:room)?|2\s*bhk|apartment|flat)\b/i.test(lower))
    return "2bhk";
  if (/\b(?:3\s*b(?:ed)?(?:room)?|3\s*bhk)\b/i.test(lower)) return "3bhk";
  if (/\b(?:office|workspace|conference|meeting)\b/i.test(lower))
    return "office";
  if (/\b(?:hospital|ward|icu|emergency)\b/i.test(lower)) return "hospital";
  if (/\b(?:urban|block|neighborhood)\b/i.test(lower)) return "urban_block";
  return null;
}

export function generateArchitecturalSpecs(
  layoutType: string,
  count?: number
): RoomSpec[] {
  switch (layoutType) {
    case "1bhk":
      return layoutRooms(generate1BHK());
    case "2bhk":
      return layoutRooms(generate2BHK());
    case "3bhk":
      return layoutRooms(generate3BHK());
    case "office":
      return layoutRooms(generateOffice());
    case "hospital":
      return layoutRooms(generateHospital());
    case "urban_block":
      return layoutRooms(generateUrbanBlock(count));
    default:
      return layoutRooms(generate2BHK());
  }
}

export function generateLayout(layoutType: string): DrawCommand[] {
  const specs = generateArchitecturalSpecs(layoutType);
  return specsToCommands(specs);
}
