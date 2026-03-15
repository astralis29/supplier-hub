const { Pool } = require("pg")
const axios = require("axios")
const cheerio = require("cheerio")
const pLimit = require("p-limit")

/* capability dictionary */
const capabilitiesDictionary = require("./capabilities")

const pool = new Pool({
connectionString: process.env.DATABASE_URL
})

const limit = pLimit(20) // 20 concurrent crawlers


/* ---------------- CAPABILITY NORMALIZATION ---------------- */

function normalizeCapability(text){

text = text.toLowerCase()

if(text.includes("weld")) return "Welding"
if(text.includes("machin")) return "Machining"
if(text.includes("fabricat")) return "Metal Fabrication"
if(text.includes("steel")) return "Steel Fabrication"
if(text.includes("freight")) return "Freight Forwarding"
if(text.includes("logistics")) return "Logistics"
if(text.includes("warehouse")) return "Warehousing"
if(text.includes("engineering")) return "Engineering"
if(text.includes("mining")) return "Mining Services"
if(text.includes("construction")) return "Construction"
if(text.includes("plumbing")) return "Plumbing Services"
if(text.includes("electrical")) return "Electrical Services"
if(text.includes("cyber")) return "Cybersecurity"
if(text.includes("software")) return "Software Development"

return null

}


/* ---------------- INDUSTRY CLASSIFICATION ---------------- */

function classifyIndustry(text){

text = text.toLowerCase()

if(text.includes("mining") || text.includes("drilling") || text.includes("ore"))
return "Mining"

if(text.includes("construction") || text.includes("building"))
return "Construction"

if(text.includes("fabrication") || text.includes("machining") || text.includes("welding"))
return "Manufacturing"

if(text.includes("engineering"))
return "Engineering"

if(text.includes("freight") || text.includes("logistics") || text.includes("warehouse"))
return "Logistics"

if(text.includes("software") || text.includes("cyber") || text.includes("it "))
return "IT Services"

if(text.includes("electrical"))
return "Electrical"

if(text.includes("plumbing"))
return "Plumbing"

return null

}


/* ---------------- FIND IMPORTANT PAGES ---------------- */

async function getImportantPages(baseUrl, $){

const pages = []

const importantWords = [
"services",
"capabilities",
"solutions",
"products",
"industries",
"what-we-do"
]

$("a").each((i,el)=>{

const href = $(el).attr("href")

if(!href) return

for(const word of importantWords){

if(href.toLowerCase().includes(word)){

let url = href

if(!href.startsWith("http")){
url = baseUrl.replace(/\/$/,'') + "/" + href.replace(/^\//,'')
}

pages.push(url)

}

}

})

return [...new Set(pages)].slice(0,5)

}


/* ---------------- GET JOBS ---------------- */

async function getJobs() {

const res = await pool.query(`
SELECT id, abn, name
FROM crawl_queue
WHERE status='pending'
LIMIT 50
`)

return res.rows

}


/* ---------------- CRAWL COMPANY ---------------- */

async function crawlCompany(job) {

try {

console.log("Processing:", job.name)

const search = job.name.replace(/PTY LTD|LIMITED|LTD/g,"").trim()

const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(search)}`

const page = await axios.get(searchUrl)

const $ = cheerio.load(page.data)

const link = $("a.result__a").first().attr("href")

if(!link){

await pool.query(`
UPDATE crawl_queue
SET status='failed'
WHERE id=$1
`,[job.id])

return
}

const website = link

await pool.query(`
UPDATE crawl_queue
SET website=$1,status='processing'
WHERE id=$2
`,[website,job.id])


/* ---------------- LOAD HOMEPAGE ---------------- */

const site = await axios.get(website,{timeout:8000})

let html = site.data.toLowerCase()

const $$ = cheerio.load(site.data)


/* ---------------- FIND IMPORTANT PAGES ---------------- */

const extraPages = await getImportantPages(website, $$)


/* ---------------- CRAWL EXTRA PAGES ---------------- */

for(const pageUrl of extraPages){

try{

const page = await axios.get(pageUrl,{timeout:8000})

html += page.data.toLowerCase()

}catch(e){

console.log("Extra page failed:",pageUrl)

}

}


/* ---------------- CAPABILITY DETECTION ---------------- */

const keywords = []
const capabilities = []


/* ---------- DICTIONARY DETECTION ---------- */

for(const phrase of capabilitiesDictionary){

if(html.includes(phrase)){

keywords.push(phrase)

const normalized = normalizeCapability(phrase)

if(normalized) capabilities.push(normalized)

}

}


/* ---------- SERVICE LIST EXTRACTION ---------- */

$$("li").each((i,el)=>{

const text = $$(el).text().trim().toLowerCase()

if(text.length < 3) return
if(text.length > 60) return

const normalized = normalizeCapability(text)

if(normalized){

keywords.push(text)
capabilities.push(normalized)

}

})


/* ---------- HEADING EXTRACTION ---------- */

$$("h1,h2,h3,h4").each((i,el)=>{

const text = $$(el).text().trim().toLowerCase()

if(text.length < 3) return
if(text.length > 60) return

const normalized = normalizeCapability(text)

if(normalized){

keywords.push(text)
capabilities.push(normalized)

}

})


/* ---------- REMOVE DUPLICATES ---------- */

const uniqueKeywords = [...new Set(keywords)]
const uniqueCapabilities = [...new Set(capabilities)]


/* ---------------- INDUSTRY DETECTION ---------------- */

let detectedIndustry = null

for(const k of uniqueKeywords){

const industry = classifyIndustry(k)

if(industry){
detectedIndustry = industry
break
}

}


/* ---------------- SAVE SUPPLIER ---------------- */

await pool.query(`
INSERT INTO supplier_profiles
(abn,abn_name,website,domain,keywords,capabilities,industry,last_crawled)
VALUES($1,$2,$3,$4,$5,$6,$7,NOW())
ON CONFLICT (abn) DO UPDATE
SET
website=EXCLUDED.website,
domain=EXCLUDED.domain,
keywords=EXCLUDED.keywords,
capabilities=EXCLUDED.capabilities,
industry=EXCLUDED.industry,
last_crawled=NOW()
`,[
job.abn,
job.name,
website,
new URL(website).hostname,
uniqueKeywords,
uniqueCapabilities,
detectedIndustry
])


/* ---------------- UPDATE QUEUE ---------------- */

await pool.query(`
UPDATE crawl_queue
SET status='complete'
WHERE id=$1
`,[job.id])

} catch(err){

console.log("Error:",job.name)

await pool.query(`
UPDATE crawl_queue
SET status='failed',attempts=attempts+1
WHERE id=$1
`,[job.id])

}

}


/* ---------------- RUN CRAWLER ---------------- */

async function runCrawler(){

const jobs = await getJobs()

await Promise.all(
jobs.map(job => limit(()=>crawlCompany(job)))
)

}

setInterval(runCrawler,2000)