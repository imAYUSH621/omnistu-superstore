'use client';
import {useStoreLanguage} from '@/hooks/use-store-language';import {ORDER_HISTORY_COPY,orderHistoryDate,type OrderHistoryKey} from '@/lib/order-history-language';
export default function OrderHistoryText({name,date}:{name?:OrderHistoryKey;date?:string}){const language=useStoreLanguage();return <span lang={language.toLowerCase()}>{date!==undefined?orderHistoryDate(date,language):ORDER_HISTORY_COPY[language][name!]}</span>}
