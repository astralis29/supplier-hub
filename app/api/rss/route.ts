export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";

import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: (...args) => fetch(...args)
    }
  }
);

function cleanHtml(html: string | undefined) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

/* INDUSTRY RELEVANCE FILTER */

const industryTerms = [
  "mine",
  "mining",
  "lithium",
  "copper",
  "nickel",
  "iron ore",
  "steel",
  "factory",
  "manufacturing",
  "plant",
  "energy",
  "gas",
  "oil",
  "construction",
  "infrastructure",
  "supply chain",
  "logistics",
  "port",
  "engineering",
  "industrial"
];

function isIndustryRelevant(text: string) {

  const lower = text.toLowerCase();

  return industryTerms.some(term => lower.includes(term));
}

async function fetchRSS(url: string) {

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {

    const res = await fetch(url, {
      signal: controller.signal,
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

    return await res.text();

  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {

  try {

    /* Load RSS sources */
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
        message: "No RSS sources"
      });
    }

    /* Load keywords */
    const { data: keywords } = await supabase
      .from("industry_keywords")
      .select("industry_id, keyword");

    const results = await Promise.all(

      sources.map(async (source) => {

        try {

          const xml = await fetchRSS(source.url);
          const feed = await parser.parseString(xml);

          const articles: any[] = [];

          for (const item of feed.items) {

            const title = cleanHtml(item.title);
            const description = cleanHtml(item.contentSnippet || item.content);

            const combined = `${title} ${description}`.toLowerCase();

            /* Skip irrelevant general news */
            if (!isIndustryRelevant(combined)) continue;

            /* Match industry keywords */
            const match = keywords?.find(k =>
              combined.includes(k.keyword.toLowerCase())
            );

            if (!match) continue;

            const guid = item.guid || item.link;
            if (!guid) continue;

            if (!item.pubDate) continue;

            const articleDate = new Date(item.pubDate);

            const now = new Date();
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);

            /* Only today + yesterday */
            if (articleDate < yesterday) continue;

            articles.push({
              industry_id: match.industry_id,
              rss_source_id: source.id,
              title,
              description,
              url: item.link,
              guid,
              published_at: item.pubDate
                ? new Date(item.pubDate)
                : null
            });

          }

          /* Batch insert */
          if (articles.length > 0) {

            const { error } = await supabase
              .from("industry_news")
              .upsert(articles, { onConflict: "guid" });

            if (error) {
              console.log("Insert failed for:", source.url);
              return { processed: true, inserted: 0 };
            }

            return {
              processed: true,
              inserted: articles.length
            };

          }

          return {
            processed: true,
            inserted: 0
          };

        } catch {

          console.log("Feed failed:", source.url);

          return {
            processed: false,
            inserted: 0
          };

        }

      })
    );

    const processedFeeds = results.filter(r => r.processed).length;

    const articlesInserted = results.reduce(
      (sum, r) => sum + r.inserted,
      0
    );

    return Response.json({
      success: true,
      feedsProcessed: processedFeeds,
      articlesInserted
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