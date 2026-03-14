const { Pool } = require("pg")
const axios = require("axios")
const cheerio = require("cheerio")
const pLimit = require("p-limit")

const pool = new Pool({
connectionString: process.env.DATABASE_URL
})

const limit = pLimit(20) // 20 concurrent crawlers

async function getJobs() {

const res = await pool.query(`
SELECT id, abn, name
FROM crawl_queue
WHERE status='pending'
LIMIT 50
`)

return res.rows

}

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

const keywords = []

if(html.includes("steel")) keywords.push("steel")
if(html.includes("fabrication")) keywords.push("fabrication")
if(html.includes("machining")) keywords.push("machining")
if(html.includes("mining")) keywords.push("mining")
if(html.includes("engineering")) keywords.push("engineering")

await pool.query(`
INSERT INTO supplier_profiles
(abn,abn_name,website,domain,keywords,last_crawled)
VALUES($1,$2,$3,$4,$5,NOW())
ON CONFLICT (abn) DO UPDATE
SET
website=EXCLUDED.website,
domain=EXCLUDED.domain,
keywords=EXCLUDED.keywords,
last_crawled=NOW()
`,[
job.abn,
job.name,
website,
new URL(website).hostname,
keywords
])

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

async function runCrawler(){

const jobs = await getJobs()

await Promise.all(
jobs.map(job => limit(()=>crawlCompany(job)))
)

}

setInterval(runCrawler,2000)