import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side service role
);

function cleanHtml(html: string | undefined) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, "") // remove html tags
    .replace(/\s+/g, " ")
    .trim();
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


    // 2️⃣ Load keywords ONCE (huge performance improvement)
    const { data: keywords, error: keywordError } = await supabase
      .from("industry_keywords")
      .select("industry_id, keyword");

    if (keywordError) {
      return Response.json({ error: keywordError.message }, { status: 500 });
    }

    if (!keywords || keywords.length === 0) {
      return Response.json({ message: "No keywords configured" });
    }


    // 3️⃣ Loop RSS feeds
    for (const source of sources) {

      let feed;

      try {
        feed = await parser.parseURL(source.url);
      } catch (err) {
        console.log("RSS failed:", source.url);
        continue;
      }

      for (const item of feed.items) {

        const title = cleanHtml(item.title);
        const description = cleanHtml(item.contentSnippet || item.content);

        const combinedText = `${title} ${description}`.toLowerCase();


        // 4️⃣ Match keyword
        const match = keywords.find(k =>
          combinedText.includes(k.keyword.toLowerCase())
        );

        if (!match) continue;


        // skip if no guid
        if (!item.guid && !item.link) continue;


        // 5️⃣ Insert article
        await supabase.from("industry_news").upsert(
          {
            industry_id: match.industry_id,
            rss_source_id: source.id,
            title,
            description,
            url: item.link,
            guid: item.guid || item.link,
            published_at: item.pubDate
              ? new Date(item.pubDate)
              : null
          },
          {
            onConflict: "guid"
          }
        );
      }
    }

    return Response.json({
      success: true,
      feedsProcessed: sources.length
    });

  } catch (error) {

    console.error(error);

    return Response.json(
      { error: "RSS ingestion failed" },
      { status: 500 }
    );
  }
}