import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

type Confusion = "TP" | "FP" | "TN" | "FN" | null

type VerificationRecord = {
  id: string
  verdict: "correct" | "incorrect"
  label?: string
  confidence?: number
  predicted_at?: string
  source?: string
  timestamp: string
  confusion: Confusion
}

const DATA_FILE = path.join(process.cwd(), "data", "verifications.json")

function safeRate(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return numerator / denominator
}

export async function GET() {
  try {
    let records: VerificationRecord[] = []
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8")
      const parsed = JSON.parse(raw)
      records = Array.isArray(parsed) ? (parsed as VerificationRecord[]) : []
    } catch {
      records = []
    }

    const total = records.length
    const correct = records.filter((r) => r.verdict === "correct").length
    const incorrect = records.filter((r) => r.verdict === "incorrect").length

    const tp = records.filter((r) => r.confusion === "TP").length
    const tn = records.filter((r) => r.confusion === "TN").length
    const fp = records.filter((r) => r.confusion === "FP").length
    const fn = records.filter((r) => r.confusion === "FN").length
    const cmTotal = tp + tn + fp + fn

    const accuracy = safeRate(tp + tn, cmTotal)
    const precision = safeRate(tp, tp + fp)
    const recall = safeRate(tp, tp + fn)
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

    const response = {
      meta: {
        total,
        last_updated: records[records.length - 1]?.timestamp ?? null,
      },
      counts: {
        total,
        correct,
        incorrect,
        tp,
        tn,
        fp,
        fn,
      },
      metrics: {
        accuracy,
        precision,
        recall,
        f1,
      },
    }

    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    return NextResponse.json({ error: "Failed to compute stats" }, { status: 500 })
  }
}


