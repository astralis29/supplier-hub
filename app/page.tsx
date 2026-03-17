export const revalidate = 600

import { Pool } from "pg"
import Image from "next/image"
import SearchBar from "./components/SearchBar"

/* ---------------- DB ---------------- */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

/* ---------------- HOME PAGE ---------------- */

export default async function Home() {

/* ---------------- DB ---------------- */

const [
  countryResult,
  industrialTrending,
  businessTrending,
  featuredSuppliersResult,
  newSuppliersResult
] = await Promise.all([

pool.query(`SELECT DISTINCT country FROM supplier_profiles ORDER BY country`),

pool.query(`
SELECT capability, COUNT(*) AS total
FROM supplier_profiles, UNNEST(capabilities) AS capability
WHERE sector = 'industrial'
GROUP BY capability
ORDER BY total DESC
LIMIT 6
`),

pool.query(`
SELECT capability, COUNT(*) AS total
FROM supplier_profiles, UNNEST(capabilities) AS capability
WHERE sector != 'industrial'
GROUP BY capability
ORDER BY total DESC
LIMIT 6
`),

pool.query(`
SELECT abn,abn_name,domain,state,postcode,capabilities,
array_length(capabilities,1) AS capability_count
FROM supplier_profiles
WHERE capabilities IS NOT NULL
ORDER BY capability_count DESC
LIMIT 6
`),

pool.query(`
SELECT abn,abn_name,domain,state,postcode
FROM supplier_profiles
WHERE last_crawled >= NOW() - INTERVAL '24 hours'
ORDER BY last_crawled DESC
LIMIT 6
`)

])

/* ---------------- FORMAT ---------------- */

const countries = countryResult.rows.map((r:any)=>r.country)

const industrialCapabilities = industrialTrending.rows.map((r:any)=>r.capability)
const businessCapabilities = businessTrending.rows.map((r:any)=>r.capability)

const featuredSuppliers = featuredSuppliersResult.rows
const newSuppliers = newSuppliersResult.rows

/* ---------------- PAGE ---------------- */

return(

<main className="min-h-screen bg-gradient-to-b from-white to-gray-100">

{/* HERO */}

<section
className="relative h-[65vh] flex items-center justify-center text-center"
style={{
backgroundImage:"url('/forest-bg.jpg')",
backgroundSize:"cover",
backgroundPosition:"center"
}}
>

<div className="absolute inset-0 bg-black/60"></div>

<div className="relative z-10 w-full px-6">

<h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
Discover Verified Industrial Suppliers
</h1>

<p className="text-lg text-gray-200 mb-10">
AI-powered supplier discovery with real-time supply chain intelligence.
</p>

<SearchBar countries={countries}/>

{/* POPULAR CAPS */}

<div className="mt-6 flex flex-wrap justify-center gap-3">

{industrialCapabilities.slice(0,5).map((cap: string)=>(

<a
key={cap}
href={`/search?capability=${encodeURIComponent(cap)}`}
className="px-3 py-1 bg-white border rounded-full text-sm hover:bg-gray-50 shadow-sm"
>
{cap}
</a>

))}

</div>

</div>

</section>

{/* TRENDING */}

<section className="max-w-7xl mx-auto py-14 px-6">

<div className="grid md:grid-cols-2 gap-8">

<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">

<h3 className="font-semibold mb-2">⚙ Trending Industrial</h3>

<div className="flex flex-wrap justify-center gap-2">

{industrialCapabilities.map((cap: string)=>(

<a
key={cap}
href={`/search?capability=${encodeURIComponent(cap)}`}
className="px-3 py-1 bg-gray-100 border rounded text-xs hover:bg-white hover:shadow"
>
{cap}
</a>

))}

</div>

</div>

<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">

<h3 className="font-semibold mb-2">💼 Business Services</h3>

<div className="flex flex-wrap justify-center gap-2">

{businessCapabilities.map((cap: string)=>(

<a
key={cap}
href={`/search?capability=${encodeURIComponent(cap)}`}
className="px-3 py-1 bg-gray-100 border rounded text-xs hover:bg-white hover:shadow"
>
{cap}
</a>

))}

</div>

</div>

</div>

</section>

{/* FEATURED */}

<section className="max-w-6xl mx-auto py-14 px-6">

<h2 className="text-2xl font-bold mb-8 text-center">
⭐ Featured Suppliers
</h2>

<div className="grid md:grid-cols-2 gap-6">

{featuredSuppliers.map((s:any)=>(

<div
key={s.abn}
className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 transition"
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
<div className="font-semibold text-gray-900">{s.abn_name}</div>
<div className="text-xs text-gray-500">{s.state} {s.postcode}</div>
</div>

<a href={`/suppliers/${s.abn}`} className="text-blue-600 text-sm">
View →
</a>

</div>

))}

</div>

</section>

{/* NEW */}

<section className="max-w-6xl mx-auto py-14 px-6">

<h2 className="text-2xl font-bold mb-8 text-center">
🆕 New Suppliers
</h2>

<div className="grid md:grid-cols-2 gap-6">

{newSuppliers.map((s:any)=>(

<div
key={s.abn}
className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 transition"
>

<div className="flex-1">
<div className="font-semibold">{s.abn_name}</div>
<div className="text-xs text-gray-500">{s.state} {s.postcode}</div>
</div>

<a href={`/suppliers/${s.abn}`} className="text-blue-600 text-sm">
View →
</a>

</div>

))}

</div>

</section>

<footer className="py-10 bg-black text-gray-400 text-center text-sm">
© {new Date().getFullYear()} What's the Supplier?
</footer>

</main>

)
}