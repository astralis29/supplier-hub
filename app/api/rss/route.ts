import { getRSSData } from "@/lib/rss"

export const revalidate = 300

export async function GET() {
  try {
    const items = await getRSSData()

    return Response.json({ items })
  } catch (err) {
    console.error(err)
    return Response.json({ items: [] })
  }
}