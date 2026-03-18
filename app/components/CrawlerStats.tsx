"use client"

import { useEffect, useState } from "react"

export default function CrawlerStats() {

  const [stats, setStats] = useState<any>(null)

  useEffect(() => {

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/crawler-stats")
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error("Stats error:", err)
      }
    }

    fetchStats()

    const interval = setInterval(fetchStats, 5000)

    return () => clearInterval(interval)

  }, [])

  if (!stats) return null

  const total =
    (stats.pending || 0) +
    (stats.processing || 0) +
    (stats.completed || 0) +
    (stats.failed || 0)

  const progress = total > 0
    ? Math.round((stats.completed / total) * 100)
    : 0

  const isLive = (stats.processing || 0) > 0

  return (

    <div className="max-w-5xl mx-auto mt-10 px-6">

      <div className="bg-white border rounded-2xl shadow-sm p-6">

        {/* HEADER */}
        <div className="flex items-center justify-center gap-3 mb-4">

          <h3 className="font-semibold text-lg">
            🚀 Discovery Progress
          </h3>

          {isLive && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              LIVE
            </span>
          )}

        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">

          <div
            className="h-3 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-green-400 via-emerald-500 to-blue-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
            style={{ width: `${progress}%` }}
          />

        </div>

        {/* % TEXT */}
        <div className="text-center text-sm font-medium mb-5 text-gray-700">
          {progress}% complete
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">

          <div>
            <div className="text-lg font-bold">{stats.pending || 0}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>

          <div>
            <div className="text-lg font-bold text-blue-600">{stats.processing || 0}</div>
            <div className="text-xs text-gray-500">Processing</div>
          </div>

          <div>
            <div className="text-lg font-bold text-green-600">{stats.completed || 0}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>

          <div>
            <div className="text-lg font-bold text-red-600">{stats.failed || 0}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>

        </div>

      </div>

    </div>
  )
}