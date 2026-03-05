"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SearchPage() {

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);

  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [capability, setCapability] = useState("");

  useEffect(() => {
    fetchSuppliers();
    fetchSignals();
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

  async function fetchSignals() {

    const { data } = await supabase
      .from("industry_news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(50);

    if (data) {
      setSignals(data);
    }

  }

  /* Calculate supplier risk from industry signals */
  function calculateSupplierRisk(industry: string) {

    const relatedSignals = signals.filter((s:any) =>
      s.title?.toLowerCase().includes(industry.toLowerCase())
    );

    if (relatedSignals.length === 0) return 0;

    const avg =
      relatedSignals.reduce((acc:any, s:any) => acc + (s.risk_score || 0), 0) /
      relatedSignals.length;

    return Math.round(avg);

  }

  /* Get latest signals affecting supplier */
  function getSupplierSignals(industry: string) {

    return signals
      .filter((s:any) =>
        s.title?.toLowerCase().includes(industry.toLowerCase())
      )
      .slice(0,3);

  }

  return (

    <main className="p-8 space-y-8 max-w-6xl mx-auto">

      <h1 className="text-3xl font-bold">
        Supplier Intelligence Search
      </h1>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">

        <select
          className="border p-2 rounded"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="">Select Country</option>
          <option value="Australia">Australia</option>
        </select>

        <select
          className="border p-2 rounded"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="">Select Industry</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Defence">Defence</option>
          <option value="Mining">Mining</option>
          <option value="Energy">Energy</option>
          <option value="Engineering">Engineering</option>
        </select>

        <input
          className="border p-2 rounded"
          placeholder="Capability (e.g. Fabrication)"
          value={capability}
          onChange={(e) => setCapability(e.target.value)}
        />

      </div>


      {/* Results */}
      <div className="space-y-6">

        {suppliers.map((supplier) => {

          const riskScore = calculateSupplierRisk(supplier.industry);
          const supplierSignals = getSupplierSignals(supplier.industry);

          return (

            <div
              key={supplier.id}
              className="border rounded-xl p-6 bg-white shadow-sm"
            >

              <div className="flex justify-between items-start">

                <div>

                  <h2 className="text-xl font-semibold">
                    {supplier.name}
                  </h2>

                  <div className="text-sm text-gray-600 mt-1">
                    ABN: {supplier.abn}
                  </div>

                  <div className="text-sm text-gray-600">
                    {supplier.country}
                  </div>

                  <div className="text-sm text-gray-600">
                    Industry: {supplier.industry}
                  </div>

                  <div className="text-sm text-gray-600">
                    Capability: {supplier.capability}
                  </div>

                </div>

                {/* Supplier Risk Score */}
                <div className="text-right">

                  {riskScore >= 60 && (
                    <div className="text-red-600 font-bold">
                      Risk {riskScore}/100
                    </div>
                  )}

                  {riskScore >= 30 && riskScore < 60 && (
                    <div className="text-orange-500 font-bold">
                      Risk {riskScore}/100
                    </div>
                  )}

                  {riskScore < 30 && (
                    <div className="text-green-600 font-bold">
                      Risk {riskScore}/100
                    </div>
                  )}

                </div>

              </div>


              {/* Supplier Signals */}
              {supplierSignals.length > 0 && (

                <div className="mt-4 border-t pt-3">

                  <div className="text-xs uppercase text-gray-500 mb-2">
                    Industry Signals Affecting Supplier
                  </div>

                  {supplierSignals.map((signal:any) => (

                    <div
                      key={signal.id}
                      className="text-sm text-gray-700 mb-1"
                    >

                      • {signal.title}

                    </div>

                  ))}

                </div>

              )}

            </div>

          );

        })}

        {suppliers.length === 0 && (
          <div className="text-gray-500">
            No suppliers found for selected filters.
          </div>
        )}

      </div>

    </main>

  );

}