import Parser from "rss-parser"

export async function GET() {

  const parser = new Parser()

  const feeds = [
    "https://feeds.fastcast.ai/seattle-storm-the-daily-news-now.xml",
"https://feeds.fastcast.ai/phoenix-mercury-the-daily-news-now.xml",
"https://feeds.fastcast.ai/minnesota-lynx-the-daily-news-now.xml",
"https://feeds.fastcast.ai/new-york-liberty-the-daily-news-now.xml",
"https://feeds.fastcast.ai/las-vegas-aces-the-daily-news-now.xml",
  ]

  let items: any[] = []

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl)

      items.push(
        ...feed.items.slice(0, 3).map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate
        }))
      )
    } catch (err) {
      console.error("RSS error:", err)
    }
  }

  items = items
    .sort((a, b) =>
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )
    .slice(0, 6)

  return Response.json(items)
}