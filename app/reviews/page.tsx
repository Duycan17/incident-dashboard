"use client"

import * as React from "react"
import { Pie, PieChart, LabelList } from "recharts"
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

type Review = {
  id: string
  text: string
  metadata?: {
    source?: string
    processed_at?: string
  }
  prediction: {
    label: string
    confidence: number
  }
  predicted_at?: string
}

type Verdict = "correct" | "incorrect"

type ReviewsApiMeta = {
  total: number
  page: number
  page_size: number
  has_next: boolean
  has_prev: boolean
  next_skip?: number
  prev_skip?: number
}

type ReviewsApiResponse = {
  meta: ReviewsApiMeta
  items: Review[]
}

// Fallback sample data if the API call fails (e.g., due to mixed-content/CORS in preview)
const SAMPLE_REVIEWS: Review[] = [
  {
    id: "66b6d3fcf8a1b2d3e4f56789",
    text: "There was a collision near the central station this morning.",
    metadata: { source: "faiss", processed_at: "2025-08-09T14:20:00Z" },
    prediction: { label: "INCIDENT", confidence: 0.9998 },
    predicted_at: "2025-08-10T14:30:12Z",
  },
  {
    id: "66b6d4aaf8a1b2d3e4f5678a",
    text: "Explosion reported in the industrial area late last night.",
    metadata: { source: "faiss" },
    prediction: { label: "INCIDENT", confidence: 0.9874 },
    predicted_at: "2025-08-09T23:45:07Z",
  },
]

