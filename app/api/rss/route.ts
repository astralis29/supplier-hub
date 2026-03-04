export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";

import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";
import https from "https";

const parser = new Parser({
  requestOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function cleanHtml(html: string | undefined) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fetchRSS(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        },
        res => {
          let data = "";

          res.on("data", chunk => {
            data += chunk;
          });

          res.on("end", () => {
            resolve(data);
          });
        }
      )
      .on("error", err => {
        reject(err);
      });
  });
}

export async function GET() {
  try {

    // 1️⃣ Get active RSS sources
    const { data: sources, error: sourceError } = await supabase
      .from("rss_sources")
      .select("*")
      .eq("active", true);

    if (sourceError) {
      return Response.json({ error: sourceError.message }, { status: 500 });
    }

    if (!sources || sources.length === 0) {
      return Response.json({ message: "No sources found" });
    }

    // 2️⃣ Load keywords once
    const { data: keywords, error: keywordError } = await supabase
      .from("industry_keywords")
      .select("industry_id, keyword");

    if (keywordError) {
      return Response.json({ error: keywordError.message }, { status: 500 });
    }

    if (!keywords || keywords.length === 0) {
      return Response.json({ message: "No keywords configured" });
    }

    let processedFeeds = 0;
    let insertedArticles = 0;

    // 3️⃣ Loop RSS feeds
    for (const source of sources) {

      let feed;

      try {

        const cleanUrl = source.url.replace("#", "");

        let xml;

        try {
          xml = await fetchRSS(cleanUrl);
        } catch (err) {
          console.log("RSS DOWNLOAD FAILED:", cleanUrl);
          continue;
        }

        try {
          feed = await parser.parseString(xml);
        } catch (err) {
          console.log("RSS PARSE FAILED:", cleanUrl);
          continue;
        }

        processedFeeds++;

      } catch (err) {
        console.log("RSS failed:", source.url);
        continue;
      }

      for (const item of feed.items) {

        const title = cleanHtml(item.title);
        const description = cleanHtml(item.contentSnippet || item.content);

        const combinedText = `${title} ${description}`.toLowerCase();

        // 4️⃣ Match keyword
        const match = keywords.find(k => {
          const keyword = k.keyword?.toLowerCase().trim();
          return keyword && combinedText.includes(keyword);
        });

        if (!match) continue;

        if (!item.guid && !item.link) continue;

        const guid = item.guid || item.link;

        // 5️⃣ Insert article
        const { error } = await supabase
          .from("industry_news")
          .upsert(
            {
              industry_id: match.industry_id,
              rss_source_id: source.id,
              title,
              description,
              url: item.link,
              guid,
              published_at: item.pubDate
                ? new Date(item.pubDate)
                : null
            },
            { onConflict: "guid" }
          );

        if (!error) insertedArticles++;
      }
    }

    return Response.json({
      success: true,
      feedsProcessed: processedFeeds,
      articlesInserted: insertedArticles
    });

  } catch (error) {

    console.error(error);

    return Response.json(
      { error: "RSS ingestion failed" },
      { status: 500 }
    );
  }
}