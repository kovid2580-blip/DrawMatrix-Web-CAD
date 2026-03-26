/**
 * ARCHITECTURAL RULE ENGINE
 * Validates and auto-corrects generated geometry against
 * standard architectural constraints.
 */

import { DrawCommand } from "@/store/ai-store";

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  correctedCommands: DrawCommand[];
}

// ── Architectural Constants ──────────────────────────────────────────────────

const RULES = {
  door: {
    minWidth: 0.7,
    maxWidth: 1.8,
    standardWidth: 0.9,
    standardHeight: 2.1,
  },
  window: {
    minWidth: 0.6,
    maxWidth: 3.0,
    standardWidth: 1.2,
    standardHeight: 1.2,
    minSillHeight: 0.9,
  },
  wall: {
    minThickness: 0.1,
    maxThickness: 0.5,
    interiorThickness: 0.2,
    exteriorThickness: 0.3,
    standardHeight: 2.8,
    maxHeight: 6.0,
  },
  stairs: {
    maxRiserHeight: 0.19,
    minTreadDepth: 0.25,
    minWidth: 0.8,
    standardWidth: 1.0,
  },
  room: {
    minArea: 4, // sqm
    minDimension: 1.5, // meters
  },
  column: {
    minSize: 0.2,
    maxSize: 1.0,
  },
};

// ── Validation & Auto-Correction ─────────────────────────────────────────────

export function validateAndCorrect(commands: DrawCommand[]): ValidationResult {
  const warnings: string[] = [];
  const corrected: DrawCommand[] = [];

  for (const cmd of commands) {
    const c = { ...cmd, params: { ...cmd.params } };

    switch (c.action) {
      case "create_wall": {
        if (c.params.thickness < RULES.wall.minThickness) {
          warnings.push(
            `Wall thickness ${c.params.thickness}m is below minimum ${RULES.wall.minThickness}m – auto-corrected.`
          );
          c.params.thickness = RULES.wall.interiorThickness;
        }
        if (c.params.thickness > RULES.wall.maxThickness) {
          warnings.push(
            `Wall thickness ${c.params.thickness}m exceeds maximum – clamped to ${RULES.wall.maxThickness}m.`
          );
          c.params.thickness = RULES.wall.maxThickness;
        }
        if (c.params.height > RULES.wall.maxHeight) {
          warnings.push(
            `Wall height ${c.params.height}m exceeds ${RULES.wall.maxHeight}m – clamped.`
          );
          c.params.height = RULES.wall.maxHeight;
        }
        break;
      }

      case "insert_door": {
        if (c.params.width < RULES.door.minWidth) {
          warnings.push(
            `Door width ${c.params.width}m is below minimum ${RULES.door.minWidth}m – corrected to ${RULES.door.standardWidth}m.`
          );
          c.params.width = RULES.door.standardWidth;
        }
        if (c.params.width > RULES.door.maxWidth) {
          warnings.push(
            `Door width ${c.params.width}m exceeds maximum – clamped to ${RULES.door.maxWidth}m.`
          );
          c.params.width = RULES.door.maxWidth;
        }
        if (!c.params.height) c.params.height = RULES.door.standardHeight;
        break;
      }

      case "insert_window": {
        if (c.params.width < RULES.window.minWidth) {
          warnings.push(
            `Window width ${c.params.width}m is below minimum – corrected to ${RULES.window.standardWidth}m.`
          );
          c.params.width = RULES.window.standardWidth;
        }
        if (c.params.width > RULES.window.maxWidth) {
          warnings.push(
            `Window width ${c.params.width}m exceeds maximum – clamped.`
          );
          c.params.width = RULES.window.maxWidth;
        }
        break;
      }

      case "create_stairs": {
        if (c.params.riserHeight > RULES.stairs.maxRiserHeight) {
          warnings.push(
            `Stair riser height ${c.params.riserHeight}m exceeds max ${RULES.stairs.maxRiserHeight}m – corrected.`
          );
          c.params.riserHeight = RULES.stairs.maxRiserHeight;
        }
        if (c.params.treadDepth < RULES.stairs.minTreadDepth) {
          warnings.push(
            `Stair tread depth ${c.params.treadDepth}m is below minimum ${RULES.stairs.minTreadDepth}m – corrected.`
          );
          c.params.treadDepth = RULES.stairs.minTreadDepth;
        }
        if (c.params.width < RULES.stairs.minWidth) {
          warnings.push(
            `Stair width ${c.params.width}m is below minimum – corrected to ${RULES.stairs.standardWidth}m.`
          );
          c.params.width = RULES.stairs.standardWidth;
        }
        break;
      }
    }

    corrected.push(c);
  }

  return {
    valid: warnings.length === 0,
    warnings,
    correctedCommands: corrected,
  };
}
