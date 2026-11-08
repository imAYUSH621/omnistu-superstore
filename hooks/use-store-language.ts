'use client';
import {useEffect,useState} from 'react';
import {supportLanguage,type SupportLanguage} from '@/lib/support-language';
/** Read the existing store preference; no new cookie, account or translation service. */
export function useStoreLanguage():SupportLanguage {
 const [language,setLanguage]=useState<SupportLanguage>('EN');
 useEffect(()=>{
  const apply=(value?:string|null)=>setLanguage(supportLanguage('',value));
  const raw=document.cookie.match(/(?:^|;\s*)omnistu_lang=([^;]*)/)?.[1];
  try{apply(raw?decodeURIComponent(raw):localStorage.getItem('omnistu_lang'))}catch{apply(null)}
  const onChange=(e:Event)=>apply((e as CustomEvent<{lang?:string}>).detail?.lang);
  window.addEventListener('omnistu:lang-change',onChange);return()=>window.removeEventListener('omnistu:lang-change',onChange);
 },[]);
 return language;
}
