"use client";

import { useEffect, useState } from "react";

export default function SearchPage() {

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [capability, setCapability] = useState("");

  useEffect(() => {
    fetchSuppliers();
  }, [country, industry, capability]);

  async function fetchSuppliers() {

    const searchTerm = capability || industry || "";

    const res = await fetch(`/api/search?q=${searchTerm}`);
    const data = await res.json();

    setSuppliers(Array.isArray(data) ? data : [])

  }

  return (

    <main className="max-w-6xl mx-auto p-8 space-y-8">

      <h1 className="text-3xl font-bold">
        Search Suppliers
      </h1>

      {/* Filters */}

      <div className="flex gap-4 flex-wrap">

        <select
          className="border p-2 rounded"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="">Country</option>
          <option value="Australia">Australia</option>
        </select>

        <select
          className="border p-2 rounded"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="">Industry</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Defence">Defence</option>
          <option value="Mining">Mining</option>
          <option value="Energy">Energy</option>
          <option value="Engineering">Engineering</option>
        </select>

        <input
          className="border p-2 rounded"
          placeholder="Capability (eg Steel Fabrication)"
          value={capability}
          onChange={(e) => setCapability(e.target.value)}
        />

      </div>

      {/* Results */}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {suppliers.map((supplier: any, i: number) => (

          <div
            key={i}
            className="border rounded-xl p-6 bg-white shadow hover:shadow-md transition"
          >

            <div className="text-lg font-semibold">
              {supplier.name}
            </div>

            <div className="text-gray-500 mt-2">
              {supplier.state} {supplier.postcode}
            </div>

          </div>

        ))}

      </div>

      {suppliers.length === 0 && (

        <div className="text-gray-500">
          No suppliers found
        </div>

      )}

    </main>

  );

}