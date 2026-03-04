import { supabase } from "./supabase";

/* INDUSTRY SIGNALS */

export async function getIndustrySignals() {

  const { data, error } = await supabase
    .from("industry_news")
    .select(`
      title,
      description,
      url,
      published_at
    `)
    .order("published_at", { ascending: false })
    .limit(6);

  if (error) {
    console.log("Signals error:", error);
    return [];
  }

  return data || [];
}

/* SUPPLY CHAIN ALERTS */

export async function getSupplyChainAlerts() {

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
    "collapse"
  ];

  const { data } = await supabase
    .from("industry_news")
    .select(`
      title,
      description,
      url,
      published_at
    `)
    .order("published_at", { ascending: false })
    .limit(20);

  if (!data) return [];

  const alerts = data.filter((item: any) => {

    const text = `${item.title} ${item.description}`.toLowerCase();

    return alertKeywords.some(keyword =>
      text.includes(keyword)
    );

  });

  return alerts.slice(0, 1);
}