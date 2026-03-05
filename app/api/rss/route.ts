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
/* EXPANDED RISK KEYWORDS + SCORING                 */
/* ------------------------------------------------ */

const riskKeywords: Record<string, number> = {

  strike: 70,
  walkout: 70,
  shutdown: 70,
  closure: 70,
  collapse: 70,
  bankruptcy: 80,
  insolvency: 80,
  liquidation: 80,

  explosion: 70,
  fire: 60,
  accident: 60,
  incident: 50,
  derailment: 60,
  spill: 50,
  "chemical leak": 60,
  "gas leak": 60,

  outage: 60,
  blackout: 60,
  "power outage": 60,
  closes: 80,

  shortage: 50,
  scarcity: 50,
  delay: 40,
  disruption: 45,
  bottleneck: 40,
  congestion: 40,
  backlog: 40,

  halt: 50,
  halted: 50,
  suspended: 50,
  suspension: 50,

  slowdown: 30,
  tensions: 30,

  "port strike": 70,
  "port congestion": 50,
  "shipping disruption": 50,
  "freight disruption": 50,
  "shipping delay": 40,
  "freight delay": 40,

  "rail disruption": 60,
  "rail strike": 70,
  "railway shutdown": 60,

  "trucking strike": 70,
  "truck shortage": 50,

  "logistics disruption": 50,
  "cargo backlog": 40,

  "canal blockage": 70,
  disruptions: 50,

  "mine shutdown": 70,
  "mine closure": 70,
  "mine accident": 70,
  "mine fire": 60,

  "production halt": 60,
  "production disruption": 50,
  "output cut": 50,

  "smelter outage": 60,
  "smelter shutdown": 60,

  "refinery outage": 60,
  "refinery shutdown": 60,

  "plant shutdown": 60,
  "factory shutdown": 60,
  "factory fire": 60,

  "power plant outage": 60,
  "grid failure": 60,
  "energy shortage": 50,

  "oil disruption": 50,
  "gas shortage": 50,
  "pipeline shutdown": 60,
  "pipeline leak": 60,
  "pipeline explosion": 70,

  sanction: 50,
  sanctions: 50,
  tariff: 40,
  tariffs: 40,

  "export ban": 60,
  "import ban": 60,

  "trade restriction": 50,
  "trade barrier": 40,

  "trade war": 60,
  embargo: 60,

  conflict: 50,
  war: 60,
  invasion: 60,
  blockade: 60,
  defence: 60,
  strikes: 50,

  restructuring: 40,
  "financial distress": 50,
  default: 60,

  layoffs: 40,
  "job cuts": 40,

  cyclone: 60,
  hurricane: 60,
  typhoon: 60,
  storm: 50,

  flooding: 50,
  flood: 50,

  wildfire: 60,
  bushfire: 60,

  earthquake: 70,
  landslide: 60,

  heatwave: 40,
  drought: 40,

  "bridge collapse": 70,
  "infrastructure failure": 60,
  "tunnel collapse": 70,

  "port closure": 60,
  "airport closure": 60,

  "road closure": 40,
  "highway closure": 40,

  "network outage": 40,
  "communication outage": 40
};

function calculateRiskScore(text: string) {

  let score = 0;
  const lower = text.toLowerCase();

  Object.entries(riskKeywords).forEach(([word, value]) => {
    if (lower.includes(word)) score += value;
  });

  if (score > 0 && score < 30) score += 10;

  return Math.min(score, 100);
}

/* ------------------------------------------------ */
/* SUPPLY CHAIN KEYWORDS + SCORING                  */
/* ------------------------------------------------ */

const supplyChainKeywords: Record<string, number> = {
  mining: 20,
  lithium: 20,
  copper: 20,
  iron: 15,
  nickel: 15,
  cobalt: 15,
  rare: 15,
  logistics: 20,
  port: 20,
  shipping: 20,
  freight: 20,
  rail: 15,
  steel: 15,
  manufacturing: 20,
  energy: 20,
  refinery: 20,
  smelter: 20,
  construction: 15,
  infrastructure: 15,
  equipment: 15,
  machinery: 15,
  supply: 15,
  production: 15
};

function calculateSupplyChainScore(text: string) {

  let score = 0;
  const lower = text.toLowerCase();

  Object.entries(supplyChainKeywords).forEach(([word, value]) => {
    if (lower.includes(word)) score += value;
  });

  return Math.min(score, 100);
}

/* ------------------------------------------------ */
/* INDUSTRY DETECTION                               */
/* ------------------------------------------------ */

const industryDetection: Record<string, string[]> = {

  mining: ["mine", "mining", "lithium", "copper", "nickel", "iron ore", "smelter"],

  energy: ["oil", "gas", "lng", "refinery", "pipeline", "energy", "power plant"],

  logistics: ["shipping", "freight", "port", "rail", "cargo", "logistics", "trucking"],

  manufacturing: ["factory", "manufacturing", "production", "plant", "industrial"],

  infrastructure: ["construction", "infrastructure", "bridge", "tunnel", "project"]

};

function detectIndustry(text: string, keywords: any[]) {

  const lower = text.toLowerCase();

  const keywordMatch = keywords?.find(k =>
    lower.includes(k.keyword.toLowerCase())
  );

  if (keywordMatch) return keywordMatch.industry_id;

  for (const [industry, words] of Object.entries(industryDetection)) {

    for (const word of words) {

      if (lower.includes(word)) {

        const found = keywords?.find(k =>
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

      sources.map(async (source) => {

        try {

          const xml = await fetchRSS(source.url);
          const feed = await parser.parseString(xml);

          const articles: any[] = [];

          for (const item of feed.items) {

            const title = cleanHtml(item.title);
            const description = cleanHtml(item.contentSnippet || item.content);
            const combined = `${title} ${description}`.toLowerCase();

            const guid = item.guid || item.link;
            if (!guid || !item.pubDate) continue;

            const articleDate = new Date(item.pubDate);

            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            if (articleDate < twoDaysAgo) continue;

            const riskScore = calculateRiskScore(combined);
            const supplyScore = calculateSupplyChainScore(combined);

            const industryId = detectIndustry(combined, keywords);

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