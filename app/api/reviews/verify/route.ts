import { NextResponse } from "next/server"

// Lightweight endpoint to record human verification of labels.
// In a real app, persist to a database or analytics pipeline.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    // eslint-disable-next-line no-console
    console.log("Human verification received:", body)
    // Optionally add validation here
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 })
  }
}
