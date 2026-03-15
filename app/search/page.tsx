"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

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
        onChange={(e)=>setQuery(e.target.value)}
      />

      {loading && (
        <div className="text-gray-400">
          Searching suppliers...
        </div>
      )}

      <div className="space-y-6">

        {suppliers.map((supplier:any)=>(

          <div
            key={supplier.abn}
            className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition"
          >

            <div className="text-xl font-semibold">
              {supplier.abn_name}
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