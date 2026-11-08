'use client';
import {useStoreLanguage} from '@/hooks/use-store-language';import {PROFILE_COPY,type ProfileKey} from '@/lib/profile-language';
export default function ProfileText({name}:{name:ProfileKey}){const language=useStoreLanguage();return <span lang={language.toLowerCase()}>{PROFILE_COPY[language][name]}</span>}
