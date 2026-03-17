import Parser from "rss-parser"

const parser = new Parser()

/* ---------------- TYPES ---------------- */

export type RSSItem = {
  title: string
  link: string
  pubDate?: string
  source: string
  score: number
  hoursAgo: number | null
  category: string
  isBreaking: boolean
}

/* ---------------- FEEDS ---------------- */

const FEEDS = [
  "https://www.afr.com/rss/business",
  "https://www.abc.net.au/news/feed/51892/rss.xml",
  "https://www.supplychaindive.com/feeds/news/",
  "https://www.manmonthly.com.au/feed/",
  "https://www.mining.com/feed/"
]

/* ---------------- CACHE ---------------- */

let CACHE: RSSItem[] = []
let LAST_FETCH = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/* ---------------- KEYWORDS ---------------- */

const KEYWORDS = [
  { word: "supply chain", weight: 3 },
  { word: "manufacturing", weight: 2 },
  { word: "logistics", weight: 2 },
  { word: "procurement", weight: 2 },
  { word: "mining", weight: 2 },
  { word: "construction", weight: 2 },
  { word: "steel", weight: 3 },
  { word: "energy", weight: 2 }
]

/* ---------------- HELPERS ---------------- */

function scoreArticle(title: string): number {
  const lower = title.toLowerCase()
  let score = 0

  for (const k of KEYWORDS) {
    if (lower.includes(k.word)) {
      score += k.weight
    }
  }

  if (lower.includes("australia")) score += 1

  return score
}

function hoursAgo(date?: string): number | null {
  if (!date) return null
  const diff = Date.now() - new Date(date).getTime()
  return Math.floor(diff / 3600000)
}

function getCategory(title: string): string {
  const t = title.toLowerCase()

  if (t.includes("steel")) return "Steel"
  if (t.includes("mining")) return "Mining"
  if (t.includes("logistics")) return "Logistics"
  if (t.includes("construction")) return "Construction"
  if (t.includes("energy")) return "Energy"

  return "General"
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^\w\s]/g, "").trim()
}

/* ---------------- FETCH WITH TIMEOUT ---------------- */

async function fetchFeed(url: string) {
  try {
    return await Promise.race([
      parser.parseURL(url),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 3500)
      )
    ])
  } catch {
    return null
  }
}

/* ---------------- MAIN FUNCTION ---------------- */

export async function getRSSData(): Promise<RSSItem[]> {

  /* ✅ CACHE HIT */
  if (Date.now() - LAST_FETCH < CACHE_TTL && CACHE.length > 0) {
    return CACHE
  }

  try {

    const feeds = await Promise.all(FEEDS.map(fetchFeed))

    let items: RSSItem[] = feeds
      .filter((feed): feed is NonNullable<typeof feed> => Boolean(feed))
      .flatMap(feed =>
        feed.items.map(item => {

          const title = item.title || ""
          const hrs = hoursAgo(item.pubDate)
          const baseScore = scoreArticle(title)

          const recencyBoost =
            hrs !== null && hrs < 6 ? 3 :
            hrs !== null && hrs < 12 ? 2 :
            hrs !== null && hrs < 24 ? 1 : 0

          const finalScore = baseScore + recencyBoost

          return {
            title,
            link: item.link || "",
            pubDate: item.pubDate || "",
            source: (feed.title || "News").replace("RSS Feed", "").trim(),
            score: finalScore,
            hoursAgo: hrs,
            category: getCategory(title),
            isBreaking: finalScore >= 6
          }
        })
      )

    /* ---------------- DEDUPE (BETTER) ---------------- */

    const seen = new Set<string>()

    items = items.filter(item => {
      const key = normalize(item.title) + item.link
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    /* ---------------- SORT ---------------- */

    items.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (a.hoursAgo ?? 999) - (b.hoursAgo ?? 999)
    })

    const finalItems = items.slice(0, 25)

    /* ✅ SAVE CACHE */
    CACHE = finalItems
    LAST_FETCH = Date.now()

    return finalItems

  } catch (err) {
    console.error("RSS ERROR:", err)

    /* fallback to cache if available */
    return CACHE.length > 0 ? CACHE : []
  }
}