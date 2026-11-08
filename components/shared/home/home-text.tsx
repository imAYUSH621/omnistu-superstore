'use client';
import{useStoreLanguage}from '@/hooks/use-store-language';import{HOME_COPY,homeDepartment,type HomeKey}from '@/lib/home-language';
export default function HomeText({name,department,count}:{name?:HomeKey;department?:string;count?:number}){const lang=useStoreLanguage(),c=HOME_COPY[lang];return <span lang={lang.toLowerCase()}>{department!==undefined?homeDepartment(department,lang):count!==undefined?count>0?`${count} ${count===1?c.item:c.items}`:c.empty:c[name!]}</span>}
