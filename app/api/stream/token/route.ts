import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const API_SECRET = process.env.STREAM_SECRET_KEY;

export async function POST(req: Request) {
  if (!API_KEY || !API_SECRET) {
    return NextResponse.json(
      {
        error:
          "Stream API keys not configured. Add NEXT_PUBLIC_STREAM_API_KEY and STREAM_SECRET_KEY to .env.local",
      },
      { status: 500 }
    );
  }

  const { userId } = await req.json();
  if (!userId) {
    console.error("[Stream API] Missing userId in request");
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  console.log(`[Stream API] Generating token for user: ${userId}`);

  const client = new StreamClient(API_KEY, API_SECRET);

  // Ensure user exists on Stream's servers before generating token
  try {
    await client.upsertUsers([
      {
        id: userId,
        name: userId,
        role: "user",
      },
    ]);
    console.log(`[Stream API] User upserted/verified: ${userId}`);
  } catch (upsertErr) {
    console.error("[Stream API] User upsert error (non-fatal):", upsertErr);
    // Continue anyway — token generation may still work
  }

  const token = client.generateUserToken({ user_id: userId });
  console.log(`[Stream API] Token generated successfully for: ${userId}`);

  return NextResponse.json({ token });
}
