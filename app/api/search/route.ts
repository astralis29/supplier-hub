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

      // If no search query, return default suppliers
      if (!q) {

        const result = await pool.query(`
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
          ORDER BY abn_name
          LIMIT 500
        `)

        return Response.json(result.rows)
      }

      // If search query exists
      const search = `%${q}%`

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
        ORDER BY abn_name
        LIMIT 500
        `,
        [search]
      )

      return Response.json(result.rows)

    } catch (err) {
      console.error(err)
      return Response.json({ error: String(err) }, { status: 500 })
    }
  }