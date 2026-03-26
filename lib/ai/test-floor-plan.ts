import { interpretPrompt } from "./prompt-interpreter";
import { parseDesignIntent } from "./design-intent-parser";
import { generateArchitecturalSpecs } from "./layout-generator";

async function testPipeline() {
  console.log("🚀 Testing AI Floor Plan Generator (10-Step Pipeline)\n");

  const prompt =
    "Generate a small house with two bedrooms, a living room, kitchen and bathroom";
  console.log(`Prompt: "${prompt}"`);

  // STEP 1: PROMPT_ANALYZER
  console.log("\n[STEP 1] Prompt Analyzer...");
  const parsed = interpretPrompt(prompt);
  console.log(`- Building Type: ${parsed.buildingType}`);
  console.log(`- Floors: ${parsed.floors}`);
  console.log(
    `- Rooms Detected: ${parsed.entities.filter((e) => e.label !== "corridor").length}`
  );

  // STEP 2 & 3: REQUIREMENT ENGINE & LAYOUT GENERATOR
  console.log("\n[STEP 2 & 3] Requirement Engine & Layout Generator...");
  const specs = generateArchitecturalSpecs("2bhk"); // simplified for test
  const living = specs.find((s) => s.name === "LIVING ROOM");
  const kitchen = specs.find((s) => s.name === "KITCHEN");
  const corridor = specs.find((s) => s.name === "CORRIDOR");

  if (living && kitchen) {
    const adjacencyCorrect = living.x! + living.width === kitchen.x;
    console.log(
      `- Adjacency (Living/Kitchen): ${adjacencyCorrect ? "✅ Correct" : "❌ Failed"}`
    );
  }
  console.log(
    `- Corridor (Step 8): ${corridor ? "✅ Generated" : "❌ Missing"}`
  );

  // STEP 4-7: GEOMETRY ENGINE, WALL BUILDER, OPENINGS
  console.log("\n[STEP 4-7] Geometry & Openings...");
  const commands = parseDesignIntent(parsed);

  const walls = commands.filter((c) => c.action === "create_wall");
  const doors = commands.filter((c) => c.action === "insert_door");
  const windows = commands.filter((c) => c.action === "insert_window");

  console.log(`- Total Walls (Step 5): ${walls.length}`);

  console.log("\nDoor Widths found:");
  doors.forEach((d) =>
    console.log(`  - ${d.params.width}m at ${d.params.x},${d.params.z}`)
  );

  const entranceDoor = doors.find((d) => d.params.width === 1.2);
  const roomDoor = doors.find((d) => d.params.width === 0.9);
  console.log(
    `- Entrance Door (1.2m) (Step 6): ${entranceDoor ? "✅ Found" : "❌ Missing"}`
  );
  console.log(
    `- Room Doors (0.9m) (Step 6): ${roomDoor ? "✅ Found" : "❌ Missing"}`
  );

  const windowSizes = windows.every((w) => w.params.width === 1.5);
  console.log(
    `- Standard Windows (1.5m) (Step 7): ${windowSizes ? "✅ Correct" : "❌ Invalid"}`
  );

  console.log("\n✅ 10-Step Pipeline Verification Complete.");
}

testPipeline().catch(console.error);
