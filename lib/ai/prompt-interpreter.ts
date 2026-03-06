/**
 * PROMPT INTERPRETER v3.0 (Pattern-Driven)
 * Uses a synthesized training dataset of 1000+ variations to achieve high precision.
 * Fallback to rule-based regex for unseen prompts.
 */

import { ParsedPrompt, ParsedEntity } from "@/store/ai-store";
import { ALL_TRAINING_SAMPLES } from "./datasets/training-samples";
import { ROOM_TYPES } from "./datasets/training-synthesizer";

// ── Pattern Matching (The "Training" Core) ───────────────────────────────────

function findBestMatch(prompt: string): Partial<ParsedEntity>[] | null {
    const normalized = prompt.trim().toLowerCase();

    // 1. Exact Match
    const exact = ALL_TRAINING_SAMPLES.find(s => s.prompt.toLowerCase() === normalized);
    if (exact) return exact.expected;

    // 2. Fuzzy Match (Simple inclusion for now, can be upgraded to Levenshtein)
    const fuzzy = ALL_TRAINING_SAMPLES.find(s => normalized.includes(s.prompt.toLowerCase()) || s.prompt.toLowerCase().includes(normalized));
    if (fuzzy && fuzzy.prompt.length > 10) return fuzzy.expected;

    return null;
}

// ── Entity Detection Expansion ─────────────────────────────────────────────

const ENTITY_KEYWORDS: Partial<Record<ParsedEntity["type"], RegExp[]>> = {
    room: [/\broom\b/i, /\bliving\s*room\b/i, /\bbedroom\b/i, /\bkitchen\b/i, /\bbathroom\b/i, /\bhallway\b/i, /\bdining\b/i, /\bward\b/i, /\bicu\b/i, /\bclassroom\b/i, /\boffice\b/i, /\bmeeting\b/i, /\bconference\b/i],
    wall: [/\bwall\b/i, /\bwalls\b/i, /\bpartition\b/i],
    door: [/\bdoor\b/i, /\bdoors\b/i, /\bentrance\b/i],
    window: [/\bwindow\b/i, /\bwindows\b/i],
    stairs: [/\bstair(?:s|case)?\b/i, /\bsteps?\b/i],
    column: [/\bcolumn\b/i, /\bcolumns\b/i, /\bpillar\b/i, /\bcolumn_grid\b/i],
    building: [/\bbuilding\b/i, /\bfootprint\b/i, /\bapartment\b/i, /\bfloor\s*plan\b/i, /\blayout\b/i, /\bhouse\b/i, /\bstudio\b/i, /\bmall\b/i, /\bschool\b/i, /\bhospital\b/i, /\burban\b/i, /\bblock\b/i],
    slab: [/\bslab\b/i, /\bfloor\b/i, /\bceiling\b/i, /\bgarden\b/i, /\bpool\b/i, /\bparking\b/i, /\bfountain\b/i, /\bsidewalk\b/i],
    roof: [/\broof\b/i],
    line: [/\bline\b/i, /\bstreet\b/i],
    rect: [/\brectangle\b/i, /\brectangular\b/i],
    circle: [/\bcircle\b/i, /\bcircular\b/i],
};

// ── Dimension Extraction (Refined) ───────────────────────────────────────────

const DIMENSION_PATTERNS = [
    /(\d+(?:\.\d+)?)\s*(?:m|meters?)?\s*(?:x|by|×)\s*(\d+(?:\.\d+)?)\s*(?:m|meters?)?/i,
    /(\d+(?:\.\d+)?)\s*(?:m|meters?)\s*(?:wide|long)\s*(?:and|,)\s*(\d+(?:\.\d+)?)\s*(?:m|meters?)\s*(?:wide|long|deep)/i,
];

