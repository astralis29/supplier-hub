import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

export async function GET(req: Request) {
  try {

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""

    // If no search query
    if (!q) {

      const result = await pool.query(`
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
          abr.state,
          abr.postcode

        FROM supplier_profiles sp

        LEFT JOIN abr_businesses abr
        ON sp.abn = abr.abn

        ORDER BY sp.abn_name
        LIMIT 100
      `)

      return Response.json(result.rows)
    }

    const search = `%${q}%`

    const result = await pool.query(
      `
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
        abr.state,
        abr.postcode

      FROM supplier_profiles sp

      LEFT JOIN abr_businesses abr
      ON sp.abn = abr.abn

      WHERE
        sp.abn_name ILIKE $1
        OR array_to_string(sp.keywords,' ') ILIKE $1
        OR array_to_string(sp.capabilities,' ') ILIKE $1

      ORDER BY sp.abn_name
      LIMIT 1000
      `,
      [search]
    )

    return Response.json(result.rows)

  } catch (err) {
    console.error(err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}