export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="py-24 text-center px-6">
        <h1 className="text-4xl md:text-5xl font-semibold mb-6">
          Supplier Intelligence for Industrial Procurement
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover verified suppliers by country, industry and capabilities.
          Powered by ABR integration and domain intelligence crawling.
        </p>
      </section>

      {/* Search Section */}
      <section className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8 mb-20">
        <h2 className="text-2xl font-semibold mb-6">Search Suppliers</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <select className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black">
            <option>Australia</option>
          </select>

          <select className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black">
            <option>Mining</option>
          </select>

          <input
            placeholder="Capability (e.g. Fabrication)"
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <button className="mt-6 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition">
          Search
        </button>
      </section>

      {/* Value Props */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-8 rounded-xl shadow">
            <h3 className="font-semibold text-xl mb-4">
              Verified Business Data
            </h3>
            <p className="text-gray-600">
              Connected to the Australian Business Register for accurate entity records.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow">
            <h3 className="font-semibold text-xl mb-4">
              AI Capability Mapping
            </h3>
            <p className="text-gray-600">
              Automated crawling identifies supplier capabilities and services.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow">
            <h3 className="font-semibold text-xl mb-4">
              Industry Classification
            </h3>
            <p className="text-gray-600">
              Structured categorisation for mining, manufacturing, energy and more.
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}