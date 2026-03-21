export const dynamic = "force-dynamic"

import { Pool } from "pg"
import SupplierLogo from "../../components/SupplierLogo"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

type PageProps = {
  params?: { abn?: string }
  searchParams?: { abn?: string }
}

export default async function SupplierPage(props: PageProps) {

  // 🔥 MULTI-SOURCE PARAM FIX (THIS IS THE KEY)
  const abn =
    props?.params?.abn ||
    props?.searchParams?.abn ||
    null

  console.log("PROPS:", props)
  console.log("FINAL ABN:", abn)

  if (!abn) {
    return <div className="p-10">ABN missing from URL</div>
  }

  const result = await pool.query(`
    SELECT
      sp.*,
      abr.abn_status,
      abr.gst_registered,
      abr.postcode,
      abr.state
    FROM supplier_profiles sp
    LEFT JOIN abr_businesses abr
      ON sp.abn = abr.abn
    WHERE TRIM(sp.abn) = TRIM($1)
    LIMIT 1
  `, [abn])

  const supplier = result.rows[0]

  if (!supplier) {
    return <div className="p-10">Supplier not found</div>
  }

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-8">

      <div className="flex items-start gap-6">
        <SupplierLogo
          name={supplier.abn_name}
          website={supplier.domain}
          size={80}
        />

        <div>
          <h1 className="text-3xl font-bold">
            {supplier.abn_name}
          </h1>

          <div className="text-gray-500">
            {supplier.state} {supplier.postcode}
          </div>

          {supplier.website && (
            <a
              href={supplier.website}
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              🌐 {supplier.website}
            </a>
          )}
        </div>
      </div>

      {supplier.ai_summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border">
          <h2 className="text-lg font-semibold mb-2">🧠 AI Summary</h2>
          <p className="text-gray-700 leading-relaxed">
            {supplier.ai_summary}
          </p>
        </div>
      )}

    </main>
  )
}