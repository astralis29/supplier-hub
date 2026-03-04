import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // must use service key server-side
);

function cleanHtml(html: string | undefined) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, "") // remove all html tags
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  try {
    // 1️⃣ Get active RSS sources
    const { data: sources } = await supabase
      .from("rss_sources")
      .select("*")
      .eq("active", true);

    if (!sources) return Response.json({ message: "No sources found" });

    for (const source of sources) {
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items) {
        const title = cleanHtml(item.title);
        const description = cleanHtml(item.contentSnippet || item.content);

        const combinedText = `${title} ${description}`.toLowerCase();

        // 2️⃣ Match industry keyword
        const { data: keywords } = await supabase
          .from("industry_keywords")
          .select("industry_id, keyword");

        if (!keywords) continue;

        const match = keywords.find(k =>
          combinedText.includes(k.keyword.toLowerCase())
        );

        if (!match) continue;

        // 3️⃣ Insert classified article
        await supabase.from("industry_news").upsert(
          {
            industry_id: match.industry_id,
            rss_source_id: source.id,
            title,
            description,
            url: item.link,
            guid: item.guid,
            published_at: item.pubDate
              ? new Date(item.pubDate)
              : null
          },
          { onConflict: "guid" }
        );
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "RSS ingestion failed" }, { status: 500 });
  }
}   