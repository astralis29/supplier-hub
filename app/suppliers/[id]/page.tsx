export const dynamic = "force-dynamic"

import { Pool } from "pg"
import SupplierLogo from "../../components/SupplierLogo"
import { toTitleCase } from "@/lib/utils"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export default async function SupplierPage(props: any) {

  const params = await props.params
  const abn = params?.id

  if (!abn) {
    return <div className="p-10">ABN missing from URL</div>
  }

  // 🔥 MAIN SUPPLIER (MORE ABR DATA INCLUDED)
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

  // 🔗 RELATED SUPPLIERS (WITH DOMAIN + AI DATA)
  let relatedSuppliers: any[] = []

  if (supplier?.capabilities?.length > 0) {
    const relatedResult = await pool.query(`
      SELECT 
        abn,
        abn_name,
        state,
        postcode,
        capabilities,
        domain,
        ai_summary,
        ai_confidence
      FROM supplier_profiles
      WHERE abn != $1
      AND capabilities && $2
      LIMIT 6
    `, [supplier.abn, supplier.capabilities])

    relatedSuppliers = relatedResult.rows
  }

  return (

    <main className="max-w-5xl mx-auto p-8 space-y-8">

      {/* HEADER */}
      <div className="flex items-start gap-6">

        <SupplierLogo
          name={supplier.abn_name}
          website={supplier.domain} // ✅ favicon via domain
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

      {/* 🧾 ABOUT */}
      {supplier.description && (
        <div>
          <h2 className="text-xl font-semibold mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed">
            {supplier.description}
          </p>
        </div>
      )}

      {/* 🏷️ AI CATEGORIES */}
      {supplier.ai_categories?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">AI Categories</h2>
          <div className="flex flex-wrap gap-2">
            {supplier.ai_categories.map((c: any) => (
              <span key={c} className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm">
                {toTitleCase(c)}
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
                {toTitleCase(t)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CAPABILITIES */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Core Capabilities</h2>
        <div className="flex flex-wrap gap-2">
          {supplier.capabilities?.map((c: any) => (
            <span key={c} className="bg-gray-100 px-3 py-1 rounded text-sm">
              {toTitleCase(c)}
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
              {toTitleCase(k)}
            </span>
          ))}
        </div>
      </div>

      {/* 🏢 FULL BUSINESS INFO (EXPANDED ABR) */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-3">Business Information</h2>
        <div className="space-y-1 text-gray-600">
          <div><strong>ABN:</strong> {supplier.abn}</div>
          <div><strong>Status:</strong> {supplier.abn_status}</div>
          <div><strong>GST:</strong> {supplier.gst_registered ? "Registered" : "Not Registered"}</div>
          <div><strong>Location:</strong> {supplier.state} {supplier.postcode}</div>
          {supplier.country && <div><strong>Country:</strong> {supplier.country}</div>}
          {supplier.industry && <div><strong>Industry:</strong> {supplier.industry}</div>}
          {supplier.sector && <div><strong>Sector:</strong> {supplier.sector}</div>}
        </div>
      </div>

      {/* 🔗 RELATED SUPPLIERS (UPGRADED) */}
      {relatedSuppliers.length > 0 && (
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">
            Suppliers with Similar Capabilities
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            {relatedSuppliers.map((s: any) => (

              <a
                key={s.abn}
                href={`/suppliers/${s.abn}`}
                className="border rounded-lg p-4 hover:shadow-md transition block"
              >

                <div className="flex items-start gap-3">

                  {/* ✅ FAVICON WORKING */}
                  <SupplierLogo
                    name={s.abn_name}
                    website={s.domain}
                    size={40}
                  />

                  <div className="flex-1">

                    <div className="font-semibold">
                      {s.abn_name}
                    </div>

                    <div className="text-sm text-gray-500">
                      {s.state} {s.postcode}
                    </div>

                    {/* 🧠 AI PREVIEW */}
                    {s.ai_summary && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {s.ai_summary}
                      </div>
                    )}

                    {/* CAPABILITIES */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {s.capabilities?.slice(0, 3).map((c: any) => (
                        <span
                          key={c}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {toTitleCase(c)}
                        </span>
                      ))}
                    </div>

                  </div>

                </div>

              </a>

            ))}

          </div>
        </div>
      )}

    </main>
  )
}