export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";

import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: (...args) => fetch(...args)
    }
  }
);

/* ------------------------------------------------ */
/* TEXT NORMALIZATION                               */
/* ------------------------------------------------ */

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsKeyword(text: string, keyword: string) {
  return text.includes(keyword.toLowerCase());
}

/* ------------------------------------------------ */
/* NEWS NOISE FILTER                                */
/* ------------------------------------------------ */

const newsNoise = [
"sport","football","rugby","cricket","nba","nfl","afl",
"election","politics","senate","parliament",
"murder","arson","crime","court","trial","police",
"celebrity","movie","tv","entertainment"
];

function isNewsNoise(text:string){
return newsNoise.some(word => text.includes(word));
}

/* ------------------------------------------------ */
/* PROCUREMENT SIGNAL FILTER (NEW)                  */
/* ------------------------------------------------ */

const procurementSignals = [
"factory",
"plant",
"manufacturing",
"mine",
"mining",
"port",
"shipping",
"logistics",
"supply chain",
"production",
"industrial",
"commodity",
"export",
"import",
"freight",
"cargo",
"refinery",
"pipeline",
"energy",
"semiconductor",
"battery"
];

function hasProcurementSignal(text:string){
return procurementSignals.some(word => text.includes(word));
}

/* ------------------------------------------------ */
/* INDUSTRIAL CONTEXT FILTER                        */
/* ------------------------------------------------ */

const industrialContext = [
"mine","mining","lithium","copper","iron ore","nickel",
"factory","manufacturing","plant","industrial",
"port","shipping","freight","cargo","logistics",
"pipeline","oil","gas","lng","energy","refinery",
"rail","infrastructure","construction",
"semiconductor","chip","battery","ev",
"grain","agriculture","fertilizer"
];

function isIndustrialContext(text:string){

let matches = 0;

industrialContext.forEach(term=>{
if(text.includes(term)) matches++;
});

return matches >= 2;

}

/* ------------------------------------------------ */
/* GLOBAL SUPPLY CHAIN CHOKEPOINTS                  */
/* ------------------------------------------------ */

const supplyChainChokepoints: Record<string,string[]> = {

RED_SEA:["red sea","suez canal","bab el mandeb"],

PANAMA_CANAL:["panama canal"],

STRAIT_OF_HORMUZ:["strait of hormuz","hormuz"],

SOUTH_CHINA_SEA:["south china sea"],

TAIWAN_SEMICONDUCTOR:["taiwan","tsmc","semiconductor foundry"],

CHILE_LITHIUM:["chile lithium","atacama lithium"],

ARGENTINA_LITHIUM:["argentina lithium"]

};

function detectChokepoint(text:string){

for(const [location,words] of Object.entries(supplyChainChokepoints)){

for(const word of words){

if(text.includes(word)){
return location;
}

}

}

return null;

}

function applyChokepointBoost(score:number,chokepoint:string|null){

if(!chokepoint) return score;

score += 20;

if(score > 100) score = 100;

return score;

}

/* ------------------------------------------------ */
/* EVENT TYPE CLASSIFICATION                        */
/* ------------------------------------------------ */

const eventTypes: Record<string, string[]> = {

PORT_STRIKE:["port strike","dockworkers strike","dock strike"],

SHIPPING_DISRUPTION:[
"shipping disruption",
"freight disruption",
"port congestion",
"canal blockage"
],

MINE_SHUTDOWN:[
"mine shutdown",
"mine closure",
"mining halt"
],

REFINERY_OUTAGE:[
"refinery outage",
"refinery shutdown"
],

FACTORY_FIRE:[
"factory fire",
"plant fire",
"industrial fire"
],

SUPPLY_SHORTAGE:[
"shortage",
"supply shortage",
"supply disruption"
],

NATURAL_DISASTER:[
"earthquake",
"cyclone",
"typhoon",
"flood",
"wildfire"
],

GEOPOLITICAL_CONFLICT:[
"war",
"invasion",
"sanctions",
"trade war",
"blockade"
]

};

