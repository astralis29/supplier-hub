"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import SupplierLogo from "../components/SupplierLogo"

function SearchContent(){

  const searchParams = useSearchParams()

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const [cursorStack, setCursorStack] = useState<string[]>([])

  const urlQuery = searchParams.get("q") || ""
  const country = searchParams.get("country")

  useEffect(() => {
    setQuery(urlQuery)
    setCursor(null)
    setCursorStack([])
  }, [urlQuery])

  useEffect(()=>{
    const delay = setTimeout(()=>{
      fetchSuppliers()
    },300)

    return ()=>clearTimeout(delay)

  },[query,country,cursor])


  async function fetchSuppliers(){

    setLoading(true)

    const params = new URLSearchParams()

    if(query) params.append("q",query)
    if(country) params.append("country",country)
    if(cursor) params.append("cursor",cursor)

    const res = await fetch(`/api/search?${params}`)
    const data = await res.json()

    setSuppliers(Array.isArray(data.suppliers)?data.suppliers:[])
    setNextCursor(data.nextCursor || null)

    setLoading(false)
  }

  function toTitleCase(str:string){
    if(!str) return ""
    return str
      .toLowerCase()
      .replace(/\b\w/g,(l)=>l.toUpperCase())
  }

  function goNext(){
    if(!nextCursor) return
    setCursorStack([...cursorStack, cursor || ""])
    setCursor(nextCursor)
  }

  function goPrev(){
    if(cursorStack.length === 0) return
    const newStack = [...cursorStack]
    const prevCursor = newStack.pop() || null
    setCursor(prevCursor)
    setCursorStack(newStack)
  }

  return (

    <main className="max-w-6xl mx-auto p-8 space-y-8">

      <div className="space-y-3 text-center">

        <h1 className="text-4xl font-bold">
          Discover Industrial Suppliers
        </h1>

        <p className="text-gray-500">
          Search verified Australian suppliers by capability, company name, or industry
        </p>

      </div>

      <div className="flex justify-center gap-4 items-center">

        <input
          className="border border-gray-300 p-3 rounded-lg w-full max-w-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search suppliers, capabilities..."
          value={query}
          onChange={(e)=>{
            setQuery(e.target.value)
            setCursor(null)
            setCursorStack([])
          }}
        />

        {loading && (
          <div className="text-sm text-gray-400">
            Searching...
          </div>
        )}

      </div>

      <div className="border rounded-xl overflow-hidden bg-white shadow-sm">

        <div className="grid grid-cols-12 gap-4 bg-gray-50 text-xs font-semibold text-gray-500 uppercase p-4 border-b">

          <div className="col-span-1">Logo</div>
          <div className="col-span-4">Company</div>
          <div className="col-span-3">Capabilities</div>
          <div className="col-span-2">Website</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">View</div>

        </div>

        {suppliers.map((supplier:any)=>(

          <div
            key={supplier.abn}
            className="grid grid-cols-12 gap-4 items-center p-4 border-b hover:bg-gray-50 transition"
          >

            <div className="col-span-1">
              <SupplierLogo
                name={supplier.abn_name}
                website={supplier.favicon_domain}
                size={40}
              />
            </div>

            <div className="col-span-4 space-y-1">

              <div className="font-semibold">
                {supplier.abn_name}
              </div>

              <div className="text-sm text-gray-500 uppercase">
                {supplier.state} {supplier.postcode}
              </div>

              <div className="text-xs text-gray-500">
                ABN: {supplier.abn}
              </div>

              {/* 🛡️ ISO BADGES (NEW) */}
              {supplier.certifications?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {supplier.certifications.slice(0,3).map((cert:string)=>(
                    <span
                      key={cert}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded"
                    >
                      🛡️ {cert}
                    </span>
                  ))}
                </div>
              )}

              {/* 🔥 AI CATEGORIES */}
              {supplier.ai_categories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {supplier.ai_categories.slice(0,3).map((c:any)=>(
                    <span
                      key={c}
                      onClick={()=>{
                        setQuery(c)
                        setCursor(null)
                        setCursorStack([])
                      }}
                      className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs cursor-pointer hover:bg-purple-200"
                    >
                      {toTitleCase(c)}
                    </span>
                  ))}
                </div>
              )}

              {/* 🔥 AI TAGS */}
              {supplier.ai_tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {supplier.ai_tags.slice(0,3).map((t:any)=>(
                    <span
                      key={t}
                      onClick={()=>{
                        setQuery(t)
                        setCursor(null)
                        setCursorStack([])
                      }}
                      className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs cursor-pointer hover:bg-indigo-200"
                    >
                      {toTitleCase(t)}
                    </span>
                  ))}
                </div>
              )}

            </div>

            <div className="col-span-3 flex flex-wrap gap-2">

              {supplier.capabilities?.slice(0,4).map((c:any)=>(

                <span
                  key={c}
                  className="text-xs bg-gray-100 border border-gray-200 px-2 py-1 rounded"
                >
                  {toTitleCase(c)}
                </span>

              ))}

            </div>

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

            <div className="col-span-1 text-xs space-y-1">

              {supplier.abn_status === "ACT" ? (
                <div className="text-green-600">✔ Active</div>
              ) : (
                <div className="text-red-600">✖ Inactive</div>
              )}

              {supplier.gst_registered ? (
                <div className="text-green-600">✔ GST</div>
              ) : (
                <div className="text-red-500">✖ GST</div>
              )}

            </div>

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

      <div className="flex justify-center items-center gap-4 mt-8">

        <button
          onClick={goPrev}
          disabled={cursorStack.length===0}
          className="px-4 py-2 border rounded disabled:opacity-40"
        >
          Prev
        </button>

        <button
          onClick={goNext}
          disabled={!nextCursor}
          className="px-4 py-2 border rounded disabled:opacity-40"
        >
          Next
        </button>

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