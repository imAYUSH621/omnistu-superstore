'use client';
import {useFormStatus} from 'react-dom';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {signInWithGoogle} from '@/lib/actions/google-signin.actions';
import {Button} from '@/components/ui/button';
export const GOOGLE_BUTTON_COPY={EN:['Continue with Google','Opening Google...'],HI:['Google से जारी रखें','Google खुल रहा है...'],ES:['Continuar con Google','Abriendo Google...'],FR:['Continuer avec Google','Ouverture de Google...'],DE:['Mit Google fortfahren','Google wird geöffnet...'],JA:['Google で続行','Google を開いています...']};
function GoogleButton(){const language=useStoreLanguage(),{pending}=useFormStatus(),copy=GOOGLE_BUTTON_COPY[language];return <Button className='w-full' variant='outline' disabled={pending}>{copy[pending?1:0]}</Button>}
export default function GoogleSignIn({callbackUrl}:{callbackUrl:string}){return <form action={signInWithGoogle}><input type='hidden' name='callbackUrl' value={callbackUrl}/><GoogleButton/></form>}
