import Parser from "rss-parser"

export async function GET() {

  const parser = new Parser()

  const feeds = [
    "https://www.supplychaindive.com/feeds/news/",
    "https://www.freightwaves.com/feed",
    "https://www.joc.com/rss.xml"
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