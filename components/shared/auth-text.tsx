'use client';
import {useEffect} from 'react';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {AUTH_COPY,type AuthCopyKey} from '@/lib/auth-language';
export default function AuthText({name,pageTitle=false}:{name:AuthCopyKey;pageTitle?:boolean}){
 const language=useStoreLanguage(),text=AUTH_COPY[language][name];
 useEffect(()=>{if(pageTitle){document.documentElement.lang=language.toLowerCase();}},[language,text,pageTitle]);
 return <span lang={language.toLowerCase()}>{text}</span>;
}
