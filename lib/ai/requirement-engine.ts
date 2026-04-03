/**
 * STEP 2: ROOM_REQUIREMENT_ENGINE
 * Assigns default architectural sizes to rooms and defines structural constants.
 */

export interface RoomRequirement {
  type: string;
  width: number;
  depth: number;
}

type RoomDefaults = {
  width: number;
  depth: number;
};

const ROOM_DEFAULTS: Record<string, RoomDefaults> = {
  living_room: { width: 5, depth: 4 },
  bedroom: { width: 4, depth: 3 },
  kitchen: { width: 3, depth: 3 },
  bathroom: { width: 2, depth: 2 },
  office: { width: 4, depth: 4 },
  meeting_room: { width: 5, depth: 4 },
  classroom: { width: 10, depth: 8 },
};

export const ARCHITECTURAL_DEFAULTS = {
  ...ROOM_DEFAULTS,
  corridor_width: 1.2,
  wall_thickness: 0.2,
  entrance_door_width: 1.2,
  room_door_width: 0.9,
  standard_window_width: 1.5,
  wall_height: 2.8,
};

export function getRoomRequirements(roomTypes: string[]): RoomRequirement[] {
  return roomTypes.map((type) => {
    const defaults = ROOM_DEFAULTS[type] ?? {
      width: 4,
      depth: 4,
    };
    return {
      type,
      width: defaults.width,
      depth: defaults.depth,
    };
  });
}
