
import { detectLayoutType, generateLayout } from "./lib/ai/layout-generator";

const prompts = [
    "Generate a 2 bedroom apartment layout",
    "Create a 1BHK floor plan",
];

prompts.forEach(prompt => {
    console.log(`\nPROMPT: "${prompt}"`);
    const layoutType = detectLayoutType(prompt);
    if (layoutType) {
        const commands = generateLayout(layoutType);

        // Let's inspect the wall coordinates for adjacency
        const rooms: Record<string, any> = {};
        commands.filter(c => c.action === "create_wall").forEach(c => {
            const label = c.params.roomLabel;
            if (!rooms[label]) rooms[label] = { x: 0, z: 0, w: 0, d: 0 };
            const start = c.params.start;
            const end = c.params.end;
            // Rough estimation of room bounds from walls
            if (c.params.wallName === "south") {
                rooms[label].x = start[0];
                rooms[label].z = start[2];
                rooms[label].w = end[0] - start[0];
            }
            if (c.params.wallName === "east") {
                rooms[label].d = end[2] - start[2];
            }
        });

        console.log("Room Placements:");
        Object.entries(rooms).forEach(([name, bounds]: [string, any]) => {
            console.log(`- ${name.padEnd(15)}: x=${bounds.x}, z=${bounds.z}, w=${Math.round(bounds.w * 100) / 100}, d=${Math.round(bounds.d * 100) / 100}`);
        });

        // Verification checks
        const roomList = Object.values(rooms);
        const widths = roomList.filter(r => r.z === 0).reduce((sum, r) => sum + r.w, 0);
        const backZ = Math.max(...roomList.map(r => r.z));
        const backWidths = roomList.filter(r => r.z === backZ).reduce((sum, r) => sum + r.w, 0);
        console.log(`Front Width: ${widths}, Back Width: ${backWidths}`);
        if (Math.abs(widths - backWidths) < 0.01) {
            console.log("SUCCESS: Rows are perfectly aligned and balanced!");
        } else {
            console.log("WARNING: Rows are misaligned!");
        }
    }
});