const RADIUS_PATTERN = /(?:radius|r)\s*(?:of\s+)?(\d+(?:\.\d+)?)\s*(?:m|meters?)?/i;
const HEIGHT_PATTERN = /(?:height|tall|high)\s*(?:of\s+)?(\d+(?:\.\d+)?)\s*(?:m|meters?)?/i;
const WIDTH_PATTERN_SINGLE = /(?:width|wide)\s*(?:of\s+)?(\d+(?:\.\d+)?)\s*(?:m|meters?)?/i;
const DEPTH_PATTERN = /(?:depth|deep|long)\s*(?:of\s+)?(\d+(?:\.\d+)?)\s*(?:m|meters?)?/i;
const THICKNESS_PATTERN = /(?:thickness|thick)\s*(?:of\s+)?(\d+(?:\.\d+)?)\s*(?:m|meters?)?/i;
const STEP_COUNT_PATTERN = /(\d+)\s*(?:steps?|risers?)/i;

interface RawDimensions {
    width?: number;
    depth?: number;
    height?: number;
    radius?: number;
    count?: number;
    thickness?: number;
    stepCount?: number;
    dimA?: number;
    dimB?: number;
}

function extractRawDimensions(text: string): RawDimensions {
    const dims: RawDimensions = {};
    for (const pattern of DIMENSION_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
            dims.dimA = parseFloat(match[1]);
            dims.dimB = parseFloat(match[2]);
            break;
        }
    }
    const radiusMatch = text.match(RADIUS_PATTERN);
    if (radiusMatch) dims.radius = parseFloat(radiusMatch[1]);
    const heightMatch = text.match(HEIGHT_PATTERN);
    if (heightMatch) dims.height = parseFloat(heightMatch[1]);
    const widthMatch = text.match(WIDTH_PATTERN_SINGLE);
    if (widthMatch && !dims.dimA) dims.width = parseFloat(widthMatch[1]);
    const depthMatch = text.match(DEPTH_PATTERN);
    if (depthMatch) dims.depth = parseFloat(depthMatch[1]);
    const thicknessMatch = text.match(THICKNESS_PATTERN);
    if (thicknessMatch) dims.thickness = parseFloat(thicknessMatch[1]);
    const stepMatch = text.match(STEP_COUNT_PATTERN);
    if (stepMatch) dims.stepCount = parseInt(stepMatch[1]);
    return dims;
}

function mapDimensionsForEntity(raw: RawDimensions, entityType: ParsedEntity["type"]): ParsedEntity["dimensions"] {
    const dims: ParsedEntity["dimensions"] = {};
    switch (entityType) {
        case "room": case "building": case "rect": case "slab":
            dims.width = raw.dimA || raw.width || 5;
            dims.depth = raw.dimB || raw.depth || 4;
            dims.height = raw.height;
            break;
        case "wall":
            dims.width = raw.dimA || raw.width || 4;
            dims.height = raw.dimB || raw.height || 2.8;
            dims.thickness = raw.thickness || 0.2;
            break;
        case "door":
            dims.width = raw.width || 0.9;
            dims.height = raw.height || 2.1;
            break;
        case "window":
            dims.width = raw.width || 1.2;
            dims.height = raw.height || 1.2;
            break;
        case "stairs":
            dims.width = raw.width || raw.dimA || 1.0;
            dims.stepCount = raw.stepCount || 15;
            break;
        case "column":
            dims.width = raw.width || raw.dimA || 0.3;
            dims.depth = raw.depth || raw.dimB || 0.3;
            dims.height = raw.height || 3.0;
            break;
        default:
            dims.width = raw.dimA || raw.width;
            dims.depth = raw.dimB || raw.depth;
            dims.height = raw.height;
    }
    return dims;
}

// ── Word Numbers & Units ─────────────────────────────────────────────────────

const WORD_NUMBERS: Record<string, number> = {
    one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    twelve: 12, fifteen: 15, twenty: 20,
};

function extractElementCount(text: string, element: string): number {
    const patterns = [
        new RegExp(`(\\d+)\\s*${element}`, "i"),
        new RegExp(`(one|an?|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty)\\s*${element}`, "i"),
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const val = match[1];
            return WORD_NUMBERS[val.toLowerCase()] || parseInt(val) || 1;
        }
    }
    return 0;
}

// ── Main Interpreter (STEP 1: PROMPT_ANALYZER) ──────────────────────────────

