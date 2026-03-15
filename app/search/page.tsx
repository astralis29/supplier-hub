"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function SearchPage() {

  const searchParams = useSearchParams()

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const country = searchParams.get("country")
  const capability = searchParams.get("capability")

  useEffect(() => {

    const delay = setTimeout(() => {
      fetchSuppliers()
    }, 300)

    return () => clearTimeout(delay)

  }, [query, country, capability])


  async function fetchSuppliers() {

    setLoading(true)

    const params = new URLSearchParams()

    if (query) params.append("q", query)
    if (country) params.append("country", country)
    if (capability) params.append("capability", capability)

    const res = await fetch(`/api/search?${params}`)
    const data = await res.json()

    setSuppliers(Array.isArray(data) ? data : [])

    setLoading(false)

  }

  return (

    <main className="max-w-6xl mx-auto p-8 space-y-8">

      <h1 className="text-4xl font-bold">
        Discover Industrial Suppliers
      </h1>

      <p className="text-gray-500">
        Search verified Australian suppliers by capability, company name, or industry
      </p>

      <input
        className="border p-3 rounded-lg w-full max-w-md"
        placeholder="Search suppliers, capabilities..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && (
        <div className="text-gray-400">
          Searching suppliers...
        </div>
      )}

      <div className="space-y-6">

        {suppliers.map((supplier:any) => (

          <div
            key={supplier.abn}
            className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition"
          >

            <div className="flex justify-between items-start">

              <div className="space-y-2">

                <div className="text-xl font-semibold">
                  {supplier.abn_name}
                </div>

                <div className="text-gray-500 text-sm">
                  {supplier.state} {supplier.postcode}
                </div>

                {supplier.website && (
                  <a
                    href={supplier.website}
                    target="_blank"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    🌐 {supplier.domain}
                  </a>
                )}

              </div>

              {supplier.domain && (
                <img
                  src={`https://logo.clearbit.com/${supplier.domain}`}
                  className="w-12 h-12 rounded"
                />
              )}

            </div>

            <div className="border-t mt-4 pt-4">

              {supplier.capabilities?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">

                  {supplier.capabilities.slice(0,6).map((c:any) => (

                    <span
                      key={c}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {c}
                    </span>

                  ))}

                </div>
              )}

              {supplier.keywords?.length > 0 && (

                <div className="flex flex-wrap gap-2">

                  {supplier.keywords.slice(0,4).map((k:any) => (

                    <span
                      key={k}
                      className="text-xs bg-blue-50 px-2 py-1 rounded"
                    >
                      {k}
                    </span>

                  ))}

                </div>

              )}

            </div>

            <div className="border-t mt-4 pt-4 text-sm text-gray-500">

              <div>ABN: {supplier.abn}</div>
              <div>ABN Status: {supplier.abn_status}</div>
              <div>GST Registered: {supplier.gst_registered ? "Yes" : "No"}</div>

            </div>

          </div>

        ))}

      </div>

    </main>

  )

}