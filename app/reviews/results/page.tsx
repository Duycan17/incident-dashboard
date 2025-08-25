"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, LabelList, BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts"
import Link from "next/link"

type StatsResponse = {
  meta: { total: number; last_updated: string | null }
  counts: { total: number; correct: number; incorrect: number; tp: number; tn: number; fp: number; fn: number }
  metrics: { accuracy: number; precision: number; recall: number; f1: number }
}

export default function ResultsPage() {
  const [stats, setStats] = React.useState<StatsResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchStats = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/apiv2/reviews/stats", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: StatsResponse = await res.json()
      setStats(data)
    } catch (e: any) {
      setError(e?.message || "Không thể tải thống kê")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  const chartData = React.useMemo(() => {
    const s = stats?.counts
    if (!s) return [] as Array<{ label: string; value: number; fill: string }>
    return [
      { label: "TP", value: s.tp, fill: "var(--color-tp)" },
      { label: "FP", value: s.fp, fill: "var(--color-fp)" },
      { label: "TN", value: s.tn, fill: "var(--color-tn)" },
      { label: "FN", value: s.fn, fill: "var(--color-fn)" },
    ]
  }, [stats])

  const barData = React.useMemo(() => {
    const m = stats?.metrics
    if (!m) return [] as Array<{ name: string; value: number; fill: string }>
    return [
      { name: "Accuracy", value: m.accuracy, fill: "var(--color-accuracy)" },
      { name: "Precision", value: m.precision, fill: "var(--color-precision)" },
      { name: "Recall", value: m.recall, fill: "var(--color-recall)" },
      { name: "F1", value: m.f1, fill: "var(--color-f1)" },
    ]
  }, [stats])

  const chartConfig = {
    tp: { label: "True Positive", color: "#16a34a" },
    fp: { label: "False Positive", color: "#ef4444" },
    tn: { label: "True Negative", color: "#0ea5e9" },
    fn: { label: "False Negative", color: "#f59e0b" },
    accuracy: { label: "Accuracy", color: "#6366f1" },
    precision: { label: "Precision", color: "#22c55e" },
    recall: { label: "Recall", color: "#06b6d4" },
    f1: { label: "F1-Score", color: "#8b5cf6" },
  } as const

  return (
    <main className="container mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Kết quả xác nhận</h1>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link href="/reviews">Quay lại Reviews</Link>
          </Button>
          <Button onClick={() => fetchStats()} disabled={isLoading}>{isLoading ? "Đang làm mới..." : "Làm mới"}</Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Tổng quan</CardTitle>
          <CardDescription>
            {stats?.meta.last_updated ? (
              <>Cập nhật gần nhất: {new Date(stats.meta.last_updated).toLocaleString()}</>
            ) : (
              <>Chưa có dữ liệu xác nhận</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
            <div className="text-2xl font-semibold">{(stats?.metrics.accuracy ?? 0).toFixed(3)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Precision</div>
            <div className="text-2xl font-semibold">{(stats?.metrics.precision ?? 0).toFixed(3)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Recall</div>
            <div className="text-2xl font-semibold">{(stats?.metrics.recall ?? 0).toFixed(3)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">F1</div>
            <div className="text-2xl font-semibold">{(stats?.metrics.f1 ?? 0).toFixed(3)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Confusion Matrix (đếm)</CardTitle>
            <CardDescription>Phân bổ TP/FP/TN/FN</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[50vh] w-full min-h-[320px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={chartData} dataKey="value" nameKey="label">
                  <LabelList dataKey="label" position="outside" className="fill-foreground" stroke="none" fontSize={12} />
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="label" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/3 [&_*]:justify-center" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chỉ số</CardTitle>
            <CardDescription>Accuracy, Precision, Recall, F1</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[50vh] w-full min-h-[320px]">
              <BarChart data={barData} margin={{ left: 16, right: 16 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


