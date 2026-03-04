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