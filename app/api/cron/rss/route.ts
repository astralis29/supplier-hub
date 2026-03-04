import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // 1️⃣ Secure the endpoint
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2️⃣ Call your ingestion endpoint
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/rss`);

  if (!res.ok) {
    return NextResponse.json({ error: "RSS job failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}