import{DISPLAY_RATE_CODES,positiveRate,parseProviderRates,providerObservationValid,RATE_CACHE_MS}from './rates-validation';
export interface LiveRates{base:string;rates:Record<string,number>;timestamp:number;source:'live_api'|'env_override'|'cache'|'default_safe'}
let cachedRates:LiveRates|null=null,cachedAt=0,inFlight:Promise<LiveRates>|null=null;
function fallback():Record<string,number>{
 const values={USD:1,INR:86.5,EUR:.92,GBP:.79,CAD:1.38,AUD:1.52,JPY:152};
 return Object.fromEntries(DISPLAY_RATE_CODES.map(c=>{const raw=process.env['USD_TO_'+c];const v=raw===undefined?NaN:Number(raw);return[c,c==='USD'?1:positiveRate(v)?v:values[c]]}));
}
function validCache(now:number){return cachedRates&&now>=cachedAt&&now-cachedAt<RATE_CACHE_MS&&(!['live_api','cache'].includes(cachedRates.source)||providerObservationValid(cachedRates.timestamp,now))}
function copy(r:LiveRates):LiveRates{return{...r,rates:{...r.rates}}}
async function fetchRates():Promise<LiveRates>{
 const now=Date.now();
 if(process.env.EXCHANGE_RATES_JSON){
  try{
   const parsed=JSON.parse(process.env.EXCHANGE_RATES_JSON);
   if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){
    const keys=Object.keys(parsed);if(keys.length&&keys.every(c=>(DISPLAY_RATE_CODES as readonly string[]).includes(c)&&positiveRate(parsed[c]))&&(parsed.USD===undefined||parsed.USD===1))return{base:'USD',rates:{...fallback(),...parsed},timestamp:now,source:'env_override'};
   }
  }catch{/* Invalid configuration is not a valid or live conversion table. */}
 }
 for(const url of['https://open.er-api.com/v6/latest/USD','https://api.exchangerate-api.com/v4/latest/USD']){
  try{
   const r=await fetch(url,{signal:AbortSignal.timeout(4000),redirect:'error',next:{revalidate:3600}});
   if(!r.ok)continue;const data=parseProviderRates(await r.json(),Date.now());
   if(data)return{base:'USD',...data,source:'live_api'};
  }catch{/* Try the existing alternate feed, then explicit reference fallback. */}
 }
 return{base:'USD',rates:fallback(),timestamp:Date.now(),source:'default_safe'};
}
export async function fetchLiveExchangeRates():Promise<LiveRates>{
 const now=Date.now();if(validCache(now))return copy({...cachedRates!,source:cachedRates!.source==='live_api'?'cache':cachedRates!.source});
 if(!inFlight)inFlight=fetchRates().then(r=>{cachedRates=r;cachedAt=Date.now();return r}).finally(()=>{inFlight=null});
 return copy(await inFlight);
}
export function getLiveRatesSync():LiveRates{
 if(validCache(Date.now()))return copy(cachedRates!);
 return{base:'USD',rates:fallback(),timestamp:Date.now(),source:'default_safe'};
}
