import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export async function GET(req: Request) {

  try {

    const { searchParams } = new URL(req.url)

    const q = searchParams.get("q") || ""
    const country = searchParams.get("country")
    const capability = searchParams.get("capability")
    const cursor = searchParams.get("cursor")
    const suggest = searchParams.get("suggest")

    /* -----------------------------------------
       AUTOCOMPLETE MODE
    ------------------------------------------*/

    if (suggest && q.length >= 2) {

      const result = await pool.query(`
        SELECT capability
        FROM capability_stats
        WHERE capability ILIKE $1
        ORDER BY total DESC
        LIMIT 10
      `, [`%${q}%`])

      return Response.json({
        suggestions: result.rows
      })
    }

    /* -----------------------------------------
       NORMAL SUPPLIER SEARCH
    ------------------------------------------*/

    const limit = 25
    const search = `%${q}%`

    let query = `
      SELECT
        sp.abn,
        sp.abn_name,
        sp.website,
        sp.domain,
        sp.website_name,
        sp.keywords,
        sp.capabilities,
        sp.industry,

        abr.abn_status,
        abr.gst_registered,
        abr.postcode,

        COALESCE(
          abr.state,
          CASE
            WHEN abr.postcode BETWEEN '2000' AND '2599' THEN 'NSW'
            WHEN abr.postcode BETWEEN '2600' AND '2618' THEN 'ACT'
            WHEN abr.postcode BETWEEN '3000' AND '3999' THEN 'VIC'
            WHEN abr.postcode BETWEEN '4000' AND '4999' THEN 'QLD'
            WHEN abr.postcode BETWEEN '5000' AND '5799' THEN 'SA'
            WHEN abr.postcode BETWEEN '6000' AND '6797' THEN 'WA'
            WHEN abr.postcode BETWEEN '7000' AND '7799' THEN 'TAS'
            WHEN abr.postcode BETWEEN '800' AND '899' THEN 'NT'
          END
        ) AS state

      FROM supplier_profiles sp
      LEFT JOIN abr_businesses abr
      ON sp.abn = abr.abn

      WHERE
      (
        ($1 = '%%')
        OR sp.abn_name ILIKE $1
        OR EXISTS (
          SELECT 1 FROM unnest(sp.keywords) k WHERE k ILIKE $1
        )
        OR EXISTS (
          SELECT 1 FROM unnest(sp.capabilities) c WHERE c ILIKE $1
        )
      )
    `

    const params: any[] = [search]
    let index = 2

    /* ---------- COUNTRY FILTER ---------- */

    if (country) {
      query += ` AND sp.country = $${index}`
      params.push(country)
      index++
    }

    /* ---------- CAPABILITY FILTER ---------- */

    if (capability) {
      query += `
        AND EXISTS (
          SELECT 1 FROM unnest(sp.capabilities) c
          WHERE c ILIKE $${index}
        )
      `
      params.push(`%${capability}%`)
      index++
    }

    /* ---------- CURSOR PAGINATION ---------- */

    if (cursor) {
      query += ` AND sp.abn_name > $${index}`
      params.push(cursor)
      index++
    }

    /* ---------- MAIN QUERY ---------- */

    query += `
      ORDER BY sp.abn_name
      LIMIT ${limit}
    `

    const result = await pool.query(query, params)

    /* -----------------------------------------
       🔥 CLEAN DOMAIN FOR FAVICON (FINAL FIX)
    ------------------------------------------*/

    const suppliers = result.rows.map((s: any) => {

      let favicon_domain: string | null = null

      // ✅ 1. Use domain field if valid
      if (s.domain && typeof s.domain === "string") {
        let clean = s.domain.trim().toLowerCase()

        if (clean.includes(".")) {
          clean = clean.replace(/^www\./, "")
          favicon_domain = clean
        }
      }

      // ✅ 2. Extract from website URL if needed
      if (!favicon_domain && s.website && typeof s.website === "string") {
        try {
          const url = new URL(
            s.website.startsWith("http")
              ? s.website
              : `https://${s.website}`
          )

          let host = url.hostname.toLowerCase()
          host = host.replace(/^www\./, "")

          if (host.includes(".")) {
            favicon_domain = host
          }

        } catch {
          // ignore invalid website values like "Hanwha Group"
        }
      }

      return {
        ...s,
        favicon_domain
      }
    })

    const nextCursor =
      suppliers.length === limit
        ? suppliers[suppliers.length - 1]?.abn_name || null
        : null

    return Response.json({
      suppliers,
      nextCursor
    })

  } catch (err) {

    console.error(err)

    return Response.json(
      { error: String(err) },
      { status: 500 }
    )

  }

}