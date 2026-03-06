import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const API_SECRET = process.env.STREAM_SECRET_KEY;

export async function POST(req: Request) {
    if (!API_KEY || !API_SECRET) {
        return NextResponse.json(
            { error: "Stream API keys not configured. Add NEXT_PUBLIC_STREAM_API_KEY and STREAM_SECRET_KEY to .env.local" },
            { status: 500 }
        );
    }

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const client = new StreamClient(API_KEY, API_SECRET);
    const exp = Math.round(Date.now() / 1000) + 3600;      // 1 hour
    const issued = Math.floor(Date.now() / 1000) - 60;
    const token = client.createToken(userId, exp, issued);

    return NextResponse.json({ token });
}
