import Parser from "rss-parser"

export async function GET() {

  const parser = new Parser()

  const feeds = [
"https://www.supplychaindive.com/feeds/news/",
"https://www.logisticsmgmt.com/rss/all",
"https://www.dcvelocity.com/rss",
"https://www.supplychainbrain.com/rss/articles",
"https://www.supplychain247.com/rss",
"https://www.inboundlogistics.com/rss",
"https://www.sdcexec.com/rss",
"https://www.logisticsviewpoints.com/feed/",
"https://www.cscmp.org/rss",
"https://www.materialhandling247.com/rss",

"https://www.joc.com/rss.xml",
"https://www.maritime-executive.com/rss.xml",
"https://gcaptain.com/feed/",
"https://www.seatrade-maritime.com/rss.xml",
"https://www.hellenicshippingnews.com/feed/",
"https://splash247.com/feed/",
"https://www.porttechnology.org/feed/",
"https://container-news.com/feed/",
"https://lloydslist.maritimeintelligence.informa.com/rss",
"https://shipandbunker.com/rss",

"https://www.freightwaves.com/rss",
"https://www.freightwaves.com/news/feed",
"https://www.ttnews.com/rss",
"https://www.overdriveonline.com/rss",
"https://www.truckinginfo.com/rss",
"https://www.ccjdigital.com/rss",
"https://www.bulktransporter.com/rss",
"https://www.trucknews.com/feed/",

"https://www.industryweek.com/rss",
"https://www.manufacturing.net/rss",
"https://www.assemblymag.com/rss",
"https://www.plantengineering.com/rss",
"https://www.processingmagazine.com/rss",
"https://www.controleng.com/rss",
"https://www.automationworld.com/rss",
"https://www.powermotiontech.com/rss",
"https://www.industrytoday.com/feed/",
"https://www.machinedesign.com/rss",

"https://www.reuters.com/business/rss",
"https://www.reuters.com/markets/rss",
"https://www.ft.com/global-economy?format=rss",
"https://www.ft.com/companies?format=rss",
"https://www.worldbank.org/en/news/rss",
"https://www.wto.org/english/news_e/news_e.xml",
"https://unctad.org/rss.xml",
"https://www.imf.org/en/News/rss",
"https://www.oecd.org/newsroom/rss.xml",

"https://reliefweb.int/rss.xml",
"https://www.usgs.gov/feeds/earthquakes.rss",
"https://www.weather.gov/rss_page.php?site_name=nws",
"https://www.cisa.gov/cybersecurity-advisories/all.xml",
"https://www.globaltradealert.org/rss",
"https://www.railwaygazette.com/rss",

"https://www.fullyloaded.com.au/feed/",
"https://www.fullyloaded.com.au/logistics/feed/",
"https://www.fullyloaded.com.au/transport/feed/",
"https://www.fullyloaded.com.au/trucking/feed/",
"https://www.thedcn.com.au/feed/",
"https://www.thedcn.com.au/category/logistics/feed/",
"https://www.thedcn.com.au/category/ports/feed/",
"https://www.thedcn.com.au/category/shipping/feed/",
"https://www.thedcn.com.au/category/supply-chain/feed/",
"https://www.miragenews.com/category/business/transport/feed/",

"https://www.manmonthly.com.au/feed/",
"https://www.manmonthly.com.au/category/news/feed/",
"https://www.manmonthly.com.au/category/manufacturing/feed/",
"https://www.aumanufacturing.com.au/feed",
"https://www.australianmanufacturing.com.au/feed/",
"https://www.industry.gov.au/news/rss.xml",
"https://www.industry.gov.au/publications/rss.xml",
"https://www.aigroup.com.au/feed/",

"https://www.farmonline.com.au/rss/",
"https://www.beefcentral.com/feed/",
"https://www.graincentral.com/feed/",
"https://www.dairynews.com.au/feed/",
"https://www.foodprocessing.com.au/rss",
"https://www.foodmag.com.au/feed/",
"https://www.agrifutures.com.au/feed/",

"https://www.infrastructuremagazine.com.au/feed/",
"https://www.architectureanddesign.com.au/rss",
"https://www.insideconstruction.com.au/feed/",

"https://www.afr.com/rss",
"https://www.afr.com/companies/rss",
"https://www.afr.com/politics/rss",
"https://www.businessnews.com.au/rss.xml",
"https://www.smartcompany.com.au/feed/",
"https://www.startupdaily.net/feed/",
"https://www.miragenews.com/category/business/feed/",
"https://www.miragenews.com/category/economy/feed/",

"https://www.abc.net.au/news/feed/51120/rss.xml",
"https://www.sbs.com.au/news/feed",
"https://www.9news.com.au/rss",
"https://www.bom.gov.au/rss/warnings.xml",
"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.atom",
"https://www.emergency.vic.gov.au/rss.xml"
  ]

  /* INDUSTRY FILTER TERMS */

  const industryTerms = [
    "freight","logistics","shipping","cargo","container","port",
    "supply chain","transport","rail","trucking","air freight","derail","cyclone","bushfire",

    "mining","mine","lithium","copper","iron ore","nickel",
    "rare earth","steel","coal","metals","commodity","blockade","price surge","strait",

    "oil","gas","lng","energy","pipeline","refinery",
    "power","electricity","grid","renewable","solar","wind",

    "manufacturing","factory","plant","production","semiconductor"
  ]

  let items: any[] = []

  for (const feedUrl of feeds) {

    try {

      const feed = await parser.parseURL(feedUrl)

      const filtered = feed.items
        .slice(0,5)

        /* FILTER FIRST */

        .filter(item => {

          const text = `${item.title ?? ""} ${item.contentSnippet ?? ""} ${item.content ?? ""}`.toLowerCase()

          const coreTerms = [
"supply chain",
"shipping",
"freight",
"logistics",
"port",
"container",
"cargo",
"rail",
"trucking",
"strait",
"freight",
"Shipping",
"Cargo",
"Haulage",
"Transit",
"Carrier",
"Fleet",
"Intermodal",
"Linehaul",
"Freight forwarding",
"Shipping lanes",
"Disruption",
"Shortage",
"Bottleneck",
"Delays",
"Strike",
"Sanctions",
"Tariffs",
]

const hasIndustry = industryTerms.some(term => text.includes(term))
const hasCore = coreTerms.some(term => text.includes(term))

return hasIndustry && hasCore

        })

        /* THEN MAP */

        .map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate
        }))

      items.push(...filtered)

    } catch (err) {

      console.error("RSS error:", feedUrl)

    }

  }

  /* REMOVE DUPLICATES */

  items = items.filter(
    (v, i, a) => a.findIndex(t => t.title === v.title) === i
  )

  /* SORT */

  items = items
    .sort((a, b) =>
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )
    .slice(0, 6)

  return Response.json(items)

}