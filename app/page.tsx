{/* FEATURE CARDS */}
<section className="py-24 bg-gray-50">
  <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8">

    {/* INDUSTRY NEWS */}
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition relative overflow-hidden">

      <div className="absolute left-0 top-0 h-full w-1 bg-red-500"></div>

      <div className="flex items-center gap-2 mb-4 ml-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
        </span>

        <span className="text-xs font-semibold tracking-widest text-red-600 uppercase">
          Live Industry Feed
        </span>
      </div>

      <h3 className="font-semibold text-xl mb-3 ml-2">
        Industry News Intelligence
      </h3>

      <p className="text-gray-600 leading-relaxed ml-2">
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
        Connected directly to the Business Register for accurate records.
      </p>
    </div>

    {/* AI */}
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <h3 className="font-semibold text-lg mb-3">
        AI Capability Mapping
      </h3>
      <p className="text-gray-600 leading-relaxed">
        Automated domain intelligence identifies supplier services and strengths.
      </p>
    </div>

    {/* CLASSIFICATION */}
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <h3 className="font-semibold text-lg mb-3">
        Industry Classification
      </h3>
      <p className="text-gray-600 leading-relaxed">
        Structured categorisation across key industrial supply chains.
      </p>
    </div>

  </div>
</section>