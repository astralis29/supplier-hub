"use client";

import { useEffect, useState } from "react";

export default function SearchPage() {

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    const delay = setTimeout(() => {
      fetchSuppliers();
    }, 300);

    return () => clearTimeout(delay);

  }, [query, stateFilter]);

  async function fetchSuppliers() {

    setLoading(true);

    const params = new URLSearchParams();

    if (query) params.append("q", query);
    if (stateFilter) params.append("state", stateFilter);

    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();

    setSuppliers(Array.isArray(data) ? data : []);

    setLoading(false);

  }

  return (

    <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

      {/* Hero */}

      <div className="space-y-4">

        <h1 className="text-4xl font-bold">
          Discover Industrial Suppliers
        </h1>

        <p className="text-gray-500">
          Search verified Australian businesses by company name, capability, or industry.
        </p>

      </div>

      {/* Filters */}

      <div className="flex gap-4 flex-wrap items-center">

        <input
          className="border p-3 rounded-lg min-w-[260px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Search suppliers, capabilities, industries..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="border p-3 rounded-lg"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >

          <option value="">All States</option>
          <option value="NSW">NSW</option>
          <option value="VIC">VIC</option>
          <option value="QLD">QLD</option>
          <option value="WA">WA</option>
          <option value="SA">SA</option>
          <option value="TAS">TAS</option>
          <option value="NT">NT</option>
          <option value="ACT">ACT</option>

        </select>

        <div className="text-sm text-gray-500">
          {suppliers.length} suppliers found
        </div>

      </div>

      {/* Loading */}

      {loading && (

        <div className="flex items-center gap-2 text-gray-500">

          <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />

          Searching suppliers...

        </div>

      )}

      {/* Results */}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {suppliers.map((supplier: any) => (

          <div
            key={supplier.abn}
            className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-xl transition duration-200 space-y-4"
          >

            {/* Logo + Name */}

            <div className="flex items-center gap-3">

              {supplier.domain ? (

                <img
                  src={`https://logo.clearbit.com/${supplier.domain}`}
                  className="w-10 h-10 rounded"
                  onError={(e:any)=> e.currentTarget.style.display="none"}
                />

              ) : (

                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">
                  🏭
                </div>

              )}

              <div>

                <div className="font-bold text-gray-900">
                  {supplier.abn_name || supplier.name}
                </div>

                {(supplier.state || supplier.postcode) && (

                  <div className="text-sm text-gray-500">

                    {supplier.state} {supplier.postcode}

                  </div>

                )}

              </div>

            </div>

            {/* Website */}

            {supplier.website && (

              <div className="text-sm">

                🌐{" "}

                <a
                  href={supplier.website}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  {supplier.domain || supplier.website}
                </a>

              </div>

            )}

            {/* Capabilities */}

            <div className="flex flex-wrap gap-2">

              {supplier.keywords?.slice(0,4).map((k:any) => (

                <span
                  key={k}
                  className="text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  {k}
                </span>

              ))}

              {!supplier.keywords && (

                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  Industrial Supplier
                </span>

              )}

            </div>

            {/* Business Info */}

            <div className="text-xs text-gray-500 space-y-1 border-t pt-3">

              <div>
                <strong>ABN:</strong> {supplier.abn}
              </div>

              {supplier.abn_status && (

                <div>
                  <strong>ABN Status:</strong> {supplier.abn_status}
                </div>

              )}

              {supplier.gst_registered !== undefined && (

                <div>
                  <strong>GST Registered:</strong>{" "}
                  {supplier.gst_registered ? "Yes" : "No"}
                </div>

              )}

            </div>

            {/* CTA */}

            {supplier.website && (

              <a
                href={supplier.website}
                target="_blank"
                className="block text-center text-sm border rounded-lg py-2 hover:bg-gray-100 transition"
              >

                Visit Website

              </a>

            )}

          </div>

        ))}

      </div>

      {!loading && suppliers.length === 0 && (

        <div className="text-gray-500">
          No suppliers found
        </div>

      )}

    </main>

  );

}