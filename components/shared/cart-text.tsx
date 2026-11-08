'use client';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {CART_COPY,type CartKey} from '@/lib/cart-language';
export default function CartText({name}:{name:CartKey}){const lang=useStoreLanguage();return <span lang={lang.toLowerCase()}>{CART_COPY[lang][name]}</span>}
