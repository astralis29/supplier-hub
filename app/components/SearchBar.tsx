"use client"

import { useState, useEffect } from "react"
import SupplierLogo from "./SupplierLogo"

/* ---------------- TYPES ---------------- */

type SearchItem =
  | { type: "capability"; value: string }
  | { type: "supplier"; value: string; abn: string; domain?: string }
  | { type: "location"; value: string }

type ResultsState = {
  capabilities: { capability: string }[]
  suppliers: { abn: string; abn_name: string; domain?: string }[]
  locations: { state: string }[]
}

export default function SearchBar({
  countries,
  onQueryChange
}: {
  countries: string[],
  onQueryChange?: (q: string) => void
}) {

  const [query,setQuery] = useState("")
  const [show,setShow] = useState(false)
  const [activeIndex,setActiveIndex] = useState(-1)

  const [results,setResults] = useState<ResultsState>({
    capabilities: [],
    suppliers: [],
    locations: []
  })

  /* ---------------- FLATTEN RESULTS ---------------- */

  const flatResults: SearchItem[] = [
    ...results.capabilities.map((c) => ({
      type: "capability" as const,
      value: c.capability
    })),
    ...results.suppliers.map((s) => ({
      type: "supplier" as const,
      value: s.abn_name,
      abn: s.abn,
      domain: s.domain
    })),
    ...results.locations.map((l) => ({
      type: "location" as const,
      value: l.state
    }))
  ]

  /* ---------------- FETCH ---------------- */

  useEffect(()=>{

    if(query.length < 2){
      setResults({ capabilities:[], suppliers:[], locations:[] })
      setShow(false)
      setActiveIndex(-1)
      onQueryChange?.("")
      return
    }

    const timeout = setTimeout(async ()=>{

      const res = await fetch(`/api/search?q=${query}&suggest=true`)
      const data = await res.json()

      setResults({
        capabilities: data.capabilities || [],
        suppliers: data.suppliers || [],
        locations: data.locations || []
      })

      setShow(true)
      setActiveIndex(-1)

      onQueryChange?.(query)

    }, 300)

    return ()=>clearTimeout(timeout)

  },[query])

  /* ---------------- KEYBOARD NAV ---------------- */

  function handleKeyDown(e:any){

    if(!show || flatResults.length === 0) return

    if(e.key === "ArrowDown"){
      e.preventDefault()
      setActiveIndex((prev)=> (prev + 1) % flatResults.length)
    }

    if(e.key === "ArrowUp"){
      e.preventDefault()
      setActiveIndex((prev)=> (prev - 1 + flatResults.length) % flatResults.length)
    }

    if(e.key === "Enter" && activeIndex >= 0){

      e.preventDefault()
      const item = flatResults[activeIndex]

      if(item.type === "supplier"){
        window.location.href = `/suppliers/${item.abn}`
      }

      if(item.type === "capability"){
        window.location.href = `/search?q=${encodeURIComponent(item.value)}`
      }

      if(item.type === "location"){
        window.location.href = `/search?q=${encodeURIComponent(item.value)}`
      }
    }

    if(e.key === "Escape"){
      setShow(false)
    }
  }

  /* ---------------- UI ---------------- */

  return(

    <form method="GET" action="/search" className="w-full max-w-3xl mx-auto">

      <div className="flex bg-white rounded-xl shadow-lg border overflow-hidden">

        <input
          name="q"   // ✅ FIXED
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="🔍 Find suppliers, capabilities or companies..."
          autoComplete="off"
          className="flex-1 px-6 py-4 text-lg outline-none"
        />

        <button
          type="submit"
          className="px-8 bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          Search
        </button>

      </div>

      {show && (
        <div className="bg-white border rounded-xl shadow-lg mt-2 text-left max-h-[320px] overflow-y-auto">

          {/* CAPABILITIES */}
          {results.capabilities.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-gray-400 px-2 mb-1">Capabilities</p>

              {results.capabilities.map((c,i)=>{

                const globalIndex = i

                return(
                  <div
                    key={i}
                    onClick={()=>window.location.href=`/search?q=${encodeURIComponent(c.capability)}`}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm ${
                      activeIndex === globalIndex ? "bg-blue-100" : "hover:bg-gray-100"
                    }`}
                  >
                    <span>⚙️</span>
                    <span>{c.capability}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* SUPPLIERS */}
          {results.suppliers.length > 0 && (
            <div className="p-2 border-t">
              <p className="text-xs text-gray-400 px-2 mb-1">Suppliers</p>

              {results.suppliers.map((s,i)=>{

                const globalIndex = results.capabilities.length + i

                return(
                  <div
                    key={s.abn}
                    onClick={()=>window.location.href=`/suppliers/${s.abn}`}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm ${
                      activeIndex === globalIndex ? "bg-blue-100" : "hover:bg-gray-100"
                    }`}
                  >
                    <SupplierLogo name={s.abn_name} website={s.domain}/>
                    <span>{s.abn_name}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* LOCATIONS */}
          {results.locations.length > 0 && (
            <div className="p-2 border-t">
              <p className="text-xs text-gray-400 px-2 mb-1">Locations</p>

              {results.locations.map((l,i)=>{

                const globalIndex =
                  results.capabilities.length +
                  results.suppliers.length +
                  i

                return(
                  <div
                    key={i}
                    onClick={()=>window.location.href=`/search?q=${l.state}`}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer text-sm ${
                      activeIndex === globalIndex ? "bg-blue-100" : "hover:bg-gray-100"
                    }`}
                  >
                    <span>📍</span>
                    <span>{l.state}</span>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}

      <div className="mt-4 flex justify-center">
        <select name="country" className="px-4 py-2 border rounded-lg bg-white text-sm">
          <option value="">All Countries</option>
          {countries.map((c)=>(
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

    </form>
  )
}