import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export async function GET() {

  const result = await pool.query(`
    SELECT DISTINCT country
    FROM supplier_profiles
    ORDER BY country
  `)

  return Response.json(result.rows)

}