function toKey(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

export default function ReviewsPage() {
  const [items, setItems] = React.useState<Review[]>([])
  const [meta, setMeta] = React.useState<ReviewsApiMeta | null>(null)
  const [chartItems, setChartItems] = React.useState<Review[]>([])
  const [chartMeta, setChartMeta] = React.useState<ReviewsApiMeta | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [usedFallback, setUsedFallback] = React.useState<boolean>(false)
  const [lastFetchedAt, setLastFetchedAt] = React.useState<Date | null>(null)
  const [page, setPage] = React.useState<number>(1)
  const [labelFilter, setLabelFilter] = React.useState<string>("")

  // Load/save verification state to localStorage
  const [verifications, setVerifications] = React.useState<Record<string, Verdict>>(() => {
    if (typeof window === "undefined") return {}
    try {
      const raw = window.localStorage.getItem("review-verifications")
      return raw ? (JSON.parse(raw) as Record<string, Verdict>) : {}
    } catch {
      return {}
    }
  })
  React.useEffect(() => {
    try {
      window.localStorage.setItem("review-verifications", JSON.stringify(verifications))
    } catch {
      // ignore
    }
  }, [verifications])

  const fetchReviews = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setUsedFallback(false)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      if (labelFilter) params.set("label", labelFilter)
      const res = await fetch(`/apiv2/reviews?${params.toString()}` , { cache: "no-store" })
      if (!res.ok) {
        throw new Error(`Upstream responded with ${res.status}`)
      }
      const data: ReviewsApiResponse = await res.json()
      if (data && Array.isArray(data.items)) {
        setItems(data.items)
        setMeta(data.meta)
      } else {
        const maybeArray = data as unknown
        if (Array.isArray(maybeArray)) {
        // Backward compat: plain array
          setItems(maybeArray as Review[])
          setMeta({ total: (maybeArray as any[]).length, page, page_size: (maybeArray as any[]).length, has_next: false, has_prev: false })
        } else {
          setItems([])
          setMeta({ total: 0, page, page_size: 0, has_next: false, has_prev: false })
        }
      }
      setLastFetchedAt(new Date())
    } catch (e: any) {
      // Fall back to sample data if the live call fails (CORS/mixed content likely in preview)
      setError(e?.message || "Failed to fetch reviews")
      const fallback: ReviewsApiResponse = {
        meta: {
          total: SAMPLE_REVIEWS.length,
          page,
          page_size: 15,
          has_next: false,
          has_prev: page > 1,
          next_skip: undefined,
          prev_skip: undefined,
        },
        items: SAMPLE_REVIEWS,
      }
      setItems(fallback.items)
      setMeta(fallback.meta)
      setUsedFallback(true)
    } finally {
      setIsLoading(false)
    }
  }, [page, labelFilter])

  const fetchChart = React.useCallback(async () => {
    try {
      const res = await fetch(`/apiv2/reviews`, { cache: "no-store" })
      if (!res.ok) {
        throw new Error(`Upstream responded with ${res.status}`)
      }
      const data: ReviewsApiResponse = await res.json()
      if (data && Array.isArray(data.items)) {
        setChartItems(data.items)
        setChartMeta(data.meta)
      } else {
        const maybeArray = data as unknown
        if (Array.isArray(maybeArray)) {
          setChartItems(maybeArray as Review[])
          setChartMeta({ total: (maybeArray as any[]).length, page: 1, page_size: (maybeArray as any[]).length, has_next: false, has_prev: false })
        } else {
          setChartItems([])
          setChartMeta({ total: 0, page: 1, page_size: 0, has_next: false, has_prev: false })
        }
      }
      setLastFetchedAt(new Date())
    } catch {
      // fallback for chart
      setChartItems(SAMPLE_REVIEWS)
      setChartMeta({ total: SAMPLE_REVIEWS.length, page: 1, page_size: SAMPLE_REVIEWS.length, has_next: false, has_prev: false })
    }
  }, [])

  React.useEffect(() => {
    void fetchReviews()
  }, [fetchReviews])
  React.useEffect(() => {
    void fetchChart()
  }, [fetchChart])

  // Aggregate counts by prediction label (ALL reviews for chart)
  const chartAgg = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const r of chartItems) {
      const label = r?.prediction?.label || "UNKNOWN"
      map.set(label, (map.get(label) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }))
  }, [chartItems])

  // Build ChartContainer config and chart data with theme colors
  const { chartData, chartConfig, labelToColor } = React.useMemo(() => {
    // Vibrant, accessible palette (12 colors)
    const PALETTE = [
      "#6366F1", // indigo
      "#EF4444", // red
      "#10B981", // emerald
      "#F59E0B", // amber
      "#8B5CF6", // violet
      "#EC4899", // pink
      "#22D3EE", // cyan
      "#84CC16", // lime
      "#F97316", // orange
      "#14B8A6", // teal
      "#EAB308", // yellow
      "#3B82F6", // blue
    ] as const

    const config: Record<string, { label: string; color: string }> = {}
    const mapping: Record<string, string> = {}

    const data = chartAgg.map((item, idx) => {
      const key = toKey(item.label)
      const color = PALETTE[idx % PALETTE.length]
      config[key] = {
        label: item.label,
        color,
      }
      mapping[item.label] = color
      return {
        label: item.label,
        value: item.count,
        // The ChartContainer exposes --color-{key} CSS variables for each config entry
        fill: `var(--color-${key})`,
      }
    })
    return { chartData: data, chartConfig: config, labelToColor: mapping }
  }, [chartAgg])

  const totalOnPage = React.useMemo(() => items.length, [items])
  const totalOverall = chartMeta?.total ?? chartItems.length

  const availableLabels = React.useMemo(() => {
    const set = new Set<string>()
    for (const r of chartItems) {
      if (r?.prediction?.label) set.add(r.prediction.label)
    }
    return Array.from(set)
  }, [chartItems])

  async function sendVerification(id: string, verdict: Verdict) {
    try {
      // Find the review to send helpful metadata
      const r = items.find((rv: Review) => rv.id === id)
      await fetch("/apiv2/reviews/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          verdict,
          meta: r
            ? {
                label: r.prediction?.label,
                confidence: r.prediction?.confidence,
                predicted_at: r.predicted_at,
                source: r.metadata?.source,
              }
            : undefined,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (e) {
      // Non-blocking; we keep local state regardless
      console.error("Failed to submit verification", e)
    }
  }

  function markVerification(id: string, verdict: Verdict) {
    setVerifications((prev) => ({ ...prev, [id]: verdict }))
    void sendVerification(id, verdict)
  }

  return (
    <main className="container mx-auto max-w-5xl p-4 md:p-8">
      <Card>
        <Tabs defaultValue="chart">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Review Predictions</CardTitle>
              <CardDescription>
                Explore predictions as a pie chart or review individual items and verify labels.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="chart" className="w-full md:w-auto">
                  Chart
                </TabsTrigger>
                <TabsTrigger value="reviews" className="w-full md:w-auto">
                  Reviews
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Select
                  value={labelFilter || "__all"}
                  onValueChange={(val) => {
                    const next = val === "__all" ? "" : val
                    setPage(1)
                    setLabelFilter(next)
                  }}
                >
                  <SelectTrigger className="min-w-[160px]" aria-label="Filter by label">
                    <SelectValue placeholder="All labels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All labels</SelectItem>
                    {availableLabels.map((lbl) => (
                      <SelectItem key={lbl} value={lbl}>
                        {lbl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => fetchReviews()} variant="secondary" disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
                <Button asChild>
                  <Link href="/reviews/results">View Results</Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Couldn{"'"}t load live data</AlertTitle>
                <AlertDescription>
                  {error}. Showing sample data instead. If you{"'"}re running over HTTPS, the upstream HTTP endpoint may
                  be blocked by the browser. In production, proxy this endpoint through a secure Route Handler (as
                  implemented here at /apiv2/reviews) or enable HTTPS on the upstream server.
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value="chart" className="space-y-4">
              <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                <span>
                  Total Reviews: <span className="font-medium text-foreground">{totalOverall}</span>
                </span>
                <span>· Page: <span className="font-medium text-foreground">{meta?.page ?? page}</span></span>
                {lastFetchedAt && <span className="ml-2">· Last fetched {lastFetchedAt.toLocaleTimeString()}</span>}
                {usedFallback && <span className="ml-2">· Using sample data</span>}
              </div>

              <ChartContainer
                config={chartConfig}
                className="h-[70vh] w-full min-h-[360px] [&_.recharts-wrapper]:pb-10 [&_.recharts-legend-wrapper]:inset-x-0"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={chartData} dataKey="value" nameKey="label">
                    <LabelList
                      dataKey="label"
                      position="outside"
                      className="fill-foreground"
                      stroke="none"
                      fontSize={12}
                    />
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="label" />}
                    className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/3 [&_*]:justify-center"
                  />
                </PieChart>
              </ChartContainer>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Reviews on page: {items.length}</span>
                {typeof meta?.page_size === "number" && <span>· Page size: {meta.page_size}</span>}
                <span>· Page: {meta?.page ?? page}</span>
                {lastFetchedAt && <span>· Last fetched {lastFetchedAt.toLocaleTimeString()}</span>}
                {usedFallback && <span>· Using sample data</span>}
              </div>

              <ScrollArea className="h-[60vh] pr-2">
                <div className="grid gap-3">
                  {items.map((r) => {
                  const verdict = verifications[r.id]
                  const reviewLabel = r.prediction?.label || "UNKNOWN"
                  const reviewLabelColor = labelToColor[reviewLabel]
                  return (
                    <div key={r.id} className="rounded-md border p-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p
                                className="text-sm font-medium"
                                style={reviewLabelColor ? { color: reviewLabelColor } : undefined}
                                title={reviewLabel}
                              >
                                {reviewLabel}
                              </p>
                              {typeof r.prediction?.confidence === "number" && (
                                <span className="text-xs text-muted-foreground">
                                  {(r.prediction.confidence * 100).toFixed(2)}% confidence
                                </span>
                              )}
                              {verdict && (
                                <Badge variant={verdict === "correct" ? "default" : "destructive"}>
                                  {verdict === "correct" ? "Marked correct" : "Marked incorrect"}
                                </Badge>
                              )}
                            </div>
                             {r.predicted_at && (
                              <p className="text-xs text-muted-foreground">
                                Predicted at: {new Date(r.predicted_at).toLocaleString()}
                              </p>
                            )}
                            {r.metadata?.source && (
                              <p className="text-xs text-muted-foreground">Source: {r.metadata.source}</p>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-foreground">{r.text}</p>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className={
                              verdict === "correct"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200"
                            }
                            onClick={() => markVerification(r.id, "correct")}
                            aria-label={`Mark review ${r.id} label as correct`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Correct
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className={
                              verdict === "incorrect"
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200"
                            }
                            onClick={() => markVerification(r.id, "incorrect")}
                            aria-label={`Mark review ${r.id} label as incorrect`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark Incorrect
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {items.length === 0 && <p className="text-sm text-muted-foreground">No reviews found.</p>}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isLoading || !(meta?.has_prev ?? page > 1)}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="text-xs text-muted-foreground">
                  Page {meta?.page ?? page}{typeof meta?.page_size === "number" && typeof meta?.total === "number" ? ` of ${Math.max(1, Math.ceil(meta.total / Math.max(1, meta.page_size)))}` : ""}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isLoading || !(meta?.has_next ?? false)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </main>
  )
}
