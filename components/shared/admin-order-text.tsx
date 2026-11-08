'use client';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {ADMIN_ORDER_COPY,type AdminOrderKey} from '@/lib/admin-order-language';
export default function AdminOrderText({name}:{name:AdminOrderKey}){return <span>{ADMIN_ORDER_COPY[useStoreLanguage()][name]}</span>}
