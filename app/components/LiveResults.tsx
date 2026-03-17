"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function LiveResults({ query }: { query: string }) {

const [results,setResults] = useState<any[]>([])
const [loading,setLoading] = useState(false)

useEffect(()=>{

if(query.length < 2){
setResults([])
return
}

const timeout = setTimeout(async ()=>{

setLoading(true)

const res = await fetch(`/api/search?q=${query}`)
const data = await res.json()

setResults(data.suppliers || [])
setLoading(false)

}, 300)

return ()=>clearTimeout(timeout)

},[query])

if(query.length < 2) return null

return(

<div className="mt-6 bg-white rounded-xl shadow border p-6">

<p className="text-sm text-gray-500 mb-4">
Showing results for <strong>{query}</strong>
</p>

{loading && (
<p className="text-sm text-gray-400">Searching...</p>
)}

<div className="grid md:grid-cols-2 gap-4">

{results.map((s:any)=>(

<div
key={s.abn}
className="flex items-center gap-4 p-4 border rounded-lg hover:shadow transition"
>

<div className="w-10 h-10">

{s.domain ? (
<Image
src={`https://logo.clearbit.com/${s.domain}`}
alt={s.abn_name}
width={40}
height={40}
/>
) : (
<div className="w-10 h-10 bg-gray-200 flex items-center justify-center rounded">
{s.abn_name?.charAt(0)}
</div>
)}

</div>

<div className="flex-1">

<div className="font-semibold">
{s.abn_name}
</div>

<div className="text-xs text-gray-500">
{s.state} {s.postcode}
</div>

</div>

<a
href={`/suppliers/${s.abn}`}
className="text-blue-600 text-sm"
>
View →
</a>

</div>

))}

</div>

</div>

)
}