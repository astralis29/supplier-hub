import Parser from "rss-parser"

export const revalidate = 300

const parser = new Parser()

/* ---------------- TYPES ---------------- */

type RSSItem = {
  title: string
  link: string
  pubDate?: string
  source: string
  score?: number
  hoursAgo?: number | null
}

/* ---------------- FEEDS ---------------- */

const FEEDS = [
  "https://www.afr.com/rss/business",
  "https://www.abc.net.au/news/feed/51892/rss.xml",
  "https://www.supplychaindive.com/feeds/news/",
  "https://www.manmonthly.com.au/feed/",
  "https://www.mining.com/feed/"
]

/* ---------------- KEYWORDS ---------------- */

const KEYWORDS = [
  "supply chain",
  "manufacturing",
  "logistics",
  "procurement",
  "mining",
  "construction",
  "steel",
  "energy"
]

/* ---------------- SCORING ---------------- */

function scoreArticle(title: string) {
  const lower = title.toLowerCase()
  let score = 0

  for (const word of KEYWORDS) {
    if (lower.includes(word)) score += 2
  }

  if (lower.includes("australia")) score += 1

  return score
}

function hoursAgo(date?: string) {
  if (!date) return null
  const diff = Date.now() - new Date(date).getTime()
  return Math.floor(diff / 3600000)
}

/* ---------------- API ---------------- */

export async function GET() {

  try {

    const feeds = await Promise.all(
      FEEDS.map(url => parser.parseURL(url).catch(() => null))
    )

    let items: RSSItem[] = feeds
      .filter(Boolean)
      .flatMap(feed =>
        feed!.items.map(item => ({
          title: item.title || "",
          link: item.link || "",
          pubDate: item.pubDate || "",
          source: feed!.title?.replace("RSS Feed", "") || "News"
        }))
      )

    /* ---------------- DEDUPE ---------------- */

    const seen = new Set<string>()

    items = items.filter(item => {
      if (seen.has(item.title)) return false
      seen.add(item.title)
      return true
    })

    /* ---------------- SCORE + ENRICH ---------------- */

    items = items.map(item => ({
      ...item,
      score: scoreArticle(item.title),
      hoursAgo: hoursAgo(item.pubDate)
    }))

    /* ---------------- SORT ---------------- */

    items.sort((a, b) => {

      const scoreA = a.score ?? 0
      const scoreB = b.score ?? 0

      if (scoreB !== scoreA) return scoreB - scoreA

      const timeA = a.hoursAgo ?? 999
      const timeB = b.hoursAgo ?? 999

      return timeA - timeB
    })

    /* ---------------- RESPONSE ---------------- */

    return Response.json({
      items: items.slice(0, 20)
    })

  } catch (err) {

    console.error(err)

    return Response.json({
      items: []
    })

  }
}