import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/*
Fetch latest industry signals
NO filtering here — homepage handles filtering
*/
export async function getIndustrySignals() {

const { data, error } = await supabase
.from("industry_news")
.select(`
  title,
  description,
  url,
  published_at,
  risk_score,
  supply_chain_score
`)
.gte("risk_score", 40)
.or("supply_chain_score.gte.20,event_type.not.is.null,chokepoint.not.is.null")
.order("published_at", { ascending: false })
.limit(30);

  if (error) {
    console.log("Signals error:", error);
    return [];
  }

  // ensure safe values
  return (data ?? []).map((row:any) => ({
    title: row.title,
    description: row.description,
    url: row.url,
    published_at: row.published_at,
    risk_score: row.risk_score ?? 0,
    supply_chain_score: row.supply_chain_score ?? 0
  }));
}


/*
Top disruption alerts across industries
*/
export async function getTopRiskAlerts() {

  const { data, error } = await supabase
    .from("industry_news")
    .select(`
      title,
      risk_score,
      published_at
    `)
    .gte("risk_score", 60)
    .order("risk_score", { ascending: false })
    .limit(10);

  if (error) {
    console.log("Risk alerts error:", error);
    return [];
  }

  return (data ?? []).map((row:any) => ({
    title: row.title,
    risk_score: row.risk_score ?? 0,
    published_at: row.published_at
  }));
}


/*
Calculate supplier risk based on industry signals
*/
export async function getSupplierRisk(industry: string) {

  if (!industry) return 0;

  const { data, error } = await supabase
    .from("industry_news")
    .select("risk_score, title")
    .ilike("title", `%${industry}%`);

  if (error) {
    console.log("Supplier risk error:", error);
    return 0;
  }

  if (!data || data.length === 0) return 0;

  const avg =
    data.reduce((sum:number, r:any) => sum + (r.risk_score ?? 0), 0) /
    data.length;

  return Math.round(avg);
}