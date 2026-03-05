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

"freight","logistics","shipping","cargo","container","port","harbour","dock","terminal","supply chain",
"trade","transport","rail","railway","rail freight","trucking","truck","haulage","air cargo","air freight",
"shipping lane","canal","tanker","bulk carrier","cargo ship","container ship","freight route","transport corridor",

"mining","mine","mineral","minerals","lithium","copper","iron ore","nickel","cobalt","bauxite","aluminium",
"steel","coal","metallurgical coal","gold","silver","platinum","palladium","rare earth","rare earths",
"graphite","zinc","lead","manganese","uranium","smelter","refinery","ore","metal","metals","commodity",

"energy","oil","gas","lng","crude","petroleum","refining","pipeline","offshore drilling","drilling",
"upstream","downstream","opec","power","electricity","power plant","grid","utility","renewable","solar",
"wind","windfarm","hydrogen","nuclear","reactor","biofuel","energy storage",

"manufacturing","factory","industrial","production","plant","assembly","machinery","equipment",
"fabrication","engineering","tooling","automation","robotics","machining",

"construction","infrastructure","contractor","megaproject","bridge","tunnel","dam","highway",
"railway project","port project","airport construction",

"semiconductor","chip","microchip","processor","gpu","cpu","foundry","fab","silicon","wafer",
"electronics","hardware","datacenter","server",

"battery","batteries","gigafactory","lithium battery","ev battery","electric vehicle","charging station",

"automotive","vehicle","carmaker","automaker","electric car","vehicle manufacturing",

"aerospace","aircraft","aviation","airline","airport","satellite","rocket","spacecraft",

"agriculture","farming","crop","grain","wheat","corn","soybean","fertiliser","fertilizer",
"food production","livestock","dairy",

"chemical","chemicals","petrochemical","ammonia","plastics","polymer","resin","materials",

"telecom","telecommunications","network","broadband","fiber","5g","data infrastructure",

"pharmaceutical","pharma","biotech","vaccine","drug","medicine","laboratory",

"strike","walkout","shutdown","closure","halt","suspension","bankruptcy","collapse",
"industrial action","labour dispute","plant shutdown","factory shutdown","mine shutdown",
"refinery outage","smelter shutdown",

"congestion","delay","bottleneck","shortage","shipping disruption","freight disruption",
"port congestion","canal blockage","transport disruption",

"flood","storm","cyclone","hurricane","typhoon","wildfire","bushfire","earthquake",
"drought","landslide","extreme weather",

"war","conflict","invasion","sanctions","embargo","tariff","trade war","blockade"
];

  /* Detect industry relevance */

  const industrySignals = signals.filter((s:any) => {

    const text = `${s.title ?? ""} ${s.description ?? ""}`.toLowerCase();

    return industryTerms.some(term => text.includes(term));

  });

  const usableSignals = industrySignals.length > 0 ? industrySignals : signals;

  /* Risk Buckets */

  const highRisk = usableSignals
    .filter((s:any) => s.risk_score >= 80)
    .sort((a:any,b:any)=>b.risk_score-a.risk_score);

  const mediumRisk = usableSignals
    .filter((s:any) => s.risk_score >= 50 && s.risk_score < 80)
    .sort((a:any,b:any)=>b.risk_score-a.risk_score);

  const lowRisk = usableSignals
    .filter((s:any) => s.risk_score >= 20 && s.risk_score < 50)
    .sort((a:any,b:any)=>b.risk_score-a.risk_score);

  /* GLOBAL RISK INDEX */

  const relevantSignals = usableSignals.filter((s:any) => s.risk_score >= 20);

  const avgRisk =
    relevantSignals.length > 0
      ? Math.round(
          relevantSignals.reduce(
            (acc:any, s:any) => acc + (s.risk_score || 0),
            0
          ) / relevantSignals.length
        )
      : 0;

  return (

<main className="min-h-screen bg-gradient-to-b from-white to-gray-100">

{/* HERO */}

<section
className="relative min-h-[90vh] flex items-center justify-center text-center bg-cover bg-center"
style={{ backgroundImage: "url('/forest-bg.jpg')" }}
>

<div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-black/80"></div>

<div className="relative z-10 w-full max-w-5xl px-6">

<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
Discover Verified Industrial Suppliers
</h1>

<p className="text-lg text-gray-300 mb-12">
AI-powered supplier discovery with real-time supply chain intelligence.
</p>

</div>
</section>


{/* LIVE ALERT BAR */}

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


{/* GLOBAL INDEX */}

<section className="py-8 bg-white border-b">

<div className="max-w-6xl mx-auto px-6 flex justify-between">

<div>

<h2 className="text-sm uppercase text-gray-500">

Global Supply Chain Risk Index

</h2>

<div className="text-4xl font-bold">

{avgRisk} / 100

</div>

</div>

<div>

{avgRisk >= 60 && <span className="text-red-600 font-semibold">Elevated Risk</span>}
{avgRisk >= 30 && avgRisk < 60 && <span className="text-orange-500 font-semibold">Moderate Risk</span>}
{avgRisk < 30 && <span className="text-green-600 font-semibold">Normal Conditions</span>}

</div>

</div>

</section>


{/* DASHBOARD */}

<section className="py-12 bg-gray-50">

<div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-6">

{/* HIGH */}

<div>

<h3 className="text-red-600 font-semibold mb-4">

High Risk

</h3>

{highRisk.slice(0,3).map((signal:any)=>(

<div key={signal.title} className="border-l-4 border-red-600 bg-white p-4 mb-3">

<div className="text-xs text-red-600 font-semibold">

HIGH RISK · Score {signal.risk_score}

</div>

<div className="font-semibold text-sm mt-1">

{signal.title}

</div>

</div>

))}

</div>


{/* MEDIUM */}

<div>

<h3 className="text-orange-500 font-semibold mb-4">

Medium Risk

</h3>

{mediumRisk.slice(0,3).map((signal:any)=>(

<div key={signal.title} className="border-l-4 border-orange-500 bg-white p-4 mb-3">

<div className="text-xs text-orange-500 font-semibold">

MEDIUM RISK · Score {signal.risk_score}

</div>

<div className="font-semibold text-sm mt-1">

{signal.title}

</div>

</div>

))}

</div>


{/* SIGNALS */}

<div>

<h3 className="text-gray-600 font-semibold mb-4">

Industry Signals

</h3>

{usableSignals.slice(0,3).map((signal:any)=>(

<div key={signal.title} className="border-l-4 border-gray-300 bg-white p-4 mb-3">

<div className="text-xs text-gray-500">

INDUSTRY SIGNAL

</div>

<div className="font-semibold text-sm mt-1">

{signal.title}

</div>

</div>

))}

</div>

</div>

</section>


<footer className="py-12 bg-black text-gray-400 text-center text-sm">

© {new Date().getFullYear()} What's the Supplier?

</footer>

</main>

  );

}