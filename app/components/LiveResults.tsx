"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

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

    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border z-50 max-h-[400px] overflow-y-auto">

      {/* HEADER */}
      <div className="p-4 border-b bg-gray-50 rounded-t-xl">
        <p className="text-sm text-gray-600">
          Results for <strong>{query}</strong>
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="p-4 text-sm text-gray-400">Searching...</p>
      )}

      {/* RESULTS */}
      <div className="divide-y">

        {results.slice(0, 10).map((s: any) => (

          <a
            key={s.abn}
            href={`/suppliers/${s.abn}`}
            className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
          >

            {/* LOGO */}
            <div className="w-8 h-8 flex-shrink-0">

              {s.domain ? (
                <Image
                  src={`https://logo.clearbit.com/${s.domain}`}
                  alt={s.abn_name}
                  width={32}
                  height={32}
                  className="rounded"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 flex items-center justify-center rounded text-xs font-medium">
                  {s.abn_name?.charAt(0)}
                </div>
              )}

            </div>

            {/* TEXT */}
            <div className="flex-1 min-w-0">

              <div className="text-sm font-medium text-gray-900 truncate">
                {s.abn_name}
              </div>

              <div className="text-xs text-gray-500">
                {s.state} {s.postcode}
              </div>

            </div>

            {/* ACTION */}
            <span className="text-xs text-blue-600">
              View →
            </span>

          </a>

        ))}

        {/* EMPTY STATE */}
        {!loading && results.length === 0 && (
          <p className="p-4 text-sm text-gray-400">
            No results found
          </p>
        )}

      </div>

    </div>

  )
}