"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { RefreshCw, TrendingUp, Target, Zap, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type MetricsData = {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  totalVerifications: number
  correctPredictions: number
  incorrectPredictions: number
  verificationsByLabel: Record<string, {
    total: number
    correct: number
    incorrect: number
    accuracy: number
  }>
}

type MetricsResponse = {
  metrics: MetricsData
  lastUpdated: string
}

const COLORS = ['#6366F1', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

export default function ResultsPage() {
  const [metrics, setMetrics] = React.useState<MetricsData | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [persistenceStatus, setPersistenceStatus] = React.useState<any>(null)

  const fetchMetrics = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [metricsResponse, statusResponse] = await Promise.all([
        fetch('/apiv2/metrics', { cache: 'no-store' }),
        fetch('/apiv2/status', { cache: 'no-store' })
      ])
      
      if (!metricsResponse.ok) {
        throw new Error(`Failed to fetch metrics: ${metricsResponse.status}`)
      }
      
      const metricsData: MetricsResponse = await metricsResponse.json()
      setMetrics(metricsData.metrics)
      setLastUpdated(metricsData.lastUpdated)
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setPersistenceStatus(statusData)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load metrics')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const overallChartData = React.useMemo(() => {
    if (!metrics) return []
    
    return [
      { name: 'Correct', value: metrics.correctPredictions, color: COLORS[2] },
      { name: 'Incorrect', value: metrics.incorrectPredictions, color: COLORS[1] }
    ]
  }, [metrics])

  const labelChartData = React.useMemo(() => {
    if (!metrics) return []
    
    return Object.entries(metrics.verificationsByLabel).map(([label, data]) => ({
      label,
      accuracy: Math.round(data.accuracy * 100),
      total: data.total,
      correct: data.correct,
      incorrect: data.incorrect
    }))
  }, [metrics])

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`

  return (
    <main className="container mx-auto max-w-6xl p-4 md:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Model Performance Results</h1>
            <p className="text-muted-foreground">
              Accuracy metrics based on human verification of predictions
            </p>
          </div>
          <Button onClick={fetchMetrics} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error Loading Metrics</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* No Data Alert */}
        {metrics && metrics.totalVerifications === 0 && (
          <Alert>
            <AlertTitle>No Verification Data</AlertTitle>
            <AlertDescription>
              No predictions have been verified yet. Go to the Reviews page and mark some predictions as correct or incorrect to see metrics here.
            </AlertDescription>
          </Alert>
        )}

        {/* Metrics Cards */}
        {metrics && metrics.totalVerifications > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(metrics.accuracy)}</div>
                  <p className="text-xs text-muted-foreground">
                    Overall prediction accuracy
                  </p>
                  <Progress value={metrics.accuracy * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Precision</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(metrics.precision)}</div>
                  <p className="text-xs text-muted-foreground">
                    Positive prediction accuracy
                  </p>
                  <Progress value={metrics.precision * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recall</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(metrics.recall)}</div>
                  <p className="text-xs text-muted-foreground">
                    Ability to find all positives
                  </p>
                  <Progress value={metrics.recall * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">F1 Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(metrics.f1Score)}</div>
                  <p className="text-xs text-muted-foreground">
                    Harmonic mean of precision & recall
                  </p>
                  <Progress value={metrics.f1Score * 100} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Summary</CardTitle>
                <CardDescription>
                  Overview of all human verifications
                  {lastUpdated && ` • Last updated: ${new Date(lastUpdated).toLocaleString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{metrics.totalVerifications}</Badge>
                      <span>Total Verifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        {metrics.correctPredictions}
                      </Badge>
                      <span>Correct Predictions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{metrics.incorrectPredictions}</Badge>
                      <span>Incorrect Predictions</span>
                    </div>
                  </div>
                  
                  {/* Persistence Status */}
                  {persistenceStatus && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">Data Persistence Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-2 bg-muted rounded">
                          <div className="font-medium">Results File</div>
                          <div className="text-muted-foreground">
                            {persistenceStatus.persistence?.resultsFile?.exists ? (
                              <>
                                <div>✅ Saved ({persistenceStatus.persistence.resultsFile.recordCount} records)</div>
                                <div>{(persistenceStatus.persistence.resultsFile.size / 1024).toFixed(1)} KB</div>
                              </>
                            ) : (
                              <div>❌ No data file</div>
                            )}
                          </div>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <div className="font-medium">Backup</div>
                          <div className="text-muted-foreground">
                            {persistenceStatus.persistence?.backupFile?.exists ? (
                              <>
                                <div>✅ Available</div>
                                <div>{(persistenceStatus.persistence.backupFile.size / 1024).toFixed(1)} KB</div>
                              </>
                            ) : (
                              <div>⚠️ No backup</div>
                            )}
                          </div>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <div className="font-medium">Activity Log</div>
                          <div className="text-muted-foreground">
                            {persistenceStatus.persistence?.logFile?.exists ? (
                              <>
                                <div>✅ Active</div>
                                <div>{(persistenceStatus.persistence.logFile.size / 1024).toFixed(1)} KB</div>
                              </>
                            ) : (
                              <div>⚠️ No log</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <Card>
              <Tabs defaultValue="overview">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Performance Analysis</CardTitle>
                      <CardDescription>
                        Visual breakdown of model performance
                      </CardDescription>
                    </div>
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="by-label">By Label</TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>

                <CardContent>
                  <TabsContent value="overview" className="space-y-4">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={overallChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {overallChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>

                  <TabsContent value="by-label" className="space-y-4">
                    {labelChartData.length > 0 ? (
                      <>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={labelChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" />
                              <YAxis />
                              <Tooltip 
                                formatter={(value, name) => [
                                  name === 'accuracy' ? `${value}%` : value,
                                  name === 'accuracy' ? 'Accuracy' : name
                                ]}
                              />
                              <Bar dataKey="accuracy" fill={COLORS[0]} name="Accuracy %" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Performance by Label</h4>
                          <div className="grid gap-2">
                            {labelChartData.map((item, index) => (
                              <div key={item.label} className="flex items-center justify-between p-2 rounded border">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <span className="font-medium">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span>{item.accuracy}% accuracy</span>
                                  <span className="text-muted-foreground">
                                    {item.correct}/{item.total} correct
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No label-specific data available
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
