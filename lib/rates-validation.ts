/** Currency conversion display only. Never settlement or a payment quote. */
export const DISPLAY_RATE_CODES=['USD','INR','EUR','GBP','CAD','AUD','JPY']as const;
export const RATE_CACHE_MS=3600000;
export const MAX_PROVIDER_AGE_MS=36*3600000;
export function positiveRate(v:unknown):v is number{return typeof v==='number'&&Number.isFinite(v)&&v>0}
export function completeUsdRates(value:unknown):Record<string,number>|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const x=value as Record<string,unknown>;if(x.USD!==1||!DISPLAY_RATE_CODES.every(c=>positiveRate(x[c])))return null;
 return Object.fromEntries(DISPLAY_RATE_CODES.map(c=>[c,x[c]as number]));
}
export function providerObservationValid(timestamp:unknown,now=Date.now()):timestamp is number{
 return typeof timestamp==='number'&&Number.isFinite(timestamp)&&timestamp>0&&timestamp<=now+300000&&now-timestamp<=MAX_PROVIDER_AGE_MS;
}
export function parseProviderRates(value:unknown,now=Date.now()):{rates:Record<string,number>;timestamp:number}|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const d=value as Record<string,unknown>;
 if((d.base_code??d.base)!=='USD'||(d.result!==undefined&&d.result!=='success'))return null;
 const rates=completeUsdRates(d.rates),seconds=d.time_last_update_unix??d.time_last_updated;
 if(!rates||typeof seconds!=='number'||!providerObservationValid(seconds*1000,now))return null;
 return{rates,timestamp:seconds*1000};
}
