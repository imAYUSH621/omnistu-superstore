'use client';
import Script from 'next/script';
import {useEffect,useLayoutEffect,useRef,useState}from 'react';
import {usePathname}from 'next/navigation';
import {useStoreLanguage}from '@/hooks/use-store-language';
import {TRAFFIC_COPY}from '@/lib/traffic-analytics-language';
import{publicTrafficView,readTrafficConsent,saveTrafficConsent,startTraffic,stopTraffic,recordTrafficView,type TrafficConfig,type TrafficConsent,type TrafficHost}from '@/lib/traffic-analytics';
/** No provider script, queue, cookie or consent UI exists while config is null.
 * This component is not proof that the real property/consent policy is ready. */
export default function TrafficAnalytics({config}:{config:TrafficConfig|null}){
 const language=useStoreLanguage();const copy=TRAFFIC_COPY[language];
 const pathname=usePathname();const[consent,setConsent]=useState<TrafficConsent>('unknown');const[ready,setReady]=useState(false);const[editing,setEditing]=useState(false);const[storageFailed,setStorageFailed]=useState(false);const last=useRef('');
 const allowed=!!config&&!!publicTrafficView(pathname??'');
 useEffect(()=>{if(!config)return;const update=()=>{let c:TrafficConsent='unknown';try{c=readTrafficConsent(window.localStorage)}catch{}setConsent(c)};update();window.addEventListener('storage',update);return()=>{stopTraffic(window as unknown as TrafficHost,config);window.removeEventListener('storage',update)}},[config]);
 useLayoutEffect(()=>{if(!config)return;const host=window as unknown as TrafficHost;if(!startTraffic(host,config,consent,pathname??'')){last.current='';return}if(ready&&last.current!==pathname){recordTrafficView(host,config,consent,pathname??'');last.current=pathname??''}},[config,consent,pathname,ready]);
 function choose(value:'granted'|'denied'){
  if(!config)return;const host=window as unknown as TrafficHost;
  // The documented opt-out flag is set before any other action on withdrawal.
  if(value==='denied')stopTraffic(host,config);
  let saved=false;try{saved=saveTrafficConsent(window.localStorage,value)}catch{}
  if(!saved)stopTraffic(host,config);setStorageFailed(!saved);setConsent(saved?value:'denied');setEditing(false);
  if(value==='denied'&&host['omnistu-traffic-initialized'])window.location.reload();
 }
 if(!config)return null;
 return <>
  {allowed&&consent==='granted'?<Script id='omnistu-traffic-tag' src={'https://www.googletagmanager.com/gtag/js?id='+config.measurementId} strategy='afterInteractive' referrerPolicy='no-referrer' onReady={()=>setReady(true)}/>:null}
  {allowed?<aside aria-label={copy.label} className='m-4 rounded border bg-background p-3 text-sm text-foreground shadow-md'>
   {consent==='unknown'||editing?<><p>{copy.body}</p><div className='mt-2 flex flex-wrap gap-3'><button className='rounded border px-3 py-2' onClick={()=>choose('granted')}>{copy.allow}</button><button className='rounded border px-3 py-2' onClick={()=>choose('denied')}>{copy.deny}</button></div></>:<button className='underline' onClick={()=>setEditing(true)}>{copy.settings}</button>}
   {storageFailed?<p role='alert'>{copy.failed}</p>:null}
  </aside>:null}
 </>;
}
