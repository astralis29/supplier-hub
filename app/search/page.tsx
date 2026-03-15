"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function SearchContent(){

  const searchParams = useSearchParams()

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const country = searchParams.get("country")
  const capability = searchParams.get("capability")

  useEffect(()=>{

    const delay = setTimeout(()=>{
      fetchSuppliers()
    },300)

    return ()=>clearTimeout(delay)

  },[query,country,capability])


  async function fetchSuppliers(){

    setLoading(true)

    const params = new URLSearchParams()

    if(query) params.append("q",query)
    if(country) params.append("country",country)
    if(capability) params.append("capability",capability)

    const res = await fetch(`/api/search?${params}`)
    const data = await res.json()

    setSuppliers(Array.isArray(data)?data:[])

    setLoading(false)

  }

  return (

    <main className="max-w-6xl mx-auto p-8 space-y-8">

      <div className="space-y-3">

        <h1 className="text-4xl font-bold">
          Discover Industrial Suppliers
        </h1>

        <p className="text-gray-500">
          Search verified Australian suppliers by capability, company name, or industry
        </p>

      </div>


      <div className="flex gap-4 items-center">

        <input
          className="border border-gray-300 p-3 rounded-lg w-full max-w-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search suppliers, capabilities..."
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
        />

        {loading && (
          <div className="text-sm text-gray-400">
            Searching...
          </div>
        )}

      </div>


      <div className="space-y-6">

{suppliers.map((supplier:any) => (

  <div
    key={supplier.abn}
    className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-lg transition duration-200"
  >

    <div className="flex justify-between items-start gap-4">

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
            🌐 {supplier.website_name || supplier.domain}
          </a>
        )}

      </div>

      {supplier.domain && (
        <img
          src={`https://logo.clearbit.com/${supplier.domain}`}
          className="w-14 h-14 rounded-md border"
        />
      )}

    </div>


    {/* Capabilities */}

    {supplier.capabilities?.length > 0 && (

      <div className="border-t mt-4 pt-4">

        <div className="flex flex-wrap gap-2">

          {supplier.capabilities.slice(0,6).map((c:any) => (

            <span
              key={c}
              className="text-xs bg-gray-100 border border-gray-200 px-3 py-1 rounded-full"
            >
              {c}
            </span>

          ))}

        </div>

      </div>

    )}


    {/* Keywords */}

    {supplier.keywords?.length > 0 && (

      <div className="mt-3 flex flex-wrap gap-2">

        {supplier.keywords.slice(0,4).map((k:any) => (

          <span
            key={k}
            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
          >
            {k}
          </span>

        ))}

      </div>

    )}


    {/* Business Info */}

    <div className="border-t mt-4 pt-4 flex flex-wrap gap-6 text-sm text-gray-500">

      <div>
        ABN: {supplier.abn}
      </div>

      <div>
        {supplier.abn_status === "Active" ? "✔ Active ABN" : "ABN Inactive"}
      </div>

      <div>
        {supplier.gst_registered ? "✔ GST Registered" : "GST Not Registered"}
      </div>

    </div>


    {/* View Supplier */}

    <div className="mt-4">

      <Link
        href={`/suppliers/${supplier.abn}`}
        className="text-blue-600 text-sm font-medium hover:underline"
      >
        View Supplier →
      </Link>

    </div>

  </div>

))}

      </div>

    </main>

  )

}

export default function SearchPage(){

  return (
    <Suspense fallback={<div className="p-10">Loading search...</div>}>
      <SearchContent/>
    </Suspense>
  )

}