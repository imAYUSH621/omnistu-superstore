'use client';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{REVIEW_COPY,type ReviewKey}from '@/lib/review-language';
export default function ReviewText({name}:{name:ReviewKey}){const l=useStoreLanguage();return <span lang={l.toLowerCase()}>{REVIEW_COPY[l][name]}</span>}