function detectEventType(text: string) {

for (const [event, keywords] of Object.entries(eventTypes)) {

for (const word of keywords) {

if (text.includes(word)) {
return event;
}

}

}

return null;

}

/* ------------------------------------------------ */
/* COUNTRY DETECTION                                */
/* ------------------------------------------------ */

const countryKeywords: Record<string, string[]> = {

USA:["united states","america","texas","california"],
CHINA:["china","beijing","shanghai"],
INDIA:["india","mumbai","delhi"],
JAPAN:["japan","tokyo"],
AUSTRALIA:["australia","sydney","melbourne","perth"],
UK:["united kingdom","britain","london"],
GERMANY:["germany","berlin"],
FRANCE:["france","paris"],
RUSSIA:["russia","moscow"],
BRAZIL:["brazil","rio"],
CANADA:["canada","toronto"]

};

function detectCountry(text:string){

for(const [country,words] of Object.entries(countryKeywords)){

for(const word of words){
if(text.includes(word)) return country;
}

}

return null;

}

/* ------------------------------------------------ */
/* RISK KEYWORDS                                    */
/* ------------------------------------------------ */

const riskKeywords: Record<string, number> = {

strike:70, walkout:70, "port strike":80, "rail strike":80,
shutdown:70, closure:70, collapse:80,
bankruptcy:80, insolvency:80,

explosion:70, bushfire:60, accident:60, derailment:70,
"factory fire":70, "plant fire":70, "mine collapse":80,

outage:60, blackout:60, "power outage":60,

congestion:40, delay:40, disruption:50, shortage:50,

sanctions:60, war:80, invasion:80, blockade:70,

cyclone:60, hurricane:60, "tropical storm":50,
flood:50, wildfire:60, earthquake:70

};

/* ------------------------------------------------ */
/* PATTERN RISK DETECTION                           */
/* ------------------------------------------------ */

const disruptionPatterns = [

{pattern:/production (halt|halted|cut)/i,score:60},
{pattern:/operations (halt|halted|suspended)/i,score:60},
{pattern:/plant shutdown/i,score:70},
{pattern:/mine shutdown/i,score:70},

{pattern:/port congestion/i,score:50},
{pattern:/shipping disruption/i,score:60},
{pattern:/freight disruption/i,score:60},

{pattern:/supply (shortage|crunch|squeeze)/i,score:50},

{pattern:/trade ban/i,score:70},
{pattern:/economic sanctions/i,score:70}

];

function detectPatternRisk(text:string){

let score = 0;

disruptionPatterns.forEach(({pattern,score:value})=>{
if(pattern.test(text)) score += value;
});

if(score > 80) score = 80;

return score;

}

/* ------------------------------------------------ */
/* RISK SCORE                                       */
/* ------------------------------------------------ */

function calculateRiskScore(text:string){

let score = 0;
let matches = 0;

Object.entries(riskKeywords).forEach(([word,value])=>{

if(containsKeyword(text,word)){
score += value;
matches++;
}

});

if(matches >= 2) score *= 1.2;
if(matches >= 3) score *= 1.4;

const patternScore = detectPatternRisk(text);

score = Math.max(score,patternScore);

if(score > 100) score = 100;

return Math.round(score);

}

/* ------------------------------------------------ */
/* SUPPLY CHAIN SCORE                               */
/* ------------------------------------------------ */

const supplyChainKeywords: Record<string, number> = {

oil:25, gas:25, lng:25,
mining:25, mine:25,
factory:20, manufacturing:20,
port:20, shipping:20, freight:20,
semiconductor:25, chip:25,
battery:20, ev:20,
logistics:20, cargo:20,
construction:20, infrastructure:20,
agriculture:20, grain:20,
chemical:20, fertilizer:20

};

function calculateSupplyChainScore(text:string){

let score = 0;

Object.entries(supplyChainKeywords).forEach(([word,value])=>{
if(containsKeyword(text,word)) score += value;
});

if(score > 100) score = 100;

return score;

}

