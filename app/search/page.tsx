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

    <main className="max-w-7xl mx-auto p-8 space-y-10">

      <h1 className="text-4xl font-bold">
        Discover Industrial Suppliers
      </h1>

      {/* Filters */}

      <div className="flex gap-4 flex-wrap items-center">

        <input
          className="border p-3 rounded-lg min-w-[260px]"
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

      </div>

      {/* Loading */}

      {loading && (
        <div className="text-gray-500">
          Searching suppliers...
        </div>
      )}

      {/* Results */}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {suppliers.map((supplier: any) => (

          <div
            key={supplier.abn}
            className="border rounded-xl p-6 bg-white shadow hover:shadow-lg transition space-y-4"
          >

            {/* Logo + Name */}

            <div className="flex items-center gap-3">

              {supplier.domain && (
                <img
                  src={`https://logo.clearbit.com/${supplier.domain}`}
                  className="w-10 h-10 rounded"
                />
              )}

              <div className="text-lg font-semibold">
                {supplier.abn_name || supplier.name}
              </div>

            </div>

            {/* Location */}

            {(supplier.state || supplier.postcode) && (
              <div className="text-sm text-gray-500">
                {supplier.state} {supplier.postcode}
              </div>
            )}

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

            {supplier.keywords && (
              <div className="flex flex-wrap gap-2">

                {supplier.keywords.slice(0,4).map((k:any) => (

                  <span
                    key={k}
                    className="text-xs bg-gray-100 px-2 py-1 rounded"
                  >
                    {k}
                  </span>

                ))}

              </div>
            )}

            {/* Business info */}

            <div className="text-xs text-gray-500 space-y-1">

              <div>
                ABN: {supplier.abn}
              </div>

              {supplier.abn_status && (
                <div>
                  ABN Status: {supplier.abn_status}
                </div>
              )}

              {supplier.gst_registered && (
                <div>
                  GST Registered: {supplier.gst_registered ? "Yes" : "No"}
                </div>
              )}

            </div>

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