import { NextResponse } from "next/server";

export async function GET() {
  try {

    const site = process.env.NEXT_PUBLIC_SITE_URL;

    const res = await fetch(`${site}/api/rss`, {
      method: "GET",
      cache: "no-store"
    });

    const data = await res.json();

    return NextResponse.json({
      success: true,
      rssTriggered: true,
      result: data
    });

  } catch (error) {

    return NextResponse.json(
      { error: "Cron failed", details: String(error) },
      { status: 500 }
    );

  }
}