/* ------------------------------------------------ */
/* INDUSTRY DETECTION                               */
/* ------------------------------------------------ */

function detectIndustry(
text:string,
keywords:{industry_id:number;keyword:string}[]
){

const keywordMatch = keywords.find(k =>
text.includes(k.keyword.toLowerCase())
);

if(keywordMatch) return keywordMatch.industry_id;

return null;

}

/* ------------------------------------------------ */
/* CLEAN HTML                                       */
/* ------------------------------------------------ */

function cleanHtml(html:string|undefined){
if(!html) return "";
return html.replace(/<[^>]*>?/gm,"").replace(/\s+/g," ").trim();
}

/* ------------------------------------------------ */
/* FETCH RSS                                        */
/* ------------------------------------------------ */

async function fetchRSS(url:string){

const controller = new AbortController();
const timeout = setTimeout(()=>controller.abort(),5000);

try{

const res = await fetch(url,{
signal:controller.signal,
headers:{
"User-Agent":"Mozilla/5.0",
Accept:"application/rss+xml, application/xml, text/xml"
},
redirect:"follow",
cache:"no-store"
});

if(!res.ok) throw new Error(`RSS request failed: ${res.status}`);

return await res.text();

} finally{
clearTimeout(timeout);
}

}

/* ------------------------------------------------ */
/* MAIN RSS INGESTION                               */
/* ------------------------------------------------ */

export async function GET(){

try{

const {data:sources} = await supabase
.from("rss_sources")
.select("*")
.eq("active",true);

const {data:keywords} = await supabase
.from("industry_keywords")
.select("industry_id, keyword");

const results = await Promise.all(

(sources || []).map(async(source)=>{

try{

const xml = await fetchRSS(source.url);
const feed = await parser.parseString(xml);

const articles:any[] = [];

for(const item of feed.items){

const title = cleanHtml(item.title);
const description = cleanHtml(item.contentSnippet || item.content);

const titleText = normalizeText(title);
const bodyText = normalizeText(description);
const combined = `${titleText} ${bodyText}`;

const guid = item.guid || item.link;
if(!guid || !item.pubDate) continue;

if(isNewsNoise(combined)) continue;

/* PROCUREMENT RELEVANCE FILTER */

if(!hasProcurementSignal(combined)) continue;

if(!isIndustrialContext(titleText) && !isIndustrialContext(bodyText)) continue;

const articleDate = new Date(item.pubDate || Date.now());

let riskScore = calculateRiskScore(combined);

const chokepoint = detectChokepoint(combined);
riskScore = applyChokepointBoost(riskScore,chokepoint);

const supplyScore = calculateSupplyChainScore(combined);
const industryId = detectIndustry(combined, keywords ?? []);
const eventType = detectEventType(combined);
const country = detectCountry(combined);

/* FINAL RELEVANCE FILTER */

if(riskScore < 40 && supplyScore < 20 && !eventType && !chokepoint) continue;

articles.push({
industry_id: industryId ?? null,
rss_source_id: source.id,
title,
description,
url: item.link || "",
guid,
risk_score: riskScore,
supply_chain_score: supplyScore,
event_type: eventType,
country,
chokepoint,
published_at: articleDate
});

}

if(articles.length > 0){

const {error} = await supabase
.from("industry_news")
.upsert(articles,{onConflict:"guid"});

if(error){
console.error("SUPABASE INSERT ERROR:",error);
}

return {processed:true, inserted:articles.length};

}

return {processed:true, inserted:0};

}catch{

console.log("Feed failed:",source.url);
return {processed:false, inserted:0};

}

})
);

const processedFeeds = results.filter(r=>r.processed).length;
const articlesInserted = results.reduce((sum,r)=>sum+r.inserted,0);

return Response.json({
success:true,
feedsProcessed:processedFeeds,
articlesInserted
});

}catch(error:any){

return Response.json(
{error:error.message,stack:error.stack},
{status:500}
);

}

}