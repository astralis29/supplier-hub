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
/* TEXT NORMALIZATION                               */
/* ------------------------------------------------ */

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")   // remove punctuation
    .replace(/\s+/g, " ")       // collapse spaces
    .trim();
}

function containsKeyword(text: string, keyword: string) {
  return text.includes(keyword.toLowerCase());
}

/* ------------------------------------------------ */
/* RISK KEYWORDS + SCORING                          */
/* ------------------------------------------------ */

const riskKeywords: Record<string, number> = {

  strike: 70,
  walkout: 70,
  shutdown: 70,
  closure: 70,
  collapse: 70,
  bankruptcy: 80,

  explosion: 70,
  fire: 60,
  accident: 60,
  derailment: 60,

  outage: 60,
  blackout: 60,

  shortage: 50,
  delay: 40,
  disruption: 45,
  congestion: 40,

  halt: 50,
  suspended: 50,

  tensions: 30,

  "port strike": 80,
  "port congestion": 60,
  "shipping disruption": 60,
  "freight disruption": 60,

  "rail disruption": 70,
  "rail strike": 80,

  "mine shutdown": 80,
  "mine closure": 80,

  "refinery outage": 70,
  "smelter shutdown": 70,

  "factory shutdown": 70,

  sanction: 50,
  sanctions: 50,

  conflict: 50,
  war: 60,
  invasion: 70,

  cyclone: 60,
  hurricane: 60,
  storm: 50,

  flood: 50,
  wildfire: 60,

  earthquake: 70,

  drought: 40,

  "bridge collapse": 80,
  "port closure": 70
};

function calculateRiskScore(text: string) {

  let score = 0;

  Object.entries(riskKeywords).forEach(([word, value]) => {
    if (containsKeyword(text, word)) score += value;
  });

  if (score > 100) score = 100;

  return score;
}

/* ------------------------------------------------ */
/* SUPPLY CHAIN KEYWORDS                            */
/* ------------------------------------------------ */

const supplyChainKeywords: Record<string, number> = {

  mining: 20,
  lithium: 25,
  copper: 25,
  iron: 20,
  nickel: 20,

  oil: 25,
  gas: 25,
  lng: 25,
  refinery: 25,
  pipeline: 20,

  logistics: 20,
  port: 20,
  shipping: 20,
  freight: 20,
  rail: 15,

  manufacturing: 20,
  factory: 20,
  production: 20,

  infrastructure: 15,
  construction: 15
};

function calculateSupplyChainScore(text: string) {

  let score = 0;

  Object.entries(supplyChainKeywords).forEach(([word, value]) => {
    if (containsKeyword(text, word)) score += value;
  });

  if (score > 100) score = 100;

  return score;
}

/* ------------------------------------------------ */
/* INDUSTRY DETECTION                               */
/* ------------------------------------------------ */

const industryDetection: Record<string, string[]> = {

  mining: ["mine", "mining", "lithium", "copper", "nickel"],

  energy: ["oil", "gas", "lng", "refinery", "pipeline"],

  logistics: ["shipping", "freight", "port", "rail", "cargo"],

  manufacturing: ["factory", "manufacturing", "plant"],

  infrastructure: ["construction", "infrastructure", "bridge"]
};

function detectIndustry(
  text: string,
  keywords: { industry_id: number; keyword: string }[]
) {

  const keywordMatch = keywords.find(k =>
    text.includes(k.keyword.toLowerCase())
  );

  if (keywordMatch) return keywordMatch.industry_id;

  for (const [industry, words] of Object.entries(industryDetection)) {

    for (const word of words) {

      if (text.includes(word)) {

        const found = keywords.find(k =>
          k.keyword.toLowerCase().includes(industry)
        );

        if (found) return found.industry_id;

      }

    }

  }

  return null;
}

/* ------------------------------------------------ */
/* CLEAN HTML                                       */
/* ------------------------------------------------ */

function cleanHtml(html: string | undefined) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
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

    if (!res.ok) throw new Error(`RSS request failed: ${res.status}`);

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

    const { data: sources } = await supabase
      .from("rss_sources")
      .select("*")
      .eq("active", true);

    const { data: keywords } = await supabase
      .from("industry_keywords")
      .select("industry_id, keyword");

    const results = await Promise.all(

      (sources || []).map(async (source) => {

        try {

          const xml = await fetchRSS(source.url);
          const feed = await parser.parseString(xml);

          const articles: any[] = [];

          for (const item of feed.items) {

            const title = cleanHtml(item.title);
            const description = cleanHtml(item.contentSnippet || item.content);

            const combined = normalizeText(`${title} ${description}`);

            const guid = item.guid || item.link;
            if (!guid || !item.pubDate) continue;

            const articleDate = new Date(item.pubDate);

            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            if (articleDate < twoDaysAgo) continue;

            const riskScore = calculateRiskScore(combined);
            const supplyScore = calculateSupplyChainScore(combined);

            const industryId = detectIndustry(combined, keywords || []);

            /* Skip useless news */
            if (riskScore === 0 && supplyScore === 0) continue;

            articles.push({
              industry_id: industryId,
              rss_source_id: source.id,
              title,
              description,
              url: item.link || "",
              guid,
              risk_score: riskScore,
              supply_chain_score: supplyScore,
              published_at: articleDate
            });

          }

          if (articles.length > 0) {

            await supabase
              .from("industry_news")
              .upsert(articles, { onConflict: "guid" });

            return { processed: true, inserted: articles.length };

          }

          return { processed: true, inserted: 0 };

        } catch {

          console.log("Feed failed:", source.url);
          return { processed: false, inserted: 0 };

        }

      })
    );

    const processedFeeds = results.filter(r => r.processed).length;
    const articlesInserted = results.reduce((sum, r) => sum + r.inserted, 0);

    return Response.json({
      success: true,
      feedsProcessed: processedFeeds,
      articlesInserted
    });

  } catch (error: any) {

    return Response.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );

  }

}