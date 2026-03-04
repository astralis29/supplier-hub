import { supabase } from "./supabase";

export const suppliers = [
  {
    name: "Aussie Metal Works",
    abn: "51824753556",
    country: "Australia",
    industry: "Manufacturing",
    capability: "General Fabrication",
  },
  {
    name: "Precision CNC Australia",
    abn: "92123456789",
    country: "Australia",
    industry: "Manufacturing",
    capability: "CNC Machining",
  },
];

/* SUPPLY CHAIN ALERT KEYWORDS */
const alertKeywords = [
  "strike",
  "shortage",
  "shutdown",
  "fire",
  "bankruptcy",
  "insolvency",
  "disruption",
  "delay",
  "sanction",
  "collapse",
];

/* RISK SCORE CALCULATOR */
function calculateRiskScore(text: string) {

  let score = 0;

  if (text.includes("shutdown")) score += 40;
  if (text.includes("strike")) score += 35;
  if (text.includes("bankruptcy")) score += 40;
  if (text.includes("collapse")) score += 40;
  if (text.includes("shortage")) score += 25;
  if (text.includes("delay")) score += 15;
  if (text.includes("disruption")) score += 25;
  if (text.includes("fire")) score += 30;
  if (text.includes("sanction")) score += 20;

  return score;
}

/* INDUSTRY SIGNALS */
export async function getIndustrySignals() {

  const { data } = await supabase
    .from("industry_news")
 .select(`
  title,
  description,
  url,
  published_at,
  industry_id
`)
    .order("published_at", { ascending: false })
    .limit(5);

  return data;
}


/* SUPPLY CHAIN ALERTS */
export async function getSupplyChainAlerts() {

  const { data } = await supabase
    .from("industry_news")
    .select(`
      title,
      description,
      url,
      published_at,
      industries (name)
    `)
    .order("published_at", { ascending: false })
    .limit(20);

  if (!data) return [];

  const alerts = data
    .map((item: any) => {

      const text = `${item.title} ${item.description}`.toLowerCase();

      const hasAlert = alertKeywords.some(keyword =>
        text.includes(keyword)
      );

      if (!hasAlert) return null;

      const riskScore = calculateRiskScore(text);

      return {
        ...item,
        riskScore
      };

    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.riskScore - a.riskScore);

  return alerts.slice(0, 1);
}