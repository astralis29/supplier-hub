export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {

    const testFeed =
      "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml";

    console.log("Testing RSS fetch:", testFeed);

    const res = await fetch(testFeed, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml"
      },
      redirect: "follow",
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`RSS request failed: ${res.status}`);
    }

    const xml = await res.text();

    return Response.json({
      success: true,
      message: "RSS fetch works",
      xmlLength: xml.length
    });

  } catch (error: any) {

    console.error("RSS TEST ERROR:", error);

    return Response.json(
      {
        error: error?.message || "Unknown error",
        stack: error?.stack || null
      },
      { status: 500 }
    );

  }
}