import { TrainingSample, generateTrainingData } from "./training-synthesizer";

/**
 * GOLDEN SET
 * The high-precision examples provided by the user.
 */
export const GOLDEN_SAMPLES: TrainingSample[] = [
    {
        prompt: "Create a bedroom 4 meters by 3 meters with one window on the east wall.",
        expected: [{ entity: "room", type: "bedroom", dimensions: { width: 4, depth: 3 }, placement: { wall: "east" } }]
    },
    {
        prompt: "Draw a master bedroom 5 meters by 4 meters with two windows.",
        expected: [{ entity: "room", type: "master_bedroom", dimensions: { width: 5, depth: 4, count: 2 } }]
    },
    {
        prompt: "Create a kitchen 3 meters by 3 meters with a window above the sink.",
        expected: [{ entity: "room", type: "kitchen", dimensions: { width: 3, depth: 3 }, label: "window_position:sink" }]
    },
    {
        prompt: "Draw a staircase with 18 steps.",
        expected: [{ entity: "staircase", type: "staircase", dimensions: { stepCount: 18 } }]
    },
    {
        prompt: "Create a structural grid with columns every 6 meters.",
        expected: [{ entity: "column_grid", type: "column_grid", dimensions: { spacing: 6 } }]
    },
    {
        prompt: "Design a two bedroom house with living room, kitchen and bathroom.",
        expected: [{ entity: "house_layout", type: "house", label: "rooms:bedroom,bedroom,living_room,kitchen,bathroom" }]
    }
];

/**
 * FULL TRAINING SET
 * Combined Golden Set + 1000+ Synthesized Variations
 */
export const ALL_TRAINING_SAMPLES: TrainingSample[] = [
    ...GOLDEN_SAMPLES,
    ...generateTrainingData()
];
