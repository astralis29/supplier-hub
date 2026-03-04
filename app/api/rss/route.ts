export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";

import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser({
  requestOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  }
});

/* ---------- HTTPS AGENT FIX ---------- */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
/* ------------------------------------ */

function cleanHtml(html: string | undefined) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchRSS(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      Accept: "application/rss+xml, application/xml, text/xml"
    },
    redirect: "follow",
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`RSS fetch failed: ${res.status} ${url}`);
  }

  return await res.text();
}

export async function GET() {
  try {

    /* 1️⃣ Get active RSS sources */
    const { data: sources, error: sourceError } = await supabase
      .from("rss_sources")
      .select("*")
      .eq("active", true);

    if (sourceError) {
      return Response.json({ error: sourceError.message }, { status: 500 });
    }

    if (!sources || sources.length === 0) {
      return Response.json({ message: "No sources found" });
    }

    /* 2️⃣ Load keywords once */
    const { data: keywords, error: keywordError } = await supabase
      .from("industry_keywords")
      .select("industry_id, keyword");

    if (keywordError) {
      return Response.json({ error: keywordError.message }, { status: 500 });
    }

    if (!keywords || keywords.length === 0) {
      return Response.json({ message: "No keywords configured" });
    }

    let processedFeeds = 0;
    let insertedArticles = 0;

    /* 3️⃣ Loop RSS feeds */
    for (const source of sources) {

      let feed;

      try {

        const cleanUrl = source.url.replace("#", "");

        let xml;

        try {
          console.log("Fetching RSS:", cleanUrl);
xml = await fetchRSS(cleanUrl);
        } catch (err) {
          console.log("RSS DOWNLOAD FAILED:", cleanUrl);
          continue;
        }

        try {
          feed = await parser.parseString(xml);
        } catch (err) {
          console.log("RSS PARSE FAILED:", cleanUrl);
          continue;
        }

        processedFeeds++;

      } catch (err) {
        console.log("RSS failed:", source.url);
        continue;
      }

      for (const item of feed.items) {

        const title = cleanHtml(item.title);
        const description = cleanHtml(item.contentSnippet || item.content);

        const combinedText = `${title} ${description}`.toLowerCase();

        /* 4️⃣ Match keyword */
        const match = keywords.find(k => {
          const keyword = k.keyword?.toLowerCase().trim();
          return keyword && combinedText.includes(keyword);
        });

        if (!match) continue;
        if (!item.guid && !item.link) continue;

        const guid = item.guid || item.link;

        /* 5️⃣ Insert article */
        const { error } = await supabase
          .from("industry_news")
          .upsert(
            {
              industry_id: match.industry_id,
              rss_source_id: source.id,
              title,
              description,
              url: item.link,
              guid,
              published_at: item.pubDate
                ? new Date(item.pubDate)
                : null
            },
            { onConflict: "guid" }
          );

        if (!error) insertedArticles++;
      }
    }

    return Response.json({
      success: true,
      feedsProcessed: processedFeeds,
      articlesInserted: insertedArticles
    });

  } catch (error: any) {

  console.error("RSS ROUTE ERROR:", error);

  return Response.json(
    {
      error: error?.message || "Unknown error",
      stack: error?.stack || null
    },
    { status: 500 }
 ); } }