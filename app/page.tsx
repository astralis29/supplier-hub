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

/* INDUSTRY FILTER TERMS */

const industryTerms = [
"freight","logistics","shipping","cargo","container","port","harbour","dock","terminal","supply chain",
"trade","transport","rail","railway","rail freight","trucking","truck","haulage","air cargo","air freight",
"shipping lane","canal","tanker","bulk carrier","cargo ship","container ship","freight route","transport corridor",
"mining","mine","mineral","minerals","lithium","copper","iron ore","nickel","cobalt","bauxite","aluminium",
"steel","coal","metallurgical coal","gold","silver","platinum","palladium","rare earth","rare earths",
"graphite","zinc","lead","manganese","uranium","smelter","refinery","ore","metal","metals","commodity",
"energy","oil","gas","lng","crude","petroleum","refining","pipeline","offshore drilling","drilling",
"upstream","downstream","opec","power","electricity","power plant","grid","utility","renewable","solar",
"wind","windfarm","hydrogen","nuclear","reactor","biofuel","energy storage"
]

/* FILTER SIGNALS */

const industrySignals = signals.filter((s:any)=>{

const text = `${s.title ?? ""} ${s.description ?? ""}`.toLowerCase()

return industryTerms.some(term => text.includes(term))

})

const usableSignals = industrySignals.length > 0 ? industrySignals : signals

/* RISK CALCULATIONS */

const highRisk = usableSignals
.filter((s:any)=>s.risk_score >= 80)
.sort((a:any,b:any)=>b.risk_score-a.risk_score)

const mediumRisk = usableSignals
.filter((s:any)=>s.risk_score >= 50 && s.risk_score < 80)
.sort((a:any,b:any)=>b.risk_score-a.risk_score)

const relevantSignals = usableSignals.filter((s:any)=>s.risk_score >= 20)

const avgRisk =
relevantSignals.length > 0
? Math.round(
relevantSignals.reduce((acc:any,s:any)=>acc+(s.risk_score||0),0) /
relevantSignals.length
)
: 0

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
...feed.items.slice(0,3).map((item:any)=>({
title:item.title,
link:item.link,
pubDate:item.pubDate
}))
)

}catch(err){
console.log("RSS error:",feedUrl)
}

}

news = news
.sort((a,b)=>
new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
)
.slice(0,6)

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