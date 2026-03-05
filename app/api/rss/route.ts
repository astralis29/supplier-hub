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


  /* ENERGY */

  oil: 25,
  crude: 25,
  petroleum: 25,
  gas: 25,
  lng: 25,
  refinery: 25,
  refining: 20,
  pipeline: 20,
  drilling: 20,
  offshore: 20,
  upstream: 20,
  downstream: 20,
  opec: 20,
  energy: 20,
  power: 20,
  electricity: 20,
  grid: 20,
  utility: 20,
  renewable: 20,
  solar: 20,
  wind: 20,
  windfarm: 20,
  hydrogen: 20,
  nuclear: 25,
  uranium: 25,
  reactor: 20,
  turbine: 20,
  biofuel: 20,


  /* DEFENCE */

  defence: 25,
  defense: 25,
  military: 25,
  army: 20,
  navy: 20,
  airforce: 20,
  weapons: 20,
  missile: 20,
  drone: 20,
  fighter: 20,
  jet: 20,
  submarine: 20,
  radar: 20,
  artillery: 20,
  ammunition: 20,
  warship: 20,
  shipyard: 20,
  satellite: 20,
  spaceforce: 20,
  ballistic: 20,
  hypersonic: 20,


  /* MINING & METALS */

  mining: 25,
  mine: 25,
  copper: 25,
  iron: 20,
  ironore: 20,
  nickel: 20,
  lithium: 25,
  cobalt: 25,
  zinc: 20,
  lead: 20,
  aluminium: 20,
  bauxite: 20,
  steel: 20,
  coal: 20,
  gold: 20,
  silver: 20,
  platinum: 20,
  palladium: 20,
  rareearth: 25,
  rareearths: 25,
  graphite: 20,
  manganese: 20,
  commodity: 15,
  commodities: 15,
  smelter: 20,
  metallurgical: 20,


  /* BATTERIES / EV */

  battery: 20,
  batteries: 20,
  ev: 20,
  electricvehicle: 20,
  cathode: 20,
  anode: 20,
  gigafactory: 25,
  charging: 20,
  chargingstation: 20,
  energy_storage: 20,


  /* SEMICONDUCTORS / TECHNOLOGY */

  semiconductor: 25,
  chip: 25,
  chips: 25,
  fab: 20,
  foundry: 20,
  silicon: 20,
  wafer: 20,
  microchip: 20,
  processor: 20,
  gpu: 20,
  cpu: 20,
  ai: 15,
  datacenter: 20,
  cloud: 20,
  server: 20,
  electronics: 20,
  hardware: 20,


  /* MANUFACTURING / INDUSTRIAL */

  factory: 20,
  manufacturing: 20,
  plant: 20,
  production: 20,
  industrial: 20,
  machinery: 20,
  equipment: 20,
  automation: 20,
  robotics: 20,
  assembly: 20,
  fabrication: 20,
  machining: 20,
  tooling: 20,


  /* LOGISTICS / TRANSPORT */

  port: 20,
  shipping: 20,
  freight: 20,
  logistics: 20,
  cargo: 20,
  container: 20,
  vessel: 20,
  tanker: 20,
  bulkcarrier: 20,
  shippinglane: 20,
  rail: 15,
  railway: 15,
  trucking: 15,
  transport: 15,
  airline: 20,
  airport: 20,
  aviation: 20,


  /* INFRASTRUCTURE */

  infrastructure: 20,
  construction: 20,
  bridge: 20,
  tunnel: 20,
  highway: 20,
  dam: 20,
  railwayproject: 20,
  portproject: 20,
  megaproject: 20,
  engineering: 20,
  contractor: 20,


  /* CHEMICALS / MATERIALS */

  chemical: 20,
  chemicals: 20,
  petrochemical: 20,
  fertilizer: 20,
  ammonia: 20,
  plastics: 20,
  polymer: 20,
  resin: 20,
  composites: 20,
  steelplant: 20,
  materials: 20,


  /* AGRICULTURE / FOOD */

  agriculture: 20,
  farming: 20,
  wheat: 20,
  corn: 20,
  grain: 20,
  soybean: 20,
  fertiliser: 20,
  foodproduction: 20,
  livestock: 20,
  dairy: 20,
  crop: 20,


  /* AEROSPACE */

  aerospace: 25,
  aircraft: 25,
  aviations: 20,
  satellites: 20,
  rocket: 20,
  spacex: 20,
  launch: 20,
  spacecraft: 20,


  /* AUTOMOTIVE */

  automotive: 20,
  vehicle: 20,
  carmaker: 20,
  automaker: 20,
  electriccar: 20,
  batteryplant: 20,
  drivetrain: 20,


  /* TELECOM / NETWORKS */

  telecom: 20,
  telecommunications: 20,
  network: 20,
  broadband: 20,
  fiber: 20,
  satelliteinternet: 20,


  /* PHARMA / BIOTECH */

  pharmaceutical: 20,
  pharma: 20,
  biotech: 20,
  vaccine: 20,
  drug: 20,
  medicine: 20,
  laboratory: 20

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

const articleDate = new Date(item.pubDate || Date.now());

            const riskScore = calculateRiskScore(combined);
            const supplyScore = calculateSupplyChainScore(combined);

            const industryId = detectIndustry(combined, keywords || []);

            /* Skip useless news */
           if (riskScore === 0 && supplyScore === 0 && !industryId) continue;

            articles.push({
              industry_id: industryId ?? null,
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

            const { data, error } = await supabase
  .from("industry_news")
  .upsert(articles, { onConflict: "guid" });

if (error) {
  console.error("SUPABASE INSERT ERROR:", error);
}

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