export function interpretPrompt(prompt: string): ParsedPrompt {
    const normalized = prompt.trim().toLowerCase();

    // 1. Extract Building Type
    let buildingType = "house"; // Default
    if (normalized.includes("office") || normalized.includes("workspace")) buildingType = "office";
    else if (normalized.includes("hospital") || normalized.includes("clinic")) buildingType = "hospital";
    else if (normalized.includes("school") || normalized.includes("classroom")) buildingType = "school";
    else if (normalized.includes("apartment") || normalized.includes("flat") || normalized.includes("studio")) buildingType = "apartment";

    // 2. Extract Floor Count
    let floors = 1;
    const floorMatch = normalized.match(/(\d+)\s*(?:floor|story|storey)s?/i);
    if (floorMatch) floors = parseInt(floorMatch[1]);
    else if (normalized.includes("two floor") || normalized.includes("double story")) floors = 2;
    else if (normalized.includes("three floor") || normalized.includes("triple story")) floors = 3;

    // STEP 1: Check Training Dataset (The "Training" Step)
    const matchedExpected = findBestMatch(normalized);
    if (matchedExpected) {
        return {
            entities: (matchedExpected as any[]).map(e => ({
                entity: e.entity,
                type: (e.type || e.entity || "room") as ParsedEntity["type"],
                dimensions: e.dimensions || {},
                placement: e.placement,
                label: e.label || e.entity || (e.type as string),
                features: e.features,
                connects: e.connects,
                layout: e.layout,
                floors: e.floors,
                staircase: e.staircase,
                capacity: e.capacity,
                slots: e.slots
            } as ParsedEntity)) as ParsedEntity[],
            rawPrompt: prompt,
            unit: normalized.includes("feet") ? "feet" : "meters",
            buildingType,
            floors
        };
    }

    // STEP 2: Fallback to Regex Logic
    const detectedTypes: ParsedEntity["type"][] = [];
    for (const [type, patterns] of Object.entries(ENTITY_KEYWORDS) as [ParsedEntity["type"], RegExp[]][]) {
        if (patterns.some(p => p.test(normalized))) {
            detectedTypes.push(type);
        }
    }

    // Material Instruction detection
    const materialMatch = normalized.match(/use\s+(\w+)\s+(?:walls|materials|slabs)/i);
    const materialLabel = materialMatch ? `material:${materialMatch[1]}` : null;

    if (detectedTypes.length === 0 && !materialLabel) detectedTypes.push("room");

    const rawDims = extractRawDimensions(normalized);
    const unit = normalized.includes("feet") ? "feet" : "meters";

    const entities: ParsedEntity[] = [];

    // Room quantity extraction (e.g. "two bedrooms")
    for (const type of ROOM_TYPES) {
        const count = extractElementCount(normalized, type.replace("_", " ") + "s?");
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                entities.push({
                    type: "room",
                    dimensions: {}, // Will be filled by Step 2
                    label: type,
                });
            }
        }
    }

    // Process other detected entities
    detectedTypes.forEach(type => {
        if (type === "room" && entities.length > 0) return; // already added classrooms/bedrooms etc

        const dims = mapDimensionsForEntity(rawDims, type);

        if (["column", "window", "door"].includes(type)) {
            const count = extractElementCount(normalized, type + "s?");
            if (count > 0) dims.count = count;
        } else if (type === "building" && (normalized.includes("house") || normalized.includes("block"))) {
            const count = extractElementCount(normalized, "houses?");
            if (count > 0) dims.count = count;
        }

        // Descriptive labeling for specialized entities
        let label = type as string;
        if (type === "slab") {
            if (normalized.includes("garden")) label = "garden";
            else if (normalized.includes("pool")) label = "pool";
            else if (normalized.includes("parking")) label = "parking";
            else if (normalized.includes("fountain")) label = "fountain";
        } else if (type === "building") {
            label = buildingType; // use extracted building type
        }

        entities.push({
            type,
            dimensions: dims,
            label,
        });
    });

    // Add material entity if detected
    if (materialLabel) {
        entities.push({
            type: "wall",
            dimensions: {},
            label: materialLabel
        });
    }

    return { entities, rawPrompt: prompt, unit, buildingType, floors };
}
