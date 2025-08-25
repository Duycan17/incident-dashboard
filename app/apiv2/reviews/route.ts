import { NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/config"

export async function GET(req: Request) {
  const upstreamBase = API_CONFIG.UPSTREAM_SERVICES.REVIEWS
  try {
    const url = new URL(req.url)
    const page = url.searchParams.get("page")
    const label = url.searchParams.get("label")

    const upstreamUrl = new URL(upstreamBase)
    if (page) {
      upstreamUrl.searchParams.set("page", page)
      // Apply default page size only when paginating
      upstreamUrl.searchParams.set("page_size", API_CONFIG.SETTINGS.DEFAULT_PAGE_SIZE.toString())
    }
    if (label) upstreamUrl.searchParams.set("label", label)

    const res = await fetch(upstreamUrl.toString(), {
      cache: "no-store",
      headers: { accept: "application/json" },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream error", status: res.status },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      )
    }

    const data = await res.json()
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch upstream" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
