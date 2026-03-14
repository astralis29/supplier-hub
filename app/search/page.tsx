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

    <main className="max-w-6xl mx-auto p-8 space-y-8">

      <h1 className="text-3xl font-bold">
        Search Suppliers
      </h1>

      {/* Filters */}

      <div className="flex gap-4 flex-wrap">

        {/* Search */}

        <input
          className="border p-2 rounded min-w-[240px]"
          placeholder="Search company name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* State */}

        <select
          className="border p-2 rounded"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >

          <option value="">State</option>
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
            className="border rounded-xl p-6 bg-white shadow hover:shadow-md transition"
          >

            <div className="text-lg font-semibold">
              {supplier.name}
            </div>

            <div className="text-gray-500 mt-2">
              {supplier.state} {supplier.postcode}
            </div>

            <div className="text-xs text-gray-400 mt-2">
              ABN: {supplier.abn}
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