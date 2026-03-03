"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SearchPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [capability, setCapability] = useState("");

  useEffect(() => {
    fetchSuppliers();
  }, [country, industry, capability]);

  async function fetchSuppliers() {
    let query = supabase.from("suppliers").select("*");

    if (country) {
      query = query.eq("country", country);
    }

    if (industry) {
      query = query.eq("industry", industry);
    }

    if (capability) {
      query = query.ilike("capability", `%${capability}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setSuppliers(data);
    }
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Search Suppliers</h1>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          className="border p-2"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="">Select Country</option>
          <option value="Australia">Australia</option>
        </select>

        <select
          className="border p-2"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="">Select Industry</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Defence">Defence</option>
          <option value="Mining">Mining</option>
        </select>

        <input
          className="border p-2"
          placeholder="Capability (e.g. Fabrication)"
          value={capability}
          onChange={(e) => setCapability(e.target.value)}
        />
      </div>

      {/* Results */}
      <div className="space-y-4">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="border p-4 rounded shadow"
          >
            <h2 className="text-lg font-semibold">{supplier.name}</h2>
            <p>ABN: {supplier.abn}</p>
            <p>{supplier.country}</p>
            <p>{supplier.industry}</p>
            <p>{supplier.capability}</p>
          </div>
        ))}
      </div>
    </main>
  );
}