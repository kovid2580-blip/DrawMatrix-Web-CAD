export const CAD_ENGINE_URL = "https://supersafely-subconcave-madie.ngrok-free.dev";

export async function fetchRemoteCADObjects(prompt: string, layerId: string = "layer-0") {
    try {
        const response = await fetch(`${CAD_ENGINE_URL}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt, layerId }),
        });

        if (!response.ok) {
            throw new Error(`CAD Engine responded with status: ${response.status}`);
        }

        const data = await response.json();
        return data.objects || [];
    } catch (err) {
        console.error("Remote CAD Engine error:", err);
        throw err;
    }
}
