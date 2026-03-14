import axios from "axios"
import * as cheerio from "cheerio"
import pLimit from "p-limit"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const limit = pLimit(20) // concurrency limit

async function getBusinesses() {

  const res = await pool.query(`
    SELECT abn,name
    FROM abr_businesses
    WHERE abn_status='Active'
    LIMIT 100
  `)

  return res.rows
}

async function findWebsite(name:string){

  try{

    const query = encodeURIComponent(name + " australia")

    const res = await axios.get(
      `https://duckduckgo.com/html/?q=${query}`
    )

    const $ = cheerio.load(res.data)

    const link = $("a.result__a").first().attr("href")

    return link

  }catch(e){
    return null
  }

}

async function crawlSite(url:string){

  try{

    const res = await axios.get(url,{timeout:5000})

    const $ = cheerio.load(res.data)

    const text = $("body").text().toLowerCase()

    const keywords = []

    const terms = [
      "steel",
      "fabrication",
      "welding",
      "mining",
      "machining",
      "engineering",
      "laser cutting",
      "metal",
      "manufacturing"
    ]

    for(const term of terms){

      if(text.includes(term)){
        keywords.push(term)
      }

    }

    return keywords

  }catch(e){
    return []
  }

}

async function saveCapabilities(abn:string,keywords:string[]){

  for(const k of keywords){

    await pool.query(`
      INSERT INTO supplier_capabilities (abn,keyword)
      VALUES ($1,$2)
      ON CONFLICT DO NOTHING
    `,[abn,k])

  }

}

async function processBusiness(b:any){

  const website = await findWebsite(b.name)

  if(!website) return

  const keywords = await crawlSite(website)

  if(keywords.length===0) return

  await saveCapabilities(b.abn,keywords)

  console.log("Indexed:",b.name)

}

async function runCrawler(){

  const businesses = await getBusinesses()

  await Promise.all(

    businesses.map(b=>limit(()=>processBusiness(b)))

  )

  console.log("Crawl finished")

}

runCrawler()