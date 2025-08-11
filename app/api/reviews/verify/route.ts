import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

type Verdict = "correct" | "incorrect"
type Confusion = "TP" | "FP" | "TN" | "FN" | null

type VerifyBody = {
  id: string
  verdict: Verdict
  meta?: {
    label?: string
    confidence?: number
    predicted_at?: string
    source?: string
  }
  timestamp?: string
}

type VerificationRecord = {
  id: string
  verdict: Verdict
  label?: string
  confidence?: number
  predicted_at?: string
  source?: string
  timestamp: string
  confusion: Confusion
}

const POSITIVE_LABEL = "INCIDENT"
const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "verifications.json")

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {}
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf8")
  }
}

async function readAll(): Promise<VerificationRecord[]> {
  await ensureDataFile()
  const raw = await fs.readFile(DATA_FILE, "utf8")
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as VerificationRecord[]) : []
  } catch {
    return []
  }
}

async function writeAll(records: VerificationRecord[]) {
  await ensureDataFile()
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf8")
}

// Record human verification of labels to a local JSON file
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VerifyBody
    if (!body || typeof body.id !== "string" || (body.verdict !== "correct" && body.verdict !== "incorrect")) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
    }

    const isPredictedPositive = body.meta?.label ? body.meta.label === POSITIVE_LABEL : null
    let confusion: Confusion = null
    if (isPredictedPositive !== null) {
      if (body.verdict === "correct") {
        confusion = isPredictedPositive ? "TP" : "TN"
      } else {
        confusion = isPredictedPositive ? "FP" : "FN"
      }
    }

    const record: VerificationRecord = {
      id: body.id,
      verdict: body.verdict,
      label: body.meta?.label,
      confidence: body.meta?.confidence,
      predicted_at: body.meta?.predicted_at,
      source: body.meta?.source,
      timestamp: body.timestamp || new Date().toISOString(),
      confusion,
    }

    const existing = await readAll()
    const idx = existing.findIndex((r) => r.id === record.id)
    if (idx >= 0) {
      existing[idx] = record
    } else {
      existing.push(record)
    }
    await writeAll(existing)

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 })
  }
}
