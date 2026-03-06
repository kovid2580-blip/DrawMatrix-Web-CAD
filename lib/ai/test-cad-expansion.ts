import { interpretPrompt } from "./prompt-interpreter";
import { parseDesignIntent } from "./design-intent-parser";

function verifyCADExpansion() {
    console.log("--- CAD EXPANSION VERIFICATION ---");

    const tests = [
        "Generate a hospital floor",
        "Create a residential block with 5 houses",
        "Draw a parking lot for 10 cars",
        "Use steel walls for the workshop"
    ];

    for (const prompt of tests) {
        console.log(`\nPROMPT: "${prompt}"`);
        const interpreted = interpretPrompt(prompt);
        const commands = parseDesignIntent(interpreted);

        console.log(`Entities detected: ${interpreted.entities.map(e => e.type).join(", ")}`);
        console.log(`Commands generated: ${commands.length}`);

        if (prompt.includes("hospital")) {
            const hasER = commands.some(c => c.params?.label === "Emergency Room");
            const hasICU = commands.some(c => c.params?.label === "ICU");
            console.log(hasER && hasICU ? "✅ Hospital Template Matched" : "❌ Hospital Template Failed");
        }

        if (prompt.includes("residential block")) {
            const houseCount = commands.filter(c => c.params?.label?.startsWith("House")).length;
            console.log(houseCount >= 5 ? `✅ Urban Block Matched (${houseCount} houses)` : `❌ Urban Block Failed (${houseCount} houses)`);
        }

        if (prompt.includes("parking")) {
            const hasSlab = commands.some(c => c.action === "create_slab" && c.params?.label === "parking_lot");
            console.log(hasSlab ? "✅ Parking Lot Matched" : "❌ Parking Lot Failed");
        }

        if (prompt.includes("steel walls")) {
            const hasMaterial = commands.some(c => c.params?.material === "steel");
            console.log(hasMaterial ? "✅ Material Instruction Matched (Steel)" : "❌ Material Instruction Failed");
        }
    }
}

try {
    verifyCADExpansion();
} catch (e) {
    console.error("Verification failed:", e);
}
