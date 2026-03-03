export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100">

      {/* HERO */}
      <section className="py-28 px-6 text-center">
        <div className="max-w-4xl mx-auto">

          <div className="inline-block mb-6 px-4 py-2 bg-black text-white text-sm rounded-full">
            Enterprise Supplier Intelligence
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Discover Verified Industrial Suppliers
            <span className="block text-gray-500 mt-2">
              with Structured Capability Intelligence
            </span>
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Connected directly to the Australian Business Register.
            AI-driven capability mapping powered by intelligent domain analysis.
          </p>
        </div>
      </section>


      {/* SEARCH CARD */}
      <section className="max-w-5xl mx-auto px-6 -mt-12">
        <div className="bg-white shadow-2xl rounded-2xl p-10 border border-gray-200">

          <h2 className="text-xl font-semibold mb-6 text-left">
            Search Suppliers
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            <select className="border rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black">
              <option>Australia</option>
            </select>

            <select className="border rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black">
              <option>Mining</option>
            </select>

            <input
              placeholder="Capability (e.g. Heavy Fabrication)"
              className="border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <button className="mt-8 bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition font-medium">
            Search Suppliers
          </button>
        </div>
      </section>


      {/* TRUST STRIP */}
      <section className="mt-24 py-10 bg-white border-t border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-center text-sm text-gray-600">

          <div>
            <div className="font-semibold text-black mb-1">
              ABR Verified
            </div>
            Official Australian Business Register integration
          </div>

          <div>
            <div className="font-semibold text-black mb-1">
              AI Capability Mapping
            </div>
            Intelligent classification of technical services
          </div>

          <div>
            <div className="font-semibold text-black mb-1">
              Industry Structured
            </div>
            Standardised taxonomy across sectors
          </div>

        </div>
      </section>


      {/* FEATURE CARDS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-3">
              Verified Business Data
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Connected directly to the Australian Business Register for
              accurate and up-to-date entity records.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-3">
              AI Capability Mapping
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Automated domain intelligence identifies supplier services,
              certifications and operational strengths.
            </p>
          </div>

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
  )
}