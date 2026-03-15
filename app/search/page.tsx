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

    <main className="max-w-7xl mx-auto p-8 space-y-8">

      {/* Title */}

      <div className="space-y-3">

        <h1 className="text-4xl font-bold">
          Discover Industrial Suppliers
        </h1>

        <p className="text-gray-500">
          Search verified Australian suppliers by capability, company name, or industry
        </p>

      </div>


      {/* Search */}

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


      {/* Directory Table */}

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">

        {/* Header */}

        <div className="grid grid-cols-12 gap-4 bg-gray-50 text-xs font-semibold text-gray-500 uppercase p-4 border-b">

          <div className="col-span-1">Logo</div>
          <div className="col-span-4">Company</div>
          <div className="col-span-3">Capabilities</div>
          <div className="col-span-2">Website</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">View</div>

        </div>


        {/* Rows */}

{suppliers.map((supplier:any)=>(

<div
key={supplier.abn}
className="grid grid-cols-12 gap-4 items-center p-4 border-b hover:bg-gray-50 transition"
>

{/* Logo */}

<div className="col-span-1">

{supplier.domain && (

<img
src={`https://logo.clearbit.com/${supplier.domain}`}
className="w-10 h-10 rounded border"
/>

)}

</div>


{/* Company */}

<div className="col-span-4 space-y-1">

<div className="font-semibold">
{supplier.abn_name}
</div>

<div className="text-sm text-gray-500">
{supplier.state} {supplier.postcode}
</div>

<div className="text-xs text-gray-500">
ABN: {supplier.abn}
</div>

</div>


{/* Capabilities */}

<div className="col-span-3 flex flex-wrap gap-2">

{supplier.capabilities?.slice(0,4).map((c:any)=>(

<span
key={c}
className="text-xs bg-gray-100 border border-gray-200 px-2 py-1 rounded"
>
{c}
</span>

))}

</div>


{/* Website */}

<div className="col-span-2 text-sm">

{supplier.website && (

<a
href={supplier.website}
target="_blank"
className="text-blue-600 hover:underline"
>

{supplier.website_name || supplier.domain}

</a>

)}

</div>


{/* Status */}

<div className="col-span-1 text-xs space-y-1">

{supplier.abn_status === "ACT" ? (

<div className="text-green-600">
✔ Active
</div>

) : (

<div className="text-red-600">
✖ Inactive
</div>

)}

{supplier.gst_registered ? (

<div className="text-green-600">
✔ GST
</div>

) : (

<div className="text-red-500">
✖ GST
</div>

)}

</div>


{/* View */}

<div className="col-span-1 text-right">

<Link
href={`/suppliers/${supplier.abn}`}
className="text-blue-600 text-sm hover:underline"
>

View →

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