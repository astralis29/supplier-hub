export const revalidate = 600

import { Pool } from "pg"
import Parser from "rss-parser"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

/* ---------------- SEARCH COMPONENT ---------------- */

function SearchBar({
  countries,
  capabilities
}:{
  countries:string[],
  capabilities:string[]
}){

return (

<form
method="GET"
action="/search"
className="flex flex-wrap justify-center gap-4"
>

<select
name="country"
className="px-4 py-3 rounded-lg border bg-white text-black min-w-[160px]"
>
<option value="">Country</option>

{countries.map((c)=>(
<option key={c} value={c}>
{c}
</option>
))}
</select>

<input
list="capabilities"
name="capability"
placeholder="Search capability..."
className="px-4 py-3 rounded-lg border bg-white text-black min-w-[260px]"
/>

<datalist id="capabilities">
{capabilities.map((c)=>(
<option key={c} value={c}/>
))}
</datalist>

<button
type="submit"
className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
>
Search
</button>

</form>

)

}

/* ---------------- HOME PAGE ---------------- */

export default async function Home() {

/* ---------------- PARALLEL DATABASE QUERIES ---------------- */

const [
  countryResult,
  capabilityResult,
  industrialTrending,
  businessTrending,
  featuredSuppliersResult,
  newSuppliersResult
] = await Promise.all([

pool.query(`
SELECT DISTINCT country
FROM supplier_profiles
ORDER BY country
`),

pool.query(`
SELECT DISTINCT UNNEST(capabilities) AS capability
FROM supplier_profiles
WHERE capabilities IS NOT NULL
ORDER BY capability
`),

pool.query(`
SELECT capability, COUNT(*) AS total
FROM supplier_profiles,
UNNEST(capabilities) AS capability
WHERE sector = 'industrial'
GROUP BY capability
ORDER BY total DESC
LIMIT 6
`),

pool.query(`
SELECT capability, COUNT(*) AS total
FROM supplier_profiles,
UNNEST(capabilities) AS capability
WHERE sector != 'industrial'
GROUP BY capability
ORDER BY total DESC
LIMIT 6
`),

pool.query(`
SELECT
abn,
abn_name,
domain,
state,
postcode,
array_length(capabilities,1) AS capability_count
FROM supplier_profiles
WHERE capabilities IS NOT NULL
ORDER BY capability_count DESC
LIMIT 6
`),

pool.query(`
SELECT
abn,
abn_name,
domain,
state,
postcode
FROM supplier_profiles
WHERE last_crawled >= NOW() - INTERVAL '24 hours'
ORDER BY last_crawled DESC
LIMIT 6
`)
])

const countries = countryResult.rows.map((r:any)=>r.country)

const capabilities = capabilityResult.rows.map((r:any)=>
r.capability
.split(" ")
.map((w:string)=>w.charAt(0).toUpperCase()+w.slice(1))
.join(" ")
)

const industrialCapabilities = industrialTrending.rows.map((r:any)=>
r.capability
.split(" ")
.map((w:string)=>w.charAt(0).toUpperCase()+w.slice(1))
.join(" ")
)

const businessCapabilities = businessTrending.rows.map((r:any)=>
r.capability
.split(" ")
.map((w:string)=>w.charAt(0).toUpperCase()+w.slice(1))
.join(" ")
)

const featuredSuppliers = featuredSuppliersResult.rows
const newSuppliers = newSuppliersResult.rows

/* ---------------- RISK KEYWORDS ---------------- */

const riskKeywords = [
{ word:"strike", score:30 },
{ word:"shutdown", score:35 },
{ word:"shortage", score:25 },
{ word:"sanction", score:25 },
{ word:"delay", score:20 },
{ word:"disruption", score:30 },
{ word:"congestion", score:20 },
{ word:"conflict", score:35 },
{ word:"attack", score:35 }
]

/* ---------------- RSS ---------------- */

const parser = new Parser()

const feeds = [
"https://www.supplychaindive.com/feeds/news/",
"https://www.logisticsmgmt.com/rss/all",
"https://www.dcvelocity.com/rss",
"https://www.supplychainbrain.com/rss/articles",
"https://www.supplychain247.com/rss",
"https://www.inboundlogistics.com/rss",
"https://www.sdcexec.com/rss",
"https://www.logisticsviewpoints.com/feed/",
"https://www.joc.com/rss.xml",
"https://www.maritime-executive.com/rss.xml",
"https://gcaptain.com/feed/",
"https://www.freightwaves.com/rss",
"https://www.freightwaves.com/news/feed",
"https://www.industryweek.com/rss",
"https://www.manufacturing.net/rss",
"https://www.reuters.com/business/rss",
"https://www.ft.com/global-economy?format=rss",
"https://www.afr.com/rss",
"https://www.abc.net.au/news/feed/51120/rss.xml",
"https://www.bom.gov.au/rss/warnings.xml"
]

const rssResults = await Promise.allSettled(
feeds.map(url => parser.parseURL(url))
)

let news:any[] = []

rssResults.forEach(result=>{

if(result.status !== "fulfilled") return

const feed = result.value

news.push(

...feed.items.slice(0,3).map((item:any)=>{

const text = `${item.title ?? ""} ${item.contentSnippet ?? ""}`.toLowerCase()

let risk = 0

for(const k of riskKeywords){
if(text.includes(k.word)){
risk += k.score
}
}

risk = Math.max(0,Math.min(100,risk))

let riskLevel="LOW"
let riskClass="text-green-600"
let riskBorder="border-green-500"

if(risk>=70){
riskLevel="HIGH"
riskClass="text-red-600"
riskBorder="border-red-500"
}
else if(risk>=40){
riskLevel="MEDIUM"
riskClass="text-orange-500"
riskBorder="border-orange-400"
}

return{
title:item.title,
link:item.link,
pubDate:item.pubDate,
risk_score:risk,
risk_level:riskLevel,
risk_class:riskClass,
risk_border:riskBorder
}

})

)

})

news = news.filter(
(v,i,a)=>a.findIndex(t=>t.title===v.title)===i
)

news = news
.sort((a,b)=>b.risk_score-a.risk_score)
.slice(0,6)

/* ---------------- PAGE ---------------- */

return(

<main className="min-h-screen bg-gradient-to-b from-white to-gray-100">

{/* HERO */}

<section
className="relative h-screen flex items-center justify-center text-center"
style={{
backgroundImage:"url('/forest-bg.jpg')",
backgroundSize:"cover",
backgroundPosition:"center"
}}
>

<div className="absolute inset-0 bg-black/60"></div>

<div className="relative z-10 w-full max-w-5xl px-6">

<h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
Discover Verified Industrial Suppliers
</h1>

<p className="text-lg text-gray-200 mb-10">
AI-powered supplier discovery with real-time supply chain intelligence.
</p>

<SearchBar
countries={countries}
capabilities={capabilities}
/>

</div>

</section>

{/* TICKER */}

<section className="bg-black text-white py-3 overflow-hidden">
<div className="whitespace-nowrap animate-marquee text-sm">

{news.map((n,i)=>(
<span key={i} className="mx-10">
⚠ {n.title}
</span>
))}

</div>
</section>

{/* TRENDING PANELS */}

<section className="max-w-7xl mx-auto py-20 px-6">

<div className="grid md:grid-cols-2 gap-8">

<div className="bg-white rounded-xl shadow border p-8 text-center">

<h3 className="font-semibold mb-4">
⚙ Trending Industrial Capabilities
</h3>

<div className="flex flex-wrap justify-center gap-2">

{industrialCapabilities.map((cap,i)=>(

<a
key={i}
href={`/search?capability=${encodeURIComponent(cap)}`}
className="px-3 py-1 bg-gray-100 border rounded text-xs hover:bg-white"
>

{cap}

</a>

))}

</div>

</div>

<div className="bg-white rounded-xl shadow border p-8 text-center">

<h3 className="font-semibold mb-4">
💼 Trending Business Services
</h3>

<div className="flex flex-wrap justify-center gap-2">

{businessCapabilities.map((cap,i)=>(

<a
key={i}
href={`/search?capability=${encodeURIComponent(cap)}`}
className="px-3 py-1 bg-gray-100 border rounded text-xs hover:bg-white"
>

{cap}

</a>

))}

</div>

</div>

</div>

</section>

{/* FEATURED SUPPLIERS */}

<section className="max-w-6xl mx-auto py-16 px-6">

<h2 className="text-2xl font-bold mb-8 text-center">
⭐ Featured Suppliers
</h2>

<div className="grid md:grid-cols-2 gap-6">

{featuredSuppliers.map((supplier:any)=>(

<div key={supplier.abn} className="flex items-center gap-4 p-5 bg-white rounded-xl shadow border">

<div className="flex-1">

<div className="font-semibold">
{supplier.abn_name}
</div>

<div className="text-xs text-gray-500">
{supplier.state} {supplier.postcode}
</div>

<div className="text-xs text-gray-400">
{supplier.capability_count} capabilities
</div>

</div>

<a
href={`/suppliers/${supplier.abn}`}
className="text-blue-600 text-sm hover:underline"
>
View →
</a>

</div>

))}

</div>

</section>

{/* NEW SUPPLIERS */}

<section className="max-w-6xl mx-auto py-16 px-6">

<h2 className="text-2xl font-bold mb-8 text-center">
🆕 New Suppliers Discovered
</h2>

<div className="grid md:grid-cols-2 gap-6">

{newSuppliers.map((supplier:any)=>(

<div key={supplier.abn} className="flex items-center gap-4 p-5 bg-white rounded-xl shadow border">

<div className="flex-1">

<div className="font-semibold">
{supplier.abn_name}
</div>

<div className="text-xs text-gray-500">
{supplier.state} {supplier.postcode}
</div>

</div>

<a
href={`/suppliers/${supplier.abn}`}
className="text-blue-600 text-sm hover:underline"
>
View →
</a>

</div>

))}

</div>

</section>

{/* NEWS */}

<section className="max-w-6xl mx-auto py-16 px-6">

<h2 className="text-2xl font-bold mb-10 text-center">
Live Supply Chain Intelligence
</h2>

<div className="grid md:grid-cols-2 gap-8">

{news.map((item,i)=>(

<a
key={i}
href={item.link}
target="_blank"
className={`flex gap-4 p-6 bg-white rounded-xl shadow border-l-4 ${item.risk_border}`}
>

<div>

<p className={`text-xs font-semibold ${item.risk_class}`}>
{item.risk_level} RISK
</p>

<h3 className="font-semibold text-base mt-1">
{item.title}
</h3>

<p className="text-xs text-gray-400 mt-2">
{new Date(item.pubDate).toLocaleDateString()}
</p>

</div>

</a>

))}

</div>

</section>

<footer className="py-12 bg-black text-gray-400 text-center text-sm">
© {new Date().getFullYear()} What's the Supplier?
</footer>

</main>

)

}