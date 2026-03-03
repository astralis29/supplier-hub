export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* HERO */}
      <section className="py-28 text-center px-6 bg-white">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Discover Verified Industrial Suppliers in Minutes
        </h1>

        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Search by country, industry and capabilities. Powered by Australian Business
          Register integration and intelligent domain analysis.
        </p>
      </section>

      {/* SEARCH SECTION */}
      <section className="max-w-5xl mx-auto px-6 -mt-10">
        <div className="bg-white shadow-2xl rounded-2xl p-10 border">
          <h2 className="text-2xl font-semibold mb-8 text-left">
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

          <button className="mt-8 bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition text-lg font-medium">
            Search Suppliers
          </button>
        </div>
      </section>

      {/* VALUE SECTION */}
      <section className="mt-32 bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 text-left">
            <div className="bg-white p-10 rounded-2xl shadow-md">
              <h3 className="font-semibold text-xl mb-4">
                Verified Business Data
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Connected directly to the Australian Business Register for
                accurate and up-to-date entity records.
              </p>
            </div>

            <div className="bg-white p-10 rounded-2xl shadow-md">
              <h3 className="font-semibold text-xl mb-4">
                AI Capability Mapping
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Automated crawling identifies supplier services, certifications
                and technical capabilities.
              </p>
            </div>

            <div className="bg-white p-10 rounded-2xl shadow-md">
              <h3 className="font-semibold text-xl mb-4">
                Industry Classification
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Structured categorisation for mining, manufacturing,
                engineering and industrial sectors.
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}