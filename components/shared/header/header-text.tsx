'use client';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{HEADER_COPY,headerItemCount,type HeaderKey}from '@/lib/header-language';
import{homeDepartment}from '@/lib/home-language';
/** Existing preference only. Canonical category values/URLs and account names
 * stay unchanged; this component translates display text, never permissions. */
export default function HeaderText({name,category,count,value}:{name?:HeaderKey;category?:string;count?:number;value?:string}){const l=useStoreLanguage();return <span lang={l.toLowerCase()}>{category!==undefined?homeDepartment(category,l):count!==undefined?headerItemCount(count,l):value!==undefined?`${HEADER_COPY[l].hello}, ${value}`:HEADER_COPY[l][name!]}</span>}
