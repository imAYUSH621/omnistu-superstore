/** Preparation only. Environment flags do not grant permission to activate.
 * Property Enhanced Measurement must be separately reviewed before use. */
export type TrafficConfig={measurementId:string};
export const TRAFFIC_CONSENT_KEY='omnistu_traffic_consent_v1';
export type TrafficConsent='granted'|'denied'|'unknown';
export function trafficConsent(value:unknown):TrafficConsent{return value==='granted'||value==='denied'?value:'unknown'}
export function trafficConfig(env:Record<string,string|undefined>):TrafficConfig|null{
 if(env.TRAFFIC_ANALYTICS_ENABLED!=='true'||env.TRAFFIC_ANALYTICS_PROPERTY_REVIEWED!=='true'||!/^G-[A-Z0-9]{5,20}$/.test(env.TRAFFIC_ANALYTICS_ID??''))return null;
 return{measurementId:env.TRAFFIC_ANALYTICS_ID!};
}
export function publicTrafficView(pathname:string){
 // Fixed public route families only. Never use a raw URL, title, query,
 // fragment, search text, customer/order/service ID or arbitrary path value.
 const routes:Record<string,{area:'store'|'services';page:string;title:string}>={
  '/':{area:'store',page:'/',title:'Store home'},'/search':{area:'store',page:'/search',title:'Store search'},'/services':{area:'services',page:'/services',title:'Services'},
 };
 if(!Object.prototype.hasOwnProperty.call(routes,pathname))return null;const r=routes[pathname];
 return{business_area:r.area,page_location:'https://omnistu.com'+r.page,page_title:r.title,page_referrer:''};
}
export type TrafficHost={dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;[key:string]:unknown};
export function stopTraffic(host:TrafficHost,config:TrafficConfig){host['ga-disable-'+config.measurementId]=true}
export function startTraffic(host:TrafficHost,config:TrafficConfig,consent:TrafficConsent,pathname:string){
 const view=publicTrafficView(pathname);if(consent!=='granted'||!view){stopTraffic(host,config);return false}
 host['ga-disable-'+config.measurementId]=false;
 host.dataLayer=host.dataLayer??[];
 host.gtag=host.gtag??function(){host.dataLayer!.push(arguments)};
 if(host['omnistu-traffic-initialized']!==config.measurementId){
  host.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  host.gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  host.gtag('js',new Date());
  host.gtag('config',config.measurementId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,...view});
  host['omnistu-traffic-initialized']=config.measurementId;
 }
 return true;
}
export function recordTrafficView(host:TrafficHost,config:TrafficConfig,consent:TrafficConsent,pathname:string){
 const view=publicTrafficView(pathname);if(consent!=='granted'||!view||host['ga-disable-'+config.measurementId]!==false||!host.gtag)return false;
 host.gtag('event','page_view',{send_to:config.measurementId,...view});return true;
}
export function readTrafficConsent(storage:Pick<Storage,'getItem'>):TrafficConsent{try{return trafficConsent(storage.getItem(TRAFFIC_CONSENT_KEY))}catch{return'unknown'}}
export function saveTrafficConsent(storage:Pick<Storage,'setItem'>,value:'granted'|'denied'){try{storage.setItem(TRAFFIC_CONSENT_KEY,value);return true}catch{return false}}
