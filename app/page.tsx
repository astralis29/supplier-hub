export const revalidate = 300

import SearchSection from "./components/SearchSection"
import { getRSSData } from "@/lib/rss"
import { Pool } from "pg"
import { toTitleCase } from "@/lib/utils"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
})

function extractTag(title: string) {
  const t = title.toLowerCase()

  if (t.includes("steel")) return "Steel"
  if (t.includes("mining")) return "Mining"
  if (t.includes("logistics")) return "Logistics"
  if (t.includes("construction")) return "Construction"
  if (t.includes("energy")) return "Energy"

  return "General"
}

export default async function Home() {

  let countryResult: any = { rows: [] }
  let industrialTrending: any = { rows: [] }
  let totalSuppliers = 0

  try {
    const results = await Promise.all([
      pool.query(`SELECT DISTINCT country FROM supplier_profiles ORDER BY country`),

      pool.query(`
        SELECT capability, COUNT(*) AS total
        FROM supplier_profiles, UNNEST(capabilities) AS capability
        WHERE sector = 'industrial'
        GROUP BY capability
        ORDER BY total DESC
        LIMIT 6
      `),

      pool.query(`
        SELECT COUNT(*) AS total
        FROM supplier_profiles
        WHERE capabilities IS NOT NULL
        AND array_length(capabilities, 1) > 0
      `)
    ])

    countryResult = results[0]
    industrialTrending = results[1]
    totalSuppliers = results[2]?.rows?.[0]?.total || 0

  } catch (err) {
    console.error("DB ERROR:", err)
  }

  let rssItems: any[] = []

  try {
    rssItems = await getRSSData()
  } catch (err) {
    console.error("RSS fetch failed", err)
  }

  const countries = countryResult?.rows?.map((r: any) => r.country) || []
  const industrialCapabilities = industrialTrending?.rows?.map((r: any) => r.capability) || []

  return (

    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100">

      {/* HERO */}
      <section
        className="relative h-[65vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: "url('/forest-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >

        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 w-full px-6">

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Supply Chain Intelligence
          </h1>

          <p className="text-lg text-gray-200 mb-10">
            Search verified suppliers enriched with real-time market intelligence.
          </p>

          <SearchSection countries={countries} />

          {/* ✅ FIXED CAPABILITY CHIPS */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">

            {industrialCapabilities.slice(0, 5).map((cap: string) => (
              <a
                key={cap}
                href={`/search?q=${encodeURIComponent(cap)}`}   // ✅ FIXED
                className="px-3 py-1 bg-white/90 border rounded-full text-sm hover:bg-white shadow-sm backdrop-blur"
              >
                {toTitleCase(cap)}
              </a>
            ))}

          </div>

        </div>

      </section>

      {/* RSS TICKER */}
      <div className="w-full bg-black text-white overflow-hidden border-b border-gray-800">
        <div className="whitespace-nowrap animate-scroll flex gap-10 py-2 px-4 text-sm">

          {[...rssItems.slice(0, 15), ...rssItems.slice(0, 15)].map((item: any, i: number) => (
            <a key={i} href={item.link} target="_blank" className="flex items-center gap-2 hover:text-gray-300 transition">
              <span className="text-red-400">●</span>
              <span className="font-medium">{item.title}</span>
              <span className="text-gray-400 text-xs">({item.source})</span>
            </a>
          ))}

        </div>
      </div>

      {/* 🔥 SUPPLIERS DISCOVERED + LIVE */}
      <section className="max-w-5xl mx-auto px-6 mt-10 text-center">

        <div className="flex items-center justify-center gap-2">

          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
            {Number(totalSuppliers).toLocaleString()}
          </h2>

          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            LIVE
          </span>

        </div>

        <p className="text-sm text-gray-500 mt-1">
          Suppliers With Verified Capabilities
        </p>

      </section>

      {/* THEMES */}
      <section className="max-w-7xl mx-auto px-6 pb-16 pt-14">

        <h3 className="text-center font-semibold mb-8">
          🧬 Market Intelligence by Sector
        </h3>

        <div className="grid md:grid-cols-3 gap-6">

          {["Steel", "Mining", "Logistics", "Freight", "Energy", "Defence"].map((theme) => {

            const filtered = rssItems
              .filter((i: any) => (i.category || extractTag(i.title)) === theme)
              .sort((a: any, b: any) => b.score - a.score)
              .slice(0, 3)

            if (filtered.length === 0) return null

            return (

              <div key={theme} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">

                <h4 className="text-sm font-semibold mb-4">{theme}</h4>

                <div className="space-y-3">

                  {filtered.map((item: any, i: number) => (

                    <a key={i} href={item.link} target="_blank" className="block group">

                      <div className="text-xs font-medium text-gray-800 group-hover:underline line-clamp-2">
                        {item.title}
                      </div>

                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">

                        <span>{item.source}</span>

                        <span className={`px-1.5 py-0.5 rounded ${
                          item.score >= 5
                            ? "bg-red-100 text-red-600"
                            : item.score >= 3
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {item.score >= 5 ? "HIGH" : item.score >= 3 ? "MED" : "LOW"}
                        </span>

                      </div>

                    </a>

                  ))}

                </div>

                {/* ✅ FIXED VIEW SUPPLIERS */}
                <a
                  href={`/search?q=${theme.toLowerCase()}`}   // ✅ FIXED
                  className="block mt-4 text-xs text-blue-600 hover:underline"
                >
                  View suppliers →
                </a>

              </div>

            )

          })}

        </div>

      </section>

      <footer className="py-10 bg-black text-gray-400 text-center text-sm">
        © {new Date().getFullYear()} What's the Supplier?
      </footer>

    </main>
  )
}