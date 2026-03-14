import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export async function GET(req: Request) {
  try {

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""

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
        ($1 = '%%')
        OR sp.abn_name ILIKE $1
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