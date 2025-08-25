import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import { API_CONFIG, getResultsFilePath } from "@/lib/config"

const RESULTS_FILE = getResultsFilePath()

type VerificationResult = {
  id: string
  verdict: "correct" | "incorrect"
  timestamp: string
  meta?: {
    label?: string
    confidence?: number
    predicted_at?: string
    source?: string
  }
}

type MetricsData = {
  totalVerifications: number
  correctPredictions: number
  incorrectPredictions: number
  accuracy: number
  labelBreakdown: Record<string, {
    total: number
    correct: number
    incorrect: number
    accuracy: number
  }>
  confidenceRanges: {
    high: { count: number; accuracy: number }
    medium: { count: number; accuracy: number }
    low: { count: number; accuracy: number }
  }
  recentActivity: {
    last24h: number
    last7days: number
    last30days: number
  }
  verificationsByLabel: Record<string, VerificationResult[]>
}

async function loadResults(): Promise<VerificationResult[]> {
  try {
    if (!existsSync(RESULTS_FILE)) {
      return []
    }
    
    const data = await readFile(RESULTS_FILE, "utf8")
    const results = JSON.parse(data)
    return Array.isArray(results) ? results : []
  } catch (error) {
    console.error("Error loading results:", error)
    return []
  }
}

function calculateMetrics(results: VerificationResult[]): MetricsData {
  const totalVerifications = results.length
  const correctPredictions = results.filter(r => r.verdict === "correct").length
  const incorrectPredictions = results.filter(r => r.verdict === "incorrect").length
  const accuracy = totalVerifications > 0 ? correctPredictions / totalVerifications : 0

  // Label breakdown
  const labelBreakdown: Record<string, { total: number; correct: number; incorrect: number; accuracy: number }> = {}
  const verificationsByLabel: Record<string, VerificationResult[]> = {}

  results.forEach(result => {
    const label = result.meta?.label || "unknown"
    
    if (!labelBreakdown[label]) {
      labelBreakdown[label] = { total: 0, correct: 0, incorrect: 0, accuracy: 0 }
      verificationsByLabel[label] = []
    }
    
    labelBreakdown[label].total++
    if (result.verdict === "correct") {
      labelBreakdown[label].correct++
    } else {
      labelBreakdown[label].incorrect++
    }
    
    verificationsByLabel[label].push(result)
  })

  // Calculate accuracy for each label
  Object.keys(labelBreakdown).forEach(label => {
    const data = labelBreakdown[label]
    data.accuracy = data.total > 0 ? data.correct / data.total : 0
  })

  // Confidence ranges
  const confidenceRanges = {
    high: { count: 0, accuracy: 0 },
    medium: { count: 0, accuracy: 0 },
    low: { count: 0, accuracy: 0 }
  }

  const highConfResults = results.filter(r => (r.meta?.confidence || 0) >= API_CONFIG.METRICS.CONFIDENCE_THRESHOLDS.HIGH)
  const medConfResults = results.filter(r => (r.meta?.confidence || 0) >= API_CONFIG.METRICS.CONFIDENCE_THRESHOLDS.MEDIUM && (r.meta?.confidence || 0) < API_CONFIG.METRICS.CONFIDENCE_THRESHOLDS.HIGH)
  const lowConfResults = results.filter(r => (r.meta?.confidence || 0) < API_CONFIG.METRICS.CONFIDENCE_THRESHOLDS.MEDIUM)

  confidenceRanges.high.count = highConfResults.length
  confidenceRanges.high.accuracy = highConfResults.length > 0 ? 
    highConfResults.filter(r => r.verdict === "correct").length / highConfResults.length : 0

  confidenceRanges.medium.count = medConfResults.length
  confidenceRanges.medium.accuracy = medConfResults.length > 0 ? 
    medConfResults.filter(r => r.verdict === "correct").length / medConfResults.length : 0

  confidenceRanges.low.count = lowConfResults.length
  confidenceRanges.low.accuracy = lowConfResults.length > 0 ? 
    lowConfResults.filter(r => r.verdict === "correct").length / lowConfResults.length : 0

  // Recent activity
  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const recentActivity = {
    last24h: results.filter(r => new Date(r.timestamp) >= last24h).length,
    last7days: results.filter(r => new Date(r.timestamp) >= last7days).length,
    last30days: results.filter(r => new Date(r.timestamp) >= last30days).length
  }

  return {
    totalVerifications,
    correctPredictions,
    incorrectPredictions,
    accuracy,
    labelBreakdown,
    confidenceRanges,
    recentActivity,
    verificationsByLabel
  }
}

export async function GET() {
  try {
    const results = await loadResults()
    const metrics = calculateMetrics(results)
    
    return NextResponse.json({
      metrics,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error calculating metrics:", error)
    return NextResponse.json({ error: "Failed to calculate metrics" }, { status: 500 })
  }
}
