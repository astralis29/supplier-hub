  import { supabase } from "./supabase";

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