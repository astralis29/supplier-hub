const industries = [
  "Mining",
  "Manufacturing",
  "Energy",
  "Construction",
  "Engineering",
  "Logistics",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100">

      {/* HERO SECTION */}
      <section
        className="relative min-h-[100vh] flex items-center justify-center text-center bg-cover bg-center"
        style={{ backgroundImage: "url('/forest-bg.jpg')" }}
      >
        {/* Overlay */}
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

            <button className="mt-6 bg-black text-white px-6 py-3 rounded-xl">
              Search Suppliers
            </button>

            <p className="text-xs text-gray-500 mt-4 tracking-wide">
              Official Business Register Integration · AI Capability Mapping · Structured Industry Taxonomy
            </p>
          </div>
        </div>
      </section>


      {/* FEATURE SECTION */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">

          {/* INDUSTRY NEWS (spans 2 columns) */}
          <div className="md:col-span-2 bg-white p-10 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition relative overflow-hidden">

            {/* Left Accent */}
            <div className="absolute left-0 top-0 h-full w-1 bg-red-600"></div>

            {/* Live Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-70"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>

              <span className="text-xs font-semibold tracking-widest text-red-600 uppercase">
                Live Industry Feed
              </span>
            </div>

            <h3 className="font-semibold text-2xl mb-4 text-gray-900">
              Industry News Intelligence
            </h3>

            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
              Real-time project announcements, regulatory updates and supply chain
              developments across key industrial sectors.
            </p>
          </div>

          {/* VERIFIED */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-3">
              Verified Business Data
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Connected directly to the Business Register for accurate and up-to-date records.
            </p>
          </div>

          {/* AI */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-3">
              AI Capability Mapping
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Automated domain intelligence identifies supplier services,
              certifications and operational strengths.
            </p>
          </div>

          {/* CLASSIFICATION */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-3">
              Industry Classification
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Structured categorisation across mining, manufacturing,
              engineering and industrial supply chains.
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