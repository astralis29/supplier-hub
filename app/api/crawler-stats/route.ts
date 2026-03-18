import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
})

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*) 
      FROM crawl_queue
      GROUP BY status
    `)

    const stats: any = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    }

    result.rows.forEach((row: any) => {
      stats[row.status] = Number(row.count)
    })

    return Response.json(stats)

  } catch (err) {
    console.error("Crawler stats error:", err)

    return Response.json(
      { error: "Failed to fetch crawler stats" },
      { status: 500 }
    )
  }
}