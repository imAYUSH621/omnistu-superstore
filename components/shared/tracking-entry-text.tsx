'use client';
import {useStoreLanguage} from '@/hooks/use-store-language';import {TRACKING_ENTRY_COPY,type TrackingEntryKey} from '@/lib/tracking-entry-language';
export default function TrackingEntryText({name}:{name:TrackingEntryKey}){return <span>{TRACKING_ENTRY_COPY[useStoreLanguage()][name]}</span>}
