'use client';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {ACCOUNT_SUPPORT_COPY,enquiryStatus,type AccountSupportKey} from '@/lib/account-support-language';
export default function AccountSupportText({name,status}:{name?:AccountSupportKey;status?:string}){const language=useStoreLanguage();return <span lang={language.toLowerCase()}>{status!==undefined?enquiryStatus(status,language):ACCOUNT_SUPPORT_COPY[language][name!]}</span>}
