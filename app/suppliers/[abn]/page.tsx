export const dynamic = "force-dynamic"
import { Pool } from "pg"
import SupplierLogo from "../../components/SupplierLogo"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export default async function SupplierPage({
  params,
}: {
  params: { abn?: string | string[] }
}) {

  // 🔥 BULLETPROOF PARAM HANDLING
  const rawAbn = params?.abn
  const abn = Array.isArray(rawAbn) ? rawAbn[0] : rawAbn

  // 🔍 DEBUG (remove later)
  console.log("PARAMS FULL:", params)
  console.log("RAW ABN:", rawAbn)
  console.log("FINAL ABN:", abn)

  // ❌ HARD STOP IF BROKEN
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

      {/* HEADER */}
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

      {/* 🧠 AI SUMMARY */}
      {supplier.ai_summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border">
          <h2 className="text-lg font-semibold mb-2">🧠 AI Summary</h2>
          <p className="text-gray-700 leading-relaxed">
            {supplier.ai_summary}
          </p>

          {supplier.ai_confidence && (
            <div className="text-xs text-gray-500 mt-2">
              Confidence: {(supplier.ai_confidence * 100).toFixed(0)}%
            </div>
          )}
        </div>
      )}

      {/* 🏷️ AI CATEGORIES */}
      {supplier.ai_categories?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">AI Categories</h2>
          <div className="flex flex-wrap gap-2">
            {supplier.ai_categories.map((c: any) => (
              <span key={c} className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 🏷️ AI TAGS */}
      {supplier.ai_tags?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">AI Tags</h2>
          <div className="flex flex-wrap gap-2">
            {supplier.ai_tags.map((t: any) => (
              <span key={t} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CAPABILITIES */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Capabilities</h2>
        <div className="flex flex-wrap gap-2">
          {supplier.capabilities?.map((c: any) => (
            <span key={c} className="bg-gray-100 px-3 py-1 rounded text-sm">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* KEYWORDS */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Keywords Detected</h2>
        <div className="flex flex-wrap gap-2">
          {supplier.keywords?.map((k: any) => (
            <span key={k} className="bg-blue-50 px-3 py-1 rounded text-sm">
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* BUSINESS INFO */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-3">Business Information</h2>
        <div className="space-y-1 text-gray-600">
          <div>ABN: {supplier.abn}</div>
          <div>ABN Status: {supplier.abn_status}</div>
          <div>GST Registered: {supplier.gst_registered ? "Yes" : "No"}</div>
        </div>
      </div>

    </main>

  )
}