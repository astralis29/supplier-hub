export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";

import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: (...args) => fetch(...args)
    }
  }
);

/* ------------------------------------------------ */
/* RISK KEYWORDS + SCORING                          */
/* ------------------------------------------------ */

const riskKeywords: Record<string, number> = {
  strike: 40,
  shortage: 30,
  delay: 20,
  shutdown: 40,
  fire: 35,
  bankruptcy: 50,
  insolvency: 50,
  disruption: 25,
  sanction: 30,
  collapse: 45
};

function calculateRiskScore(text: string) {

  let score = 0;
  const lower = text.toLowerCase();

  Object.entries(riskKeywords).forEach(([word, value]) => {

    if (lower.includes(word)) {
      score += value;
    }

  });

  return Math.min(score, 100);
}

/* ------------------------------------------------ */
/* CLEAN HTML                                       */
/* ------------------------------------------------ */

function cleanHtml(html: string | undefined) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

/* ------------------------------------------------ */
/* INDUSTRY RELEVANCE FILTER                        */
/* ------------------------------------------------ */

const industryTerms = [
  "mining",
  "lithium",
  "copper",
  "iron ore",
  "nickel",
  "rare earth",
  "steel",
  "fabrication",
  "manufacturing",
  "engineering",
  "industrial",
  "infrastructure",
  "energy",
  "renewable",
  "gas",
  "oil",
  "construction",
  "supply chain",
  "logistics",
  "port",
  "processing plant",
  "refinery",
  "mineral",
  "smelter",
  "equipment",
  "machinery"
];

function isIndustryRelevant(text: string) {

  const lower = text.toLowerCase();

  return industryTerms.some(term => lower.includes(term));
}

/* ------------------------------------------------ */
/* FETCH RSS                                        */
/* ------------------------------------------------ */

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

/* ------------------------------------------------ */
/* MAIN RSS INGESTION                               */
/* ------------------------------------------------ */

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

    /* Load industry keywords */
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

/* Detect industry relevance */
const industryRelevant = isIndustryRelevant(combined);

/* Match industry keywords table */
const match = keywords?.find(k =>
  combined.includes(k.keyword.toLowerCase())
);

/* Detect risk signals */
const riskScore = calculateRiskScore(combined);

/* Only keep article if it has industrial relevance OR risk */
if (!industryRelevant && !match && riskScore === 0) continue;

const guid = item.guid || item.link;
if (!guid) continue;

if (!item.pubDate) continue;

articles.push({
  industry_id: match?.industry_id ?? null,
  rss_source_id: source.id,
  title,
  description,
  url: item.link || "",
  guid,
  risk_score: riskScore,
  published_at: new Date(item.pubDate)
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