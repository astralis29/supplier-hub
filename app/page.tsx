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
  trendingResult
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
    GROUP BY capability
    ORDER BY total DESC
    LIMIT 8
  `)

])

const countries = countryResult.rows.map((r:any)=>r.country)

const capabilities = capabilityResult.rows.map((r:any)=>
r.capability
.split(" ")
.map((w:string)=>w.charAt(0).toUpperCase()+w.slice(1))
.join(" ")
)

const trendingCapabilities = trendingResult.rows.map((r:any)=>
r.capability
.split(" ")
.map((w:string)=>w.charAt(0).toUpperCase()+w.slice(1))
.join(" ")
)

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

/* ---------- PARALLEL RSS FETCH ---------- */

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

/* REMOVE DUPLICATES */

news = news.filter(
(v,i,a)=>a.findIndex(t=>t.title===v.title)===i
)

/* SORT */

news = news
.sort((a,b)=>b.risk_score-a.risk_score)
.slice(0,6)

/* GLOBAL RISK */

const globalRisk = news.length
? Math.round(news.reduce((a,b)=>a+b.risk_score,0)/news.length)
: 0

let riskLabel="LOW"
let riskColor="text-green-600"
let riskBar="bg-gradient-to-r from-green-400 to-emerald-600"

if(globalRisk>=70){
riskLabel="HIGH"
riskColor="text-red-600"
riskBar="bg-gradient-to-r from-red-400 to-red-700"
}
else if(globalRisk>=40){
riskLabel="MEDIUM"
riskColor="text-orange-500"
riskBar="bg-gradient-to-r from-orange-400 to-orange-600"
}

const riskWidth=`${globalRisk}%`

/* REGIONS */

const regionKeywords=[
{region:"Middle East",words:["middle east","red sea","gulf"]},
{region:"South America",words:["chile","peru","brazil"]},
{region:"China",words:["china","shanghai"]},
{region:"Europe",words:["eu","germany","france"]},
{region:"North America",words:["united states","us","canada"]}
]

let regionalRisks:any={}

news.forEach(article=>{

const text=article.title.toLowerCase()

regionKeywords.forEach(r=>{

if(r.words.some(w=>text.includes(w))){

if(!regionalRisks[r.region]){
regionalRisks[r.region]=[]
}

regionalRisks[r.region].push(article.risk_score)

}

})

})

const regionList = Object.keys(regionalRisks).map(region=>{

const scores = regionalRisks[region]

const avg = Math.round(scores.reduce((a:number,b:number)=>a+b,0)/scores.length)

let level="LOW"
let color="text-green-600"

if(avg>=70){
level="HIGH"
color="text-red-600"
}
else if(avg>=40){
level="MEDIUM"
color="text-orange-500"
}

return{
region,
level,
color
}

})

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

{/* DASHBOARD */}

<section className="bg-gradient-to-r from-gray-900 to-blue-950 py-20">

<div className="max-w-7xl mx-auto px-6">

<h2 className="text-3xl font-bold text-white text-center mb-12">
Supply Chain Intelligence
</h2>

<div className="grid md:grid-cols-3 gap-8">

{/* RISK */}

<div className="backdrop-blur bg-white/90 rounded-xl shadow-xl border p-8 text-center">

<h3 className="font-semibold mb-4">
Global Supply Chain Risk
</h3>

<div className={`text-6xl font-bold mb-4 ${riskColor}`}>
{globalRisk}
</div>

<div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden mb-4">
<div
className={`h-full ${riskBar} transition-all duration-700`}
style={{width:riskWidth}}
></div>
</div>

<p className={`font-semibold ${riskColor}`}>
{riskLabel} RISK
</p>

</div>

{/* TRENDING */}

<div className="backdrop-blur bg-white/90 rounded-xl shadow-xl border p-8 text-center">

<h3 className="font-semibold mb-4">
Trending Capabilities
</h3>

<div className="flex flex-wrap justify-center gap-2">

{trendingCapabilities.map((cap,i)=>(

<a
key={i}
href={`/search?capability=${encodeURIComponent(cap)}`}
className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium
hover:bg-white hover:shadow hover:border-gray-300 transition flex items-center gap-1"
>

<span className="text-gray-400">⚙</span>
{cap}

</a>

))}

</div>

</div>

{/* DISRUPTIONS */}

<div className="backdrop-blur bg-white/90 rounded-xl shadow-xl border p-8 text-center">

<h3 className="font-semibold mb-4">
Global Disruptions
</h3>

<div className="space-y-2 text-sm">

{regionList.map((r,i)=>(
<p key={i} className={`${r.color} font-semibold`}>
{r.region} — {r.level}
</p>
))}

</div>

</div>

</div>

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
className={`flex gap-4 p-6 bg-white rounded-xl shadow hover:shadow-lg transition border-l-4 ${item.risk_border}`}
>

<div>

<p className={`text-xs font-semibold ${item.risk_class}`}>
{item.risk_level} RISK
</p>

<h3 className="font-semibold text-base text-gray-900 mt-1 leading-snug">
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