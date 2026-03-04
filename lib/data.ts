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

/* INDUSTRY SIGNALS */
export async function getIndustrySignals() {

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

  const alerts = data.filter((item: any) => {

    const text = `${item.title} ${item.description}`.toLowerCase();

    return alertKeywords.some(keyword => text.includes(keyword));

  });

  return alerts.slice(0, 1);
}