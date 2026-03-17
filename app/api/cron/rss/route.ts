import { NextResponse } from "next/server"
import { getRSSData } from "@/lib/rss"

export async function GET() {
  try {
    const data = await getRSSData()

    return NextResponse.json({
      success: true,
      rssTriggered: true,
      result: data
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Cron failed", details: String(error) },
      { status: 500 }
    )
  }
}