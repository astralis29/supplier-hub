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
          SELECT 1
          FROM unnest(sp.keywords) k
          WHERE k ILIKE $1
        )
        OR EXISTS (
          SELECT 1
          FROM unnest(sp.capabilities) c
          WHERE c ILIKE $1
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
          SELECT 1
          FROM unnest(sp.capabilities) c
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

    /* ---------- NEXT CURSOR ---------- */

    const nextCursor =
      result.rows.length === limit
        ? result.rows[result.rows.length - 1].abn_name
        : null

    return Response.json({
      suppliers: result.rows,
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