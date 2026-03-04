export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";

import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function cleanHtml(html: string | undefined) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
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
    throw new Error(`RSS request failed: ${res.status}`);
  }

  return res.text();
}

export async function GET() {
  try {

    /* Get RSS sources */
const { data: sources, error: sourcesError } = await supabase
  .from("rss_sources")
  .select("*")
  .eq("active", true);

if (sourcesError) {
  return Response.json({
    error: "Supabase query failed",
    details: sourcesError.message
  });
}

if (!sources || sources.length === 0) {
  return Response.json({
    message: "Query ran but returned zero rows",
    sources
  });
}
    /* Load keywords */
    const { data: keywords } = await supabase
      .from("industry_keywords")
      .select("industry_id, keyword");

    let processedFeeds = 0;
    let insertedArticles = 0;

    for (const source of sources) {

      try {

        const xml = await fetchRSS(source.url);
        const feed = await parser.parseString(xml);

        processedFeeds++;

        for (const item of feed.items) {

          const title = cleanHtml(item.title);
          const description = cleanHtml(item.contentSnippet || item.content);

          const combined = `${title} ${description}`.toLowerCase();

          const match = keywords?.find(k =>
            combined.includes(k.keyword.toLowerCase())
          );

          if (!match) continue;

          const guid = item.guid || item.link;
          if (!guid) continue;

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

      } catch (err) {
        console.log("Feed failed:", source.url);
        continue;
      }

    }

    return Response.json({
      success: true,
      feedsProcessed: processedFeeds,
      articlesInserted: insertedArticles
    });

  } catch (error: any) {

    return Response.json(
      {
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );

  }
}