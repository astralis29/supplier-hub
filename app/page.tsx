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

  const signals = await getIndustrySignals();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100">

      {/* HERO SECTION */}
      <section
        className="relative min-h-[100vh] flex items-center justify-center text-center bg-cover bg-center"
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

            <button className="mt-6 bg-black text-white px-6 py-3 rounded-xl">
              Search Suppliers
            </button>

            <p className="text-xs text-gray-500 mt-4 tracking-wide">
              Official Business Register Integration · AI Capability Mapping · Structured Industry Taxonomy
            </p>
          </div>
        </div>
      </section>




{/* LIVE INDUSTRY SIGNALS */}
<section className="py-20 bg-gray-50 border-t border-gray-200">

  <div className="max-w-6xl mx-auto px-6">

    <div className="mb-12">
      <h2 className="text-3xl font-semibold text-gray-900 mb-3">
        Live Industry Signals
      </h2>

      <p className="text-gray-600 max-w-2xl">
        Real-time industrial intelligence sourced from global
        news signals and mapped to structured industry categories.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">

      {signals?.map((signal: any) => (

<div
  key={signal.title}
  className="bg-white border rounded-xl p-6 hover:shadow-md transition"
>

          <h3 className="font-semibold text-lg text-gray-900 mb-2">
            {signal.title}
          </h3>

          <p className="text-gray-600 text-sm mb-4">
            {signal.description?.slice(0,120)}...
          </p>

          <div className="flex items-center text-xs text-gray-500">

            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded mr-3">
              Industry
            </span>

            <span>
              {new Date(signal.published_at).toLocaleDateString()}
            </span>

          </div>

        </div>

      ))}

    </div>

  </div>

</section>


{/* FEATURE SECTION */}
<section className="py-24 bg-white border-t border-gray-200">
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

    <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">

      <div className="border-l-4 border-gray-900 pl-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 bg-gray-900 rounded-full"></span>
          <span className="text-xs uppercase tracking-widest text-gray-500">
            Live Industry Intelligence
          </span>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Real-Time Industrial Signals
        </h3>

        <p className="text-gray-600 leading-relaxed">
          Project announcements, regulatory changes and supply chain
          developments mapped to structured industry categories.
        </p>
      </div>

      <div className="border-l-4 border-gray-300 pl-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Verified Business Data
        </h3>

        <p className="text-gray-600 leading-relaxed">
          Direct integration with the National Business Register ensures
          entity accuracy, status validation and structured records.
        </p>
      </div>

      <div className="border-l-4 border-gray-300 pl-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          AI Capability Mapping
        </h3>

        <p className="text-gray-600 leading-relaxed">
          Automated domain intelligence extracts supplier capabilities,
          certifications and operational indicators at scale.
        </p>
      </div>

      <div className="border-l-4 border-gray-300 pl-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Industry Classification
        </h3>

        <p className="text-gray-600 leading-relaxed">
          Structured taxonomy across mining, manufacturing, engineering
          and industrial supply chains.
        </p>
      </div>

    </div>
  </div>
</section>


<footer className="py-12 bg-black text-gray-400 text-center text-sm">
  © {new Date().getFullYear()} What's the Supplier? · Enterprise Procurement Intelligence
</footer>

</main>
  );
}