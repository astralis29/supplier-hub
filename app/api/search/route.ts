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

    const result = await pool.query(
      `
      SELECT
  abn,
  abn_name,
  website,
  domain,
  website_name,
  keywords,
  gst_registered,
  abn_status
      FROM supplier_profiles
      WHERE
        abn_name ILIKE $1
        OR array_to_string(keywords,' ') ILIKE $1
      LIMIT 20
      `,
      [`%${q}%`]
    )

    return Response.json(result.rows)

  } catch (err) {
    console.error(err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}