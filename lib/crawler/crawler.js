const { Pool } = require("pg")
const axios = require("axios")
const cheerio = require("cheerio")
const pLimit = require("p-limit")

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

const site = await axios.get(website,{timeout:8000})

const html = site.data.toLowerCase()


/* ---------------- CAPABILITY DETECTION ---------------- */

const capabilities = []
const keywords = []

const capabilityChecks = [
"welding",
"machining",
"fabrication",
"steel",
"freight",
"logistics",
"warehouse",
"engineering",
"mining",
"construction",
"plumbing",
"electrical",
"cyber",
"software"
]

capabilityChecks.forEach(term => {

if(html.includes(term)){

keywords.push(term)

const normalized = normalizeCapability(term)

if(normalized) capabilities.push(normalized)

}

})

/* remove duplicates */

const uniqueCapabilities = [...new Set(capabilities)]


/* ---------------- SAVE SUPPLIER ---------------- */

await pool.query(`
INSERT INTO supplier_profiles
(abn,abn_name,website,domain,keywords,capabilities,last_crawled)
VALUES($1,$2,$3,$4,$5,$6,NOW())
ON CONFLICT (abn) DO UPDATE
SET
website=EXCLUDED.website,
domain=EXCLUDED.domain,
keywords=EXCLUDED.keywords,
capabilities=EXCLUDED.capabilities,
last_crawled=NOW()
`,[
job.abn,
job.name,
website,
new URL(website).hostname,
keywords,
uniqueCapabilities
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