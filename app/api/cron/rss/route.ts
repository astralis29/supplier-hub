import { NextResponse } from "next/server";

export async function GET() {
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL;

    if (!site) {
      return NextResponse.json({ error: "Site URL not configured" }, { status: 500 });
    }

    const res = await fetch(`${site}/api/rss`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json({
      success: true,
      rssTriggered: true,
      result: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Cron failed", details: String(error) },
      { status: 500 }
    );
  }
}