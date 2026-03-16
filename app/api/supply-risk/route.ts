import Parser from "rss-parser"

export async function GET() {

  const parser = new Parser()

  const feeds = [
    "https://feeds.fastcast.ai/seattle-storm-the-daily-news-now.xml",
    "https://feeds.fastcast.ai/phoenix-mercury-the-daily-news-now.xml",
    "https://feeds.fastcast.ai/minnesota-lynx-the-daily-news-now.xml",
    "https://feeds.fastcast.ai/new-york-liberty-the-daily-news-now.xml",
    "https://www.supplychaindive.com/feeds/news/",
    "https://www.freightwaves.com/feed",
    "https://www.joc.com/rss.xml",
    "https://maritime-executive.com/rss/news",
    "https://feeds.fastcast.ai/las-vegas-aces-the-daily-news-now.xml",
    "https://gcaptain.com/feed",
    "https://www.afr.com/rss/business",
    "https://www.abc.net.au/news/feed/51892/rss.xml",
    "https://www.theaustralian.com.au/business/rss",
    "https://www.mining.com/feed/",
    "https://oilprice.com/rss/main",
  ]

  /* INDUSTRY FILTER TERMS */

  const industryTerms = [
    "freight","logistics","shipping","cargo","container","port",
    "supply chain","transport","rail","trucking","air freight","derail","cyclone","bushfire",

    "mining","mine","lithium","copper","iron ore","nickel",
    "rare earth","steel","coal","metals","commodity","blockade","price surge","strait",

    "oil","gas","lng","energy","pipeline","refinery",
    "power","electricity","grid","renewable","solar","wind",

    "manufacturing","factory","plant","production","semiconductor"
  ]

  let items: any[] = []

  for (const feedUrl of feeds) {

    try {

      const feed = await parser.parseURL(feedUrl)

      const filtered = feed.items
        .slice(0,5)

        /* FILTER FIRST */

        .filter(item => {

          const text = `${item.title ?? ""} ${item.contentSnippet ?? ""} ${item.content ?? ""}`.toLowerCase()

          const coreTerms = [
"supply chain",
"shipping",
"freight",
"logistics",
"port",
"container",
"cargo",
"rail",
"trucking",
"strait",
"freight",
"Shipping",
"Cargo",
"Haulage",
"Transit",
"Carrier",
"Fleet",
"Intermodal",
"Linehaul",
"Freight forwarding",
"Shipping lanes",
"Disruption",
"Shortage",
"Bottleneck",
"Delays",
"Strike",
"Sanctions",
"Tariffs",
]

const hasIndustry = industryTerms.some(term => text.includes(term))
const hasCore = coreTerms.some(term => text.includes(term))

return hasIndustry && hasCore

        })

        /* THEN MAP */

        .map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate
        }))

      items.push(...filtered)

    } catch (err) {

      console.error("RSS error:", feedUrl)

    }

  }

  /* REMOVE DUPLICATES */

  items = items.filter(
    (v, i, a) => a.findIndex(t => t.title === v.title) === i
  )

  /* SORT */

  items = items
    .sort((a, b) =>
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )
    .slice(0, 6)

  return Response.json(items)

}