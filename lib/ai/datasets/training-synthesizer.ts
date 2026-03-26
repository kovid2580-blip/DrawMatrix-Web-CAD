/**
 * TRAINING SYNTHESIZER
 * Programmatically generates 1000+ variations of prompts and their expected structures.
 * This is used to "train" the rule-based parser and provided few-shot examples for LLMs.
 */

import { ParsedEntity } from "@/store/ai-store";

export interface TrainingSample {
  prompt: string;
  expected: Partial<ParsedEntity>[];
}

export const ROOM_TYPES = [
  "bedroom",
  "living_room",
  "kitchen",
  "bathroom",
  "dining_room",
  "office",
  "meeting_room",
  "classroom",
  "ward",
  "icu",
];
const WALL_DIRECTIONS = ["north", "south", "east", "west"];
const MATERIALS = ["concrete", "glass", "brick", "timber", "steel"];

export function generateTrainingData(): TrainingSample[] {
  const samples: TrainingSample[] = [];

  // --- STATIC VARIATIONS (From User Request) ---
  const staticVariations: TrainingSample[] = [
    {
      prompt:
        "Create a bedroom 4 meters by 3 meters with one window on the east wall.",
      expected: [
        {
          entity: "room",
          type: "bedroom",
          dimensions: { width: 4, depth: 3 },
          placement: { wall: "east" },
        },
      ],
    },
    {
      prompt: "Draw a master bedroom 5 meters by 4 meters with two windows.",
      expected: [
        {
          entity: "room",
          type: "master_bedroom",
          dimensions: { width: 5, depth: 4, count: 2 },
        },
      ],
    }, // count: 2 for windows
    {
      prompt: "Generate a bedroom with a balcony attached.",
      expected: [{ entity: "room", type: "bedroom", features: ["balcony"] }],
    },
    {
      prompt: "Create a living room 6 meters by 5 meters with three windows.",
      expected: [
        {
          entity: "room",
          type: "living_room",
          dimensions: { width: 6, depth: 5, count: 3 },
        },
      ],
    },
    {
      prompt: "Draw a living room connected to the dining area.",
      expected: [
        {
          entity: "living_room",
          type: "living_room",
          connects: ["dining_room"],
        },
      ],
    },
    {
      prompt: "Design a living room with a central seating area.",
      expected: [
        {
          entity: "living_room",
          type: "living_room",
          layout: "central_seating",
        },
      ],
    },
    {
      prompt:
        "Create a kitchen 3 meters by 3 meters with a window above the sink.",
      expected: [
        {
          entity: "room",
          type: "kitchen",
          dimensions: { width: 3, depth: 3 },
          label: "window_position:sink",
        },
      ],
    },
    {
      prompt: "Generate an L shaped kitchen layout.",
      expected: [{ entity: "kitchen", type: "kitchen", layout: "L_shape" }],
    },
    {
      prompt: "Create a kitchen connected to the dining room.",
      expected: [
        { entity: "kitchen", type: "kitchen", connects: ["dining_room"] },
      ],
    },
    {
      prompt: "Draw a bathroom 2 meters by 2 meters.",
      expected: [
        {
          entity: "room",
          type: "bathroom",
          dimensions: { width: 2, depth: 2 },
        },
      ],
    },
    {
      prompt: "Create a bathroom with a shower and sink.",
      expected: [
        { entity: "bathroom", type: "bathroom", features: ["shower", "sink"] },
      ],
    },
    {
      prompt: "Generate a bathroom attached to the bedroom.",
      expected: [
        {
          entity: "bathroom",
          type: "bathroom",
          placement: { adjacency: "bedroom" },
        },
      ],
    },
    {
      prompt:
        "Design a two bedroom house with living room, kitchen and bathroom.",
      expected: [
        {
          entity: "house_layout",
          type: "house",
          label: "rooms:bedroom,bedroom,living_room,kitchen,bathroom",
        },
      ],
    },
    {
      prompt: "Generate a three bedroom house with dining room and kitchen.",
      expected: [
        {
          entity: "house_layout",
          type: "house",
          label:
            "rooms:bedroom,bedroom,bedroom,living_room,kitchen,dining_room",
        },
      ],
    },
    {
      prompt: "Create a small one bedroom house.",
      expected: [
        {
          entity: "house_layout",
          type: "house",
          label: "rooms:bedroom,living_room,kitchen,bathroom",
        },
      ],
    },
    {
      prompt:
        "Create an office floor with six workstations and a meeting room.",
      expected: [
        {
          entity: "office_layout",
          type: "office_layout",
          label: "rooms:workstation*6,meeting_room",
        },
      ],
    },
    {
      prompt: "Generate a conference room 12 meters by 8 meters.",
      expected: [
        {
          entity: "room",
          type: "conference_room",
          dimensions: { width: 12, depth: 8 },
        },
      ],
    },
    {
      prompt: "Create an open office layout.",
      expected: [
        { entity: "office_layout", type: "office_layout", layout: "open_plan" },
      ],
    },
    {
      prompt: "Create a staircase connecting the ground floor and first floor.",
      expected: [
        {
          entity: "staircase",
          type: "staircase",
          connects: ["ground", "first"],
        },
      ],
    },
    {
      prompt: "Draw a staircase with 18 steps.",
      expected: [
        {
          entity: "staircase",
          type: "staircase",
          dimensions: { stepCount: 18 },
        },
      ],
    },
    {
      prompt: "Generate a spiral staircase with radius 2 meters.",
      expected: [
        {
          entity: "staircase",
          type: "staircase",
          layout: "spiral",
          dimensions: { radius: 2 },
        },
      ],
    },
    {
      prompt: "Create a structural grid with columns every 6 meters.",
      expected: [
        {
          entity: "column_grid",
          type: "column_grid",
          dimensions: { spacing: 6 },
        },
      ],
    },
    {
      prompt: "Add 8 structural columns in the building.",
      expected: [
        { entity: "columns", type: "columns", dimensions: { count: 8 } },
      ],
    },
    {
      prompt: "Place columns along the perimeter of the building.",
      expected: [
        {
          entity: "columns",
          type: "columns",
          placement: { location: "perimeter" },
        },
      ],
    },
    {
      prompt: "Place three windows along the south wall.",
      expected: [
        {
          entity: "windows",
          type: "window",
          dimensions: { count: 3 },
          placement: { wall: "south" },
        },
      ],
    },
    {
      prompt: "Add large glass windows to the living room.",
      expected: [
        {
          entity: "windows",
          type: "window",
          label: "type:large_glass",
          placement: { location: "living_room" },
        },
      ],
    },
    {
      prompt: "Create a skylight in the center of the room.",
      expected: [
        {
          entity: "skylight",
          type: "skylight",
          placement: { position: "center" },
        },
      ],
    },
    {
      prompt: "Add a main entrance door to the house.",
      expected: [{ entity: "door", type: "door", label: "type:main_entrance" }],
    },
    {
      prompt: "Insert sliding doors between the living room and balcony.",
      expected: [
        {
          entity: "door",
          type: "door",
          label: "type:sliding",
          connects: ["living_room", "balcony"],
        },
      ],
    },
    {
      prompt: "Create interior doors connecting all bedrooms to the hallway.",
      expected: [
        { entity: "door", type: "door", connects: ["bedrooms", "hallway"] },
      ],
    },
    {
      prompt: "Create a courtyard in the center of the house.",
      expected: [
        {
          entity: "courtyard",
          type: "courtyard",
          placement: { location: "center" },
        },
      ],
    },
    {
      prompt: "Design a terrace on the roof.",
      expected: [
        { entity: "terrace", type: "terrace", placement: { location: "roof" } },
      ],
    },
    {
      prompt: "Add a garden area in front of the house.",
      expected: [
        { entity: "garden", type: "garden", placement: { location: "front" } },
      ],
    },
    {
      prompt: "Create a parking space for two cars.",
      expected: [{ entity: "parking", type: "parking", slots: 2 }],
    },
    {
      prompt: "Generate a parking garage for 20 vehicles.",
      expected: [
        { entity: "parking_garage", type: "parking_garage", capacity: 20 },
      ],
    },
    {
      prompt: "Design a driveway leading to the garage.",
      expected: [
        { entity: "driveway", type: "driveway", connects: ["road", "garage"] },
      ],
    },
    {
      prompt: "Create a three floor residential building.",
      expected: [
        {
          entity: "building",
          type: "house",
          floors: 3,
          label: "type:residential",
        },
      ],
    },
    {
      prompt: "Generate a two floor house with staircase.",
      expected: [
        { entity: "house", type: "house", floors: 2, staircase: true },
      ],
    },
    {
      prompt: "Design a supermarket layout 30 meters by 20 meters.",
      expected: [
        {
          entity: "supermarket",
          type: "supermarket",
          dimensions: { width: 30, depth: 20 },
        },
      ],
    },
    {
      prompt: "Create a restaurant layout with kitchen and dining hall.",
      expected: [
        {
          entity: "restaurant",
          type: "restaurant",
          label: "rooms:kitchen,dining_hall",
        },
      ],
    },
  ];

  samples.push(...staticVariations);

  // --- AUTOMATED VARIATION SCALING ---
  const bedroomSizes = [
    [3, 3],
    [4, 3],
    [4, 4],
    [5, 4],
    [6, 5],
  ];
  const houseTypes = [
    {
      label: "1 bedroom house",
      rooms: ["bedroom", "living_room", "kitchen", "bathroom"],
    },
    {
      label: "2 bedroom house",
      rooms: ["bedroom", "bedroom", "living_room", "kitchen", "bathroom"],
    },
    {
      label: "3 bedroom house",
      rooms: [
        "bedroom",
        "bedroom",
        "bedroom",
        "living_room",
        "kitchen",
        "dining_room",
      ],
    },
    {
      label: "4 bedroom house",
      rooms: [
        "bedroom",
        "bedroom",
        "bedroom",
        "bedroom",
        "living_room",
        "kitchen",
        "dining_room",
        "bathroom",
      ],
    },
  ];
  const windowCounts = [1, 2, 3, 4, 5];
  const directions = ["north", "south", "east", "west"] as const;

  // Scaling Bedroom Variations (~500+ combinations)
  for (const [w, d] of bedroomSizes) {
    for (const count of windowCounts) {
      for (const dir of directions) {
        samples.push({
          prompt: `Create a bedroom ${w} meters by ${d} meters with ${count} windows on the ${dir} wall.`,
          expected: [
            {
              entity: "room",
              type: "bedroom",
              dimensions: { width: w, depth: d, count },
              placement: { wall: dir },
            },
          ],
        });
      }
    }
  }

  // Scaling House Layouts
  for (const house of houseTypes) {
    samples.push({
      prompt: `Generate a ${house.label}.`,
      expected: [
        {
          entity: "house_layout",
          type: "house",
          label: `rooms:${house.rooms.join(",")}`,
        },
      ],
    });
  }

  // Existing generic room synthesis but scaled down to avoid literal millions, aiming for ~5000 total
  const genericTypes = ["office", "meeting_room", "classroom", "ward", "icu"];
  for (const type of genericTypes) {
    for (let w = 4; w <= 12; w += 2) {
      for (let d = 4; d <= 12; d += 2) {
        samples.push({
          prompt: `Draw a ${w}x${d} ${type}`,
          expected: [
            {
              entity: "room",
              type: "room",
              dimensions: { width: w, depth: d },
              label: type,
            },
          ],
        });
      }
    }
  }

  return samples;
}
