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

/* ---------------- NORMALISER (CRITICAL FIX) ---------------- */

function normalizeToArray(input) {
  if (!input) return []

  if (Array.isArray(input)) return input

  if (typeof input === "object") {
    return Object.values(input).flat()
  }

  if (typeof input === "string") {
    return [input]
  }

  return []
}

/* ---------------- JUNK FILTER ---------------- */

function isJunkContent(text, url) {
  const lower = text.toLowerCase()

  const junkSignals = [
    "domain for sale","this domain is for sale","buy this domain",
    "make an offer","listed for sale","purchase this domain",
    "sedo","hugedomains","godaddy","afternic","dan.com",
    "namecheap parking","parkingcrew","saw.com",
    "parked domain","domain parking","cashparking","bodis parking",
    "secure domain purchase","escrow service"
  ]

  if (junkSignals.some(s => lower.includes(s))) {
    console.log("🧨 Junk detected (content):", url)
    return true
  }

  const junkDomains = [
    "bing.com","google.com","yahoo.com",
    "sedo.com","hugedomains.com","godaddy.com",
    "dan.com","afternic.com","saw.com"
  ]

  if (junkDomains.some(d => url.includes(d))) {
    console.log("🧨 Junk detected (domain):", url)
    return true
  }

  if (text.length < 300) {
    console.log("🧨 Junk detected (too small):", url)
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

/* ---------------- ISO EXTRACTION ---------------- */

function extractISOs(text) {
  const matches = text.match(/ISO[\s\-:]?\d{4,5}/gi)

  if (!matches) return []

  return [
    ...new Set(
      matches.map(m =>
        m.toUpperCase().replace(/[\s\-:]+/g, " ").trim()
      )
    )
  ]
}

/* ---------------- MARK FAILED ---------------- */

async function markFailed(abn) {
  await pool.query(`
    UPDATE supplier_profiles
    SET ai_last_enriched = NOW()
    WHERE abn = $1
  `, [abn])
}

/* ---------------- DB FETCH ---------------- */

async function getSuppliers() {
  const res = await pool.query(`
    SELECT abn, website
    FROM supplier_profiles
    WHERE website IS NOT NULL
    AND ai_last_enriched IS NULL
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

    return cleaned.slice(0, 5000)

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

Return JSON only.

Content:
${text}
`
          }
        ]
      })
    })

    const data = await response.json()

    let rawText = null

    if (Array.isArray(data.output)) {
      const msg = data.output.find(o => o.type === "message")
      if (msg?.content?.length) {
        rawText = msg.content[0].text
      }
    }

    if (!rawText) {
      console.error("❌ No AI text:", JSON.stringify(data, null, 2))
      return null
    }

    let parsed = null

    try {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error("No JSON found")

      parsed = JSON.parse(match[0])
    } catch (err) {
      console.error("❌ JSON EXTRACT FAIL:", rawText)
      return null
    }

    /* ---------------- NORMALISE (FIXED) ---------------- */

    parsed.summary =
      parsed.summary ||
      parsed.business_summary ||
      parsed["business summary"] ||
      parsed["Business summary"] ||
      null

    parsed.categories = normalizeToArray(
      parsed.categories || parsed.Categories
    )

    parsed.tags = normalizeToArray(
      parsed.tags || parsed.Tags
    )

    parsed.certifications = parsed.certifications || parsed.Certifications || []

    if (!parsed.summary) {
      console.error("❌ Missing summary:", parsed)
      return null
    }

    if (isBadAIOutput(parsed.summary)) return null

    const summaryLower = parsed.summary.toLowerCase()

    if (
      summaryLower.includes("domain for sale") ||
      summaryLower.includes("listed for sale") ||
      summaryLower.includes("make an offer")
    ) {
      console.log("🧨 AI detected parked domain → skipping")
      return null
    }

    const regexCerts = extractISOs(text)

    parsed.certifications = [
      ...new Set([
        ...parsed.certifications,
        ...regexCerts
      ])
    ]

    parsed.confidence = parsed.confidence || 0.6

    console.log("🧠 AI RESULT:", parsed)

    return parsed

  } catch (err) {

    if (retries > 0) {
      return enrichWithAI(text, retries - 1)
    }

    console.error("❌ AI ERROR:", err.message)
    return null
  }
}

/* ---------------- SAVE ---------------- */

async function saveEnrichment(abn, ai, rawText) {

  // 🔥 EXTRA SAFETY
  if (!Array.isArray(ai.categories)) ai.categories = []
  if (!Array.isArray(ai.tags)) ai.tags = []

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

  let certifications = []

  if (Array.isArray(ai.certifications)) {
    certifications = ai.certifications
  } else if (typeof ai.certifications === "string") {
    certifications = [ai.certifications]
  }

  console.log("🛡️ Certifications to save:", certifications)

  for (let cert of certifications) {

    if (!cert || typeof cert !== "string") continue

    const cleanCert = cert
      .replace(/[\n\r\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    console.log("➡️ Saving cert:", cleanCert)

    let confidence = 0.6

    if (extractISOs(rawText).includes(cleanCert)) {
      confidence += 0.2
    }

    try {
      await pool.query(`
        INSERT INTO supplier_certifications (abn, standard, source, confidence)
        VALUES ($1, $2, $3, $4)
      `, [
        String(abn).trim(),
        cleanCert,
        "ai",
        Math.min(confidence, 1)
      ])

      console.log("✅ Saved cert:", cleanCert)

    } catch (err) {
      console.error("❌ INSERT ERROR:", cleanCert, err.message)
    }
  }
}

/* ---------------- MAIN LOOP ---------------- */

async function run() {
  console.log("🔁 Worker loop started")

  while (true) {
    const suppliers = await getSuppliers()

    if (suppliers.length === 0) {
      console.log("⏳ No suppliers left, waiting...")
      await new Promise(r => setTimeout(r, 10000))
      continue
    }

    for (const supplier of suppliers) {
      console.log("⚙️ Enriching:", supplier.abn)

      const text = await scrapeWebsite(supplier.website)

      if (!text) {
        console.log("❌ No text:", supplier.abn)
        await markFailed(supplier.abn)
        continue
      }

      if (isJunkContent(text, supplier.website)) {
        console.log("❌ Junk site:", supplier.abn)
        await markFailed(supplier.abn)
        continue
      }

      const ai = await enrichWithAI(text)

      if (!ai) {
        console.log("❌ AI FAILED or SKIPPED:", supplier.abn)
        await markFailed(supplier.abn)
        continue
      }

      await saveEnrichment(supplier.abn, ai, text)

      console.log("✅ Saved:", supplier.abn)

      await new Promise(r => setTimeout(r, 1000))
    }
  }
}

run()