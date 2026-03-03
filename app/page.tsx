{/* FEATURE SECTION */}
<section className="py-24 bg-gray-50">
  <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">

    {/* INDUSTRY NEWS - spans 2 columns */}
    <div className="md:col-span-2 bg-white p-10 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition relative overflow-hidden">

      {/* Accent line */}
      <div className="absolute left-0 top-0 h-full w-1 bg-red-600"></div>

      {/* Badge */}
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