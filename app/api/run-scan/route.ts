import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const taxonomy: Record<string, string[]> = {
  Defence: ["defence", "defense", "military", "aerospace", "naval"],
  "General Fabrication": ["fabrication", "welding", "metal works"],
  FMCG: ["fmcg", "consumer goods"],
  Meat: ["meat processing", "abattoir", "protein supply"],
};

function extractABNs(text: string) {
  // Match 11 digits possibly separated by spaces
  const regex = /\b(?:\d\s?){11}\b/g;

  const matches = text.match(regex) || [];

  // Remove spaces so ABN becomes clean 11-digit string
  return matches.map((abn) => abn.replace(/\s/g, ""));
}

function classify(text: string) {
  const lower = text.toLowerCase();
  const results: Record<string, number> = {};

  for (const category in taxonomy) {
    let score = 0;

    taxonomy[category].forEach((keyword) => {
      if (lower.includes(keyword)) score++;
    });

    if (score > 0) results[category] = score;
  }

  return results;
}

async function fetchHTML(rawUrl: string) {
  try {
    let url = rawUrl.trim();

    // Add https:// if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.log("Fetch failed:", url, response.status);
      return null;
    }

    return await response.text();
  } catch (err) {
    console.log("Fetch failed:", rawUrl);
    return null;
  }

}


export async function GET() {
  const { data: domains, error } = await supabase
    .from("domains")
    .select("*")
    .eq("scanned", false)
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message });
  }

  if (!domains || domains.length === 0) {
    return NextResponse.json({ message: "No domains to scan" });
  }

  for (const row of domains) {
    const html = await fetchHTML(row.domain);

    if (!html) continue;

    const abns = extractABNs(html);

    if (abns.length === 0) {
      await supabase
        .from("domains")
        .update({ scanned: true })
        .eq("id", row.id);

      continue;
    }

    const categories = classify(html);

    // Insert supplier
    await supabase.from("suppliers").insert({
      name: row.domain,
      abn: abns[0],
      website: `https://${row.domain}`,
      categories: categories,
    });

    // Mark domain as scanned
    await supabase
      .from("domains")
      .update({
        scanned: true,
        last_scanned_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  }

  return NextResponse.json({ message: "Batch processed" });
}