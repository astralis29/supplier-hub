import dotenv from "dotenv"
import path from "path"

dotenv.config({
  path: path.join(process.cwd(), ".env.local")
})

console.log("DB URL:", process.env.DATABASE_URL ? "LOADED ✅" : "MISSING ❌")
console.log("OPENAI KEY:", process.env.OPENAI_API_KEY ? "LOADED ✅" : "MISSING ❌")

import { Pool } from "pg"
import fetch from "node-fetch"

console.log("🚀 Enrichment worker booting...")

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

/* ---------------- JUNK FILTER ---------------- */

function isJunkContent(text, url) {
  const lower = text.toLowerCase()

  const junkSignals = [
    "domain for sale","buy this domain","this domain is for sale",
    "parked domain","domain parking","hugedomains","sedo","godaddy",
    "afternic","dan.com","namecheap parking","parkingcrew"
  ]

  if (junkSignals.some(s => lower.includes(s))) {
    console.log("🚫 Junk detected (content)")
    return true
  }

  const junkDomains = [
    "bing.com","google.com","yahoo.com",
    "hugedomains.com","sedo.com"
  ]

  if (junkDomains.some(d => url.includes(d))) {
    console.log("🚫 Junk domain:", url)
    return true
  }

  return false
}

/* ---------------- AI OUTPUT FILTER ---------------- */

function isBadAIOutput(summary) {
  const badSignals = [
    "javascript","html","css","tracking",
    "snippet","code","script","metadata"
  ]

  return badSignals.some(s => summary.toLowerCase().includes(s))
}

/* ---------------- DB FETCH ---------------- */

async function getSuppliers() {
  const res = await pool.query(`
    SELECT abn, website
    FROM supplier_profiles
    WHERE website IS NOT NULL
    AND ai_summary IS NULL
    AND website LIKE 'http%'
    LIMIT 5
  `)

  return res.rows
}

/* ---------------- SCRAPER ---------------- */

async function scrapeWebsite(url) {
  try {
    console.log("🌐 Scraping:", url)

    const res = await fetch(url, { timeout: 10000 })
    const html = await res.text()

    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    if (!cleaned || cleaned.length < 50) {
      console.log("⚠️ JS site fallback → using URL")
      return url
    }

    return cleaned.slice(0, 2000)

  } catch (err) {
    console.log("❌ Scrape failed:", url)
    return null
  }
}

/* ---------------- AI ---------------- */

async function enrichWithAI(text, retries = 2) {
  try {
    console.log("🧠 Sending to AI...")

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [
          {
            role: "user",
            content: `
You are a supply chain intelligence engine.

Your job is to identify what a REAL business does.

IGNORE:
- code, scripts, CSS
- tracking, metadata
- boilerplate website content

FOCUS ONLY ON:
- products
- services
- industry

If content is weak or unclear:
infer from the domain name.

If NOT a real business:
return summary = null.

Allowed categories:
["Manufacturing","Logistics","Construction","IT Services","Healthcare","Finance","Retail","Marketing","Legal"]

Return STRICT JSON ONLY:

{
  "summary": "clear business description",
  "categories": ["industry"],
  "tags": ["keywords"],
  "confidence": 0.0
}

Content:
${text}
`
          }
        ],
        text: { format: { type: "json_object" } }
      })
    })

    const data = await response.json()

    const message = data.output?.find(o => o.type === "message")

    let textOutput = null

    if (message?.content) {
      for (const item of message.content) {
        if (item.text) {
          textOutput = item.text
          break
        }
      }
    }

    if (!textOutput) throw new Error("No AI output")

    const parsed = JSON.parse(textOutput)

    if (!parsed.summary) {
      console.log("⚠️ Empty summary")
      return null
    }

    if (isBadAIOutput(parsed.summary)) {
      console.log("🚫 Bad AI output detected")
      return null
    }

    parsed.confidence = parsed.confidence || 0.6

    console.log("✅ AI RESULT:", parsed.summary)

    return parsed

  } catch (err) {

    if (retries > 0) {
      console.log("🔁 Retrying AI...", retries)
      return enrichWithAI(text, retries - 1)
    }

    console.log("❌ AI ERROR:", err.message)
    return null
  }
}

/* ---------------- SAVE ---------------- */

async function saveEnrichment(abn, ai) {
  await pool.query(`
    UPDATE supplier_profiles
    SET 
      ai_summary = $1,
      ai_categories = $2,
      ai_tags = $3,
      ai_confidence = $4,
      ai_last_enriched = NOW()
    WHERE abn = $5
  `, [
    ai.summary,
    ai.categories,
    ai.tags,
    ai.confidence,
    abn
  ])
}

/* ---------------- MAIN LOOP ---------------- */

async function run() {
  console.log("🔁 Worker loop started")

  while (true) {
    const suppliers = await getSuppliers()

    if (suppliers.length === 0) {
      console.log("😴 Sleeping...")
      await new Promise(r => setTimeout(r, 10000))
      continue
    }

    for (const supplier of suppliers) {
      console.log("⚙️ Enriching:", supplier.abn)

      const text = await scrapeWebsite(supplier.website)
      if (!text) continue

      if (isJunkContent(text, supplier.website)) continue

      const ai = await enrichWithAI(text)
      if (!ai) continue

      await saveEnrichment(supplier.abn, ai)

      console.log("✅ Saved:", supplier.abn)

      await new Promise(r => setTimeout(r, 1000))
    }
  }
}

run()