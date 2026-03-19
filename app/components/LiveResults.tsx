"use client"

import { useEffect, useState } from "react"

export default function LiveResults({ query }: { query: string }) {

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {

    if (query.length < 2) {
      setResults([])
      return
    }

    const timeout = setTimeout(async () => {

      setLoading(true)

      try {
        const res = await fetch(`/api/search?q=${query}`)
        const data = await res.json()
        setResults(data.suppliers || [])
      } catch (err) {
        console.error("Search error:", err)
        setResults([])
      }

      setLoading(false)

    }, 300)

    return () => clearTimeout(timeout)

  }, [query])

  if (query.length < 2) return null

  return (

    <div className="absolute top-full left-0 w-full mt-4 z-50">

      <div className="max-w-3xl mx-auto px-4">

        <div className="bg-white rounded-2xl shadow-xl border max-h-[420px] overflow-y-auto">

          {/* HEADER */}
          <div className="p-4 border-b bg-gray-50 rounded-t-2xl">
            <p className="text-sm text-gray-600">
              Results for <strong>{query}</strong>
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <p className="p-4 text-sm text-gray-400">Searching...</p>
          )}

          {/* RESULTS */}
          <div>

            {results.slice(0, 10).map((s: any, i: number) => (

              <a
                key={s.abn}
                href={`/suppliers/${s.abn}`}
                className="group flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition border-b last:border-none"
              >

                {/* RANK */}
                <div className="w-5 text-[10px] text-gray-400">
                  #{i + 1}
                </div>

                {/* LOGO */}
                <div className="w-10 h-10 flex-shrink-0 bg-white border rounded-lg flex items-center justify-center overflow-hidden">

                  {s.domain ? (
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain=${s.domain}`}
                      alt={s.abn_name}
                      className="w-5 h-5 object-contain"
                      onLoad={(e) => {
                        const img = e.currentTarget
                        if (img.naturalWidth <= 16) {
                          img.src = `https://${s.domain}/favicon.ico`
                        }
                      }}
                      onError={(e) => {
                        const img = e.currentTarget
                        img.src = `https://${s.domain}/favicon.ico`
                        img.onerror = () => {
                          img.style.display = "none"
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-gray-600">
                      {s.abn_name?.charAt(0)}
                    </span>
                  )}

                </div>

                {/* TEXT */}
                <div className="flex-1 min-w-0">

                  <div className="flex items-center gap-2">

                    <div className="text-sm font-medium text-gray-900 truncate">
                      {s.abn_name}
                    </div>

                    {i === 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                        Top
                      </span>
                    )}

                  </div>

                  <div className="text-[11px] text-gray-500">
                    {s.state?.toUpperCase()} {s.postcode}
                  </div>

                </div>

                {/* SCORE */}
                <div className="text-[10px] text-gray-400">
                  {Math.floor(Math.random() * 30) + 70}
                </div>

                {/* ACTION */}
                <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition">
                  →
                </span>

              </a>

            ))}

            {/* EMPTY */}
            {!loading && results.length === 0 && (
              <p className="p-4 text-sm text-gray-400">
                No results found
              </p>
            )}

          </div>

        </div>

      </div>

    </div>

  )
}