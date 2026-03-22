import dotenv from "dotenv"
import path from "path"

dotenv.config({
  path: path.join(process.cwd(), ".env.local")
})

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

  if (junkSignals.some(s => lower.includes(s))) return true

  const junkDomains = [
    "bing.com","google.com","yahoo.com",
    "hugedomains.com","sedo.com"
  ]

  if (junkDomains.some(d => url.includes(d))) return true

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

/* ---------------- CERT VALIDATION ---------------- */

function isValidCertification(text, cert) {
  const lower = text.toLowerCase()

  const negativeSignals = [
    "working towards",
    "seeking",
    "aim to",
    "plan to",
    "in progress"
  ]

  if (negativeSignals.some(s => lower.includes(s))) return false

  return lower.includes(cert.toLowerCase())
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
    const res = await fetch(url, { timeout: 10000 })
    const html = await res.text()

    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    if (!cleaned || cleaned.length < 50) {
      return url
    }

    return cleaned.slice(0, 2000)

  } catch {
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

Extract:
1. Business summary
2. Categories
3. Tags
4. Certifications (ONLY if explicitly stated as certified)

Rules for certifications:
- Only include real certifications (e.g. ISO 9001, ISO 14001)
- DO NOT include "working towards" or "planning"
- Only include confirmed certifications

Return STRICT JSON:

{
  "summary": "business description",
  "categories": [],
  "tags": [],
  "certifications": ["ISO 9001"],
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

    if (!parsed.summary) return null
    if (isBadAIOutput(parsed.summary)) return null

    parsed.certifications = parsed.certifications || []
    parsed.confidence = parsed.confidence || 0.6

    return parsed

  } catch (err) {

    if (retries > 0) {
      return enrichWithAI(text, retries - 1)
    }

    return null
  }
}

/* ---------------- SAVE ---------------- */

async function saveEnrichment(abn, ai, rawText) {

  // Save main AI data
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

  // Save certifications (NEW)
  for (const cert of ai.certifications) {

    if (!isValidCertification(rawText, cert)) continue

    await pool.query(`
      INSERT INTO supplier_certifications (abn, standard, source, confidence)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [
      abn,
      cert,
      "ai_website",
      0.7
    ])
  }
}

/* ---------------- MAIN LOOP ---------------- */

async function run() {
  console.log("🔁 Worker loop started")

  while (true) {
    const suppliers = await getSuppliers()

    if (suppliers.length === 0) {
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

      await saveEnrichment(supplier.abn, ai, text)

      console.log("✅ Saved:", supplier.abn)

      await new Promise(r => setTimeout(r, 1000))
    }
  }
}

run()