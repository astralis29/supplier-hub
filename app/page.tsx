export const revalidate = 300

import SearchSection from "./components/SearchSection"
import { getRSSData } from "@/lib/rss"
import { Pool } from "pg"

/* ---------------- DB ---------------- */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
})

/* ---------------- TAG HELPER ---------------- */

function extractTag(title: string) {
  const t = title.toLowerCase()

  if (t.includes("steel")) return "Steel"
  if (t.includes("mining")) return "Mining"
  if (t.includes("logistics")) return "Logistics"
  if (t.includes("construction")) return "Construction"
  if (t.includes("energy")) return "Energy"

  return "General"
}

/* ---------------- HOME ---------------- */

export default async function Home() {

  /* ---------------- SAFE DATA FETCH ---------------- */

  let countryResult: any = { rows: [] }
  let industrialTrending: any = { rows: [] }
  let businessTrending: any = { rows: [] }

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
        SELECT capability, COUNT(*) AS total
        FROM supplier_profiles, UNNEST(capabilities) AS capability
        WHERE sector != 'industrial'
        GROUP BY capability
        ORDER BY total DESC
        LIMIT 6
      `)
    ])

    countryResult = results[0]
    industrialTrending = results[1]
    businessTrending = results[2]

  } catch (err) {
    console.error("DB ERROR:", err)
  }

  /* ---------------- RSS ---------------- */

  let rssItems: any[] = []

  try {
    rssItems = await getRSSData()
  } catch (err) {
    console.error("RSS fetch failed", err)
  }

  /* ---------------- FORMAT ---------------- */

  const countries = countryResult?.rows?.map((r: any) => r.country) || []

  const industrialCapabilities =
    industrialTrending?.rows?.map((r: any) => r.capability) || []

  const businessCapabilities =
    businessTrending?.rows?.map((r: any) => r.capability) || []

  /* ---------------- PAGE ---------------- */

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
            Real-time supplier discovery powered by live market signals.
          </p>

          {/* ✅ CLEAN CLIENT COMPONENT */}
          <SearchSection countries={countries} />

          <div className="mt-6 flex flex-wrap justify-center gap-3">

            {industrialCapabilities.slice(0, 5).map((cap: string) => (
              <a
                key={cap}
                href={`/search?capability=${encodeURIComponent(cap)}`}
                className="px-3 py-1 bg-white border rounded-full text-sm hover:bg-gray-50 shadow-sm"
              >
                {cap}
              </a>
            ))}

          </div>

        </div>

      </section>

      {/* 🚨 BREAKING SIGNAL */}

      {rssItems
        .filter((i: any) => i?.isBreaking)
        .slice(0, 1)
        .map((item: any, i: number) => (

          <section key={i} className="max-w-5xl mx-auto px-6 mt-10">

            <a
              href={item.link}
              target="_blank"
              className="block bg-red-600 text-white rounded-xl p-6 shadow-lg hover:bg-red-700 transition"
            >

              <div className="text-xs uppercase tracking-wide opacity-80 mb-2">
                🚨 Breaking Supply Chain Signal
              </div>

              <div className="text-lg font-semibold leading-snug">
                {item.title}
              </div>

              <div className="text-xs mt-2 opacity-80">
                {item.source} • {item.hoursAgo ?? "recent"}h ago
              </div>

            </a>

          </section>

        ))}

      {/* TRENDING */}

      <section className="max-w-7xl mx-auto py-14 px-6">

        <div className="grid md:grid-cols-2 gap-8">

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">

            <h3 className="font-semibold mb-2">⚙ Trending Industrial</h3>

            <div className="flex flex-wrap justify-center gap-2">

              {industrialCapabilities.map((cap: string) => (
                <a
                  key={cap}
                  href={`/search?capability=${encodeURIComponent(cap)}`}
                  className="px-3 py-1 bg-gray-100 border rounded text-xs hover:bg-white hover:shadow"
                >
                  {cap}
                </a>
              ))}

            </div>

          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">

            <h3 className="font-semibold mb-2">💼 Business Services</h3>

            <div className="flex flex-wrap justify-center gap-2">

              {businessCapabilities.map((cap: string) => (
                <a
                  key={cap}
                  href={`/search?capability=${encodeURIComponent(cap)}`}
                  className="px-3 py-1 bg-gray-100 border rounded text-xs hover:bg-white hover:shadow"
                >
                  {cap}
                </a>
              ))}

            </div>

          </div>

        </div>

      </section>

      {/* 🧠 INTELLIGENCE FEED */}

      <section className="max-w-7xl mx-auto py-14 px-6">

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

          <h3 className="font-semibold mb-6 text-center">
            🧠 Live Supply Chain Intelligence
          </h3>

          <div className="space-y-3">

            {rssItems.map((item: any, i: number) => (

              <a
                key={i}
                href={item.link}
                target="_blank"
                className="flex justify-between items-start gap-4 p-4 rounded-lg border hover:bg-gray-50 transition"
              >

                <div className="flex-1">

                  <div className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                    {item.title}
                  </div>

                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span>{item.source}</span>

                    {item.hoursAgo !== null && (
                      <>
                        <span>•</span>
                        <span>{item.hoursAgo}h ago</span>
                      </>
                    )}
                  </div>

                </div>

                <div className="flex flex-col items-end gap-2">

                  <div className={`text-xs px-2 py-1 rounded ${
                    item.score >= 5
                      ? "bg-red-100 text-red-600"
                      : item.score >= 3
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {item.score >= 5 ? "HIGH" : item.score >= 3 ? "MED" : "LOW"}
                  </div>

                  <div className="text-[10px] text-gray-400 uppercase">
                    {item.category || extractTag(item.title)}
                  </div>

                </div>

              </a>

            ))}

          </div>

        </div>

      </section>

      {/* 🧬 THEMES */}

      <section className="max-w-7xl mx-auto px-6 pb-10">

        <div className="grid md:grid-cols-3 gap-6">

          {["Steel", "Mining", "Logistics"].map((theme) => {

            const filtered = rssItems
              .filter((i: any) => (i.category || extractTag(i.title)) === theme)
              .slice(0, 3)

            if (filtered.length === 0) return null

            return (

              <div key={theme} className="bg-white border rounded-xl p-4">

                <h4 className="text-sm font-semibold mb-3">{theme}</h4>

                <div className="space-y-2">

                  {filtered.map((item: any, i: number) => (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      className="block text-xs hover:underline line-clamp-2"
                    >
                      {item.title}
                    </a>
                  ))}

                </div>

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