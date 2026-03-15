export const revalidate = 0
export const dynamic = "force-dynamic"

import { Pool } from "pg"
import Parser from "rss-parser"

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: { rejectUnauthorized: false }
})

/* ---------------- SAMPLE SIGNAL DATA ---------------- */

const signals = [
{
title: "Major Port Shutdown in Singapore",
description: "Container congestion causing global freight delays",
risk_score: 85
},
{
title: "Copper Mine Strike in Chile",
description: "Labour dispute impacting global copper supply",
risk_score: 70
},
{
title: "Semiconductor Plant Expansion",
description: "New chip fab increasing global production",
risk_score: 30
}
]

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

/* LOAD COUNTRIES FROM DATABASE */

const countryResult = await pool.query(`
SELECT DISTINCT country
FROM supplier_profiles
ORDER BY country
`)

const countries = countryResult.rows.map((r:any)=>r.country)

/* LOAD CAPABILITIES FROM DATABASE */

const capabilityResult = await pool.query(`
SELECT DISTINCT UNNEST(capabilities) AS capability
FROM supplier_profiles
WHERE capabilities IS NOT NULL
ORDER BY capability
LIMIT 200
`)

const capabilities = capabilityResult.rows.map((r:any) =>
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
{ word:"blockade", score:30 },
{ word:"conflict", score:35 },
{ word:"attack", score:35 },

{ word:"expansion", score:-10 },
{ word:"investment", score:-5 },
{ word:"growth", score:-5 },
{ word:"increase", score:-5 }
]

/* ---------------- RSS SUPPLY CHAIN NEWS ---------------- */

const parser = new Parser()

const feeds = [
"https://www.supplychaindive.com/feeds/news/",
"https://www.freightwaves.com/feed",
"https://www.joc.com/rss.xml"
]

let news:any[] = []

for (const feedUrl of feeds) {

try{

const feed = await parser.parseURL(feedUrl)

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

return{
title:item.title,
link:item.link,
pubDate:item.pubDate,
risk_score:risk
}

})
)

}catch(err){
console.log("RSS error:",feedUrl)
}

}

/* SORT NEWS */

news = news
.sort((a,b)=>b.risk_score-a.risk_score)
.slice(0,6)

/* ---------------- GLOBAL RISK CALCULATION ---------------- */

const riskValues = news.map(n=>n.risk_score)

const globalRisk =
riskValues.length > 0
? Math.round(riskValues.reduce((a,b)=>a+b,0) / riskValues.length)
: 0

let riskLabel = "LOW"

if(globalRisk >= 70) riskLabel = "HIGH"
else if(globalRisk >= 40) riskLabel = "MEDIUM"

/* RISK COLOUR */

let riskColor = "text-green-600"

if(globalRisk >= 70) riskColor = "text-red-600"
else if(globalRisk >= 40) riskColor = "text-orange-500"

/* RISK BAR WIDTH */

const riskWidth = `${globalRisk}%`

/* TOP RISK EVENT */

const topRisk = news[0]

/* ---------------- PAGE ---------------- */

return (

<main className="min-h-screen bg-gradient-to-b from-white to-gray-100">

{/* HERO */}

<section
className="relative h-screen flex items-center justify-center text-center"
style={{
backgroundImage: "url('/forest-bg.jpg')",
backgroundSize: "cover",
backgroundPosition: "center"
}}
>

<div className="absolute inset-0 bg-black/60"></div>

<div className="relative z-10 w-full max-w-5xl px-6">

<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
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

{/* GLOBAL SUPPLY CHAIN RISK */}

<section className="max-w-4xl mx-auto py-12 text-center">

<h2 className="text-2xl font-bold mb-6">
Global Supply Chain Risk
</h2>

<div className={`text-5xl font-bold mb-4 ${riskColor}`}>
{globalRisk}
</div>

{/* Risk Bar */}

<div className="w-full max-w-md mx-auto h-4 bg-gray-200 rounded-full overflow-hidden mb-4">

<div
className={`h-full ${riskColor.replace("text","bg")}`}
style={{ width: riskWidth }}
></div>

</div>

<p className={`text-lg font-semibold ${riskColor}`}>
Risk Level: {riskLabel}
</p>

{/* TOP RISK EVENT */}

{topRisk && (

<div className="mt-6">

<p className="text-sm text-gray-500 mb-1">
Top Risk Event
</p>

<a
href={topRisk.link}
target="_blank"
className="font-semibold hover:underline"
>

{topRisk.title}

</a>

</div>

)}

</section>

{/* SUPPLY CHAIN INTELLIGENCE */}

<section className="max-w-6xl mx-auto py-16 px-6">

<h2 className="text-2xl font-bold mb-8 text-center">
Live Supply Chain Intelligence
</h2>

<div className="grid md:grid-cols-2 gap-6">

{news.map((item,i)=>(

<a
key={i}
href={item.link}
target="_blank"
className="p-5 bg-white rounded-lg shadow hover:shadow-lg transition"
>

<p className="text-xs text-gray-500 mb-2">
{new Date(item.pubDate).toLocaleDateString()}
</p>

<h3 className="font-semibold text-lg text-gray-900">
{item.title}
</h3>

<p className="text-sm mt-2 text-gray-500">
Risk Score: {item.risk_score}
</p>

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