export const revalidate = 0;
export const dynamic = "force-dynamic";

import { getIndustrySignals } from "@/lib/data";

const industries = [
  "Mining",
  "Manufacturing",
  "Energy",
  "Construction",
  "Engineering",
  "Logistics",
];

export default async function Home() {

  const signals = await getIndustrySignals() ?? [];

  /* INDUSTRY FILTER */
  const industryTerms = [
    "mining",
    "mine",
    "lithium",
    "copper",
    "iron ore",
    "steel",
    "manufacturing",
    "factory",
    "engineering",
    "energy",
    "gas",
    "oil",
    "construction",
    "infrastructure",
    "logistics",
    "port",
    "supply chain",
    "machinery",
    "equipment"
  ];

  const industrySignals = signals.filter((s:any) =>
    industryTerms.some(term =>
      s.title?.toLowerCase().includes(term) ||
      s.description?.toLowerCase().includes(term)
    )
  );

  /* FALLBACK — if filters remove everything */
  const usableSignals = industrySignals.length > 0 ? industrySignals : signals;

const highRisk = usableSignals.filter((s:any) => s.risk_score >= 60);
const mediumRisk = usableSignals.filter((s:any) => s.risk_score >= 30 && s.risk_score < 60);

/* fallback: show latest news even if risk = 0 */
const normalSignals =
  signals.filter((s:any) => s.risk_score < 30).length > 0
    ? signals.filter((s:any) => s.risk_score < 30)
    : signals;
  /* GLOBAL RISK INDEX */
  const avgRisk =
    usableSignals.length > 0
      ? Math.round(
          usableSignals.reduce((acc:any, s:any) => acc + (s.risk_score || 0), 0) /
          usableSignals.length
        )
      : 0;

  return (

    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100">

      {/* HERO SECTION */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center text-center bg-cover bg-center"
        style={{ backgroundImage: "url('/forest-bg.jpg')" }}
      >

        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-black/80"></div>

        <div className="relative z-10 w-full max-w-5xl px-6">

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
            Discover Verified Industrial Suppliers
            <br />
            <span className="text-gray-300 font-semibold">
              with Structured Capability Intelligence
            </span>
          </h1>

          <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
            Connected directly to the National Business Register.
            AI-driven capability mapping powered by intelligent analysis.
          </p>

          {/* SEARCH CARD */}
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">

            <h2 className="text-left text-xl font-semibold mb-6 text-gray-800">
              Search Suppliers
            </h2>

            <div className="grid md:grid-cols-3 gap-4">

              <select className="border rounded-xl p-4">
                <option>Australia</option>
              </select>

              <select className="border rounded-xl p-4">
                {industries.map((industry) => (
                  <option key={industry}>{industry}</option>
                ))}
              </select>

              <input
                placeholder="Capability (e.g. Heavy Fabrication)"
                className="border rounded-xl p-4"
              />

            </div>

            <a
              href="/search"
              className="inline-block mt-6 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition"
            >
              Search Suppliers
            </a>

            <p className="text-xs text-gray-500 mt-4 tracking-wide">
              Official Business Register Integration · AI Capability Mapping · Structured Industry Taxonomy
            </p>

          </div>

        </div>

      </section>


      {/* LIVE SUPPLY CHAIN ALERT BAR */}
      {highRisk.length > 0 && (
        <section className="bg-red-600 text-white py-2 overflow-hidden">

          <div className="max-w-7xl mx-auto">

            <div className="flex gap-10 animate-marquee whitespace-nowrap">

              {highRisk.slice(0,10).map((alert:any,i:number)=>(
                <span key={i} className="font-medium">
                  ⚠ {alert.title} (Risk {alert.risk_score})
                </span>
              ))}

            </div>

          </div>

        </section>
      )}


      {/* GLOBAL RISK INDEX */}
      <section className="py-8 bg-white border-b border-gray-200">

        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">

          <div>

            <h2 className="text-sm uppercase tracking-wide text-gray-500">
              Global Supply Chain Risk Index
            </h2>

            <div className="text-4xl font-bold text-gray-900">
              {avgRisk} / 100
            </div>

          </div>

          <div className="text-sm text-gray-600">

            {avgRisk >= 60 && <span className="text-red-600 font-semibold">Elevated Risk</span>}
            {avgRisk >= 30 && avgRisk < 60 && <span className="text-orange-500 font-semibold">Moderate Risk</span>}
            {avgRisk < 30 && <span className="text-green-600 font-semibold">Normal Conditions</span>}

          </div>

        </div>

      </section>


      {/* SUPPLY CHAIN RISK DASHBOARD */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">

        <div className="max-w-6xl mx-auto px-6">

          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Supply Chain Risk Monitor
          </h2>

          {usableSignals.length === 0 && (
            <div className="text-sm text-gray-500">
              No supply chain signals detected yet. RSS crawler may still be running.
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">

            {/* HIGH RISK */}
            <div>

              <h3 className="text-sm font-semibold text-red-600 mb-4">
                High Risk
              </h3>

              {highRisk.slice(0,3).map((signal:any) => (

                <div
                  key={signal.title}
                  className="border-l-4 border-red-600 bg-white rounded-lg p-4 mb-3 hover:shadow-sm transition"
                >

                  <div className="text-xs font-semibold text-red-600 flex items-center gap-2">
                    <span className="h-2 w-2 bg-red-600 rounded-full"></span>
                    HIGH RISK · Score {signal.risk_score}
                  </div>

                  <h3 className="font-semibold text-sm text-gray-900 mt-1">
                    {signal.title}
                  </h3>

                </div>

              ))}

            </div>


            {/* MEDIUM RISK */}
            <div>

              <h3 className="text-sm font-semibold text-orange-500 mb-4">
                Medium Risk
              </h3>

              {mediumRisk.slice(0,3).map((signal:any) => (

                <div
                  key={signal.title}
                  className="border-l-4 border-orange-500 bg-white rounded-lg p-4 mb-3 hover:shadow-sm transition"
                >

                  <div className="text-xs font-semibold text-orange-500 flex items-center gap-2">
                    <span className="h-2 w-2 bg-orange-500 rounded-full"></span>
                    MEDIUM RISK · Score {signal.risk_score}
                  </div>

                  <h3 className="font-semibold text-sm text-gray-900 mt-1">
                    {signal.title}
                  </h3>

                </div>

              ))}

            </div>


            {/* NORMAL SIGNALS */}
            <div>

              <h3 className="text-sm font-semibold text-gray-600 mb-4">
                Industry Signals
              </h3>

              {signals.slice(0,3).map((signal:any) => (

                <div
                  key={signal.title}
                  className="border-l-4 border-gray-300 bg-white rounded-lg p-4 mb-3 hover:shadow-sm transition"
                >

                  <div className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <span className="h-2 w-2 bg-gray-400 rounded-full"></span>
                    INDUSTRY SIGNAL
                  </div>

                  <h3 className="font-semibold text-sm text-gray-900 mt-1">
                    {signal.title}
                  </h3>

                </div>

              ))}

            </div>

          </div>

        </div>

      </section>


      {/* PLATFORM FEATURES */}
      <section className="py-12 bg-white border-t border-gray-200">

        <div className="max-w-6xl mx-auto px-6">

          <div className="mb-16">

            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Platform Intelligence Infrastructure
            </h2>

            <p className="text-gray-600 max-w-2xl">
              Verified supplier data, structured industry taxonomy and
              real-time industrial intelligence powering procurement decisions.
            </p>

          </div>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="py-12 bg-black text-gray-400 text-center text-sm">
        © {new Date().getFullYear()} What's the Supplier? · Enterprise Procurement Intelligence
      </footer>

    </main>

  );

}