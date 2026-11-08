import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AUTH_COPY,authMessage} from '@/lib/auth-language';
import {SUPPORT_LANGUAGES,type SupportLanguage} from '@/lib/support-language';
let mockLanguage:SupportLanguage='EN';
jest.mock('@/hooks/use-store-language',()=>({useStoreLanguage:()=>mockLanguage}));
jest.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams('callbackUrl=%2Fuser%2Forders')}));
jest.mock('@/lib/actions/user.actions',()=>({signInWithCredentials:jest.fn(),signUpUser:jest.fn()}));
jest.mock('@/lib/actions/password-reset.actions',()=>({requestReset:jest.fn(),resetPassword:jest.fn()}));
import SignIn from '@/app/(auth)/sign-in/credentials-signin-form';
import SignUp from '@/app/(auth)/sign-up/sign-up-form';
import Forgot from '@/app/(auth)/forgot-password/forgot-form';
import Reset from '@/app/(auth)/reset-password/reset-form';
import AuthText from '@/components/shared/auth-text';
const plain=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#x27;/g,"'").replace(/&quot;/g,'"');
it.each(SUPPORT_LANGUAGES)('account forms and headings use %s without changing callback or action fields',lang=>{
 mockLanguage=lang;const c=AUTH_COPY[lang];
 const signin=renderToStaticMarkup(<SignIn/>),signup=renderToStaticMarkup(<SignUp/>),forgot=renderToStaticMarkup(<Forgot available={false}/>),reset=renderToStaticMarkup(<Reset token='synthetic-token'/>);
 for(const text of [c.identity,c.password,c.signIn,c.forgotLink,c.signUp,c.noAccount])expect(plain(signin)).toContain(text);
 for(const text of [c.name,c.email,c.password,c.confirmPassword,c.hasAccount,c.signUp,c.signIn])expect(plain(signup)).toContain(text);
 for(const text of [c.email,c.requestReset,c.resetUnavailable])expect(plain(forgot)).toContain(text);
 for(const text of [c.newPassword,c.confirmPassword,c.updatePassword])expect(plain(reset)).toContain(text);
 for(const html of [signin,signup]){expect(html).toContain('name="callbackUrl"');expect(html).toContain('value="/user/orders"');expect(html).toContain('callbackUrl=%2Fuser%2Forders');}
 expect(forgot).toContain('disabled=""');expect(forgot).not.toContain(c.resetSent);expect(reset).toContain('name="token"');expect(reset).toContain('value="synthetic-token"');
 expect(signup).toContain('for="name"');expect(signup).toContain('autoComplete="new-password"');
 expect(plain(renderToStaticMarkup(<AuthText name='createAccount' pageTitle/>))).toContain(c.createAccount);
});
it.each(SUPPORT_LANGUAGES)('known server outcomes map to %s without exposing unknown backend errors',lang=>{
 const c=AUTH_COPY[lang];
 for(const key of ['invalidCredentials','rate','registrationUnavailable','registrationEmail','resetUnavailable','resetSent','resetOutbox','resetUnconfirmed','updated','expired','invalidReset','registered','signedIn'] as const)expect(authMessage(AUTH_COPY.EN[key],lang)).toBe(c[key]);
 expect(authMessage(`${AUTH_COPY.EN.nameShort}. ${AUTH_COPY.EN.mismatch}`,lang)).toBe(`${c.nameShort}. ${c.mismatch}`);
 expect(authMessage('Database host private-internal-error',lang)).toBe(c.generic);expect(authMessage('',lang)).toBe('');
 expect(Object.keys(c)).toEqual(Object.keys(AUTH_COPY.EN));expect(Object.values(c).every(value=>value.length>0)).toBe(true);
});
it('does not replace authentication actions or enable recovery transport',()=>{
 const fs=require('fs'),path=require('path');
 const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),'utf8');
 expect(read('app/(auth)/sign-in/credentials-signin-form.tsx')).toContain('useActionState(signInWithCredentials');
 expect(read('app/(auth)/sign-up/sign-up-form.tsx')).toContain('useActionState(signUpUser');
 expect(read('app/(auth)/forgot-password/page.tsx')).toContain('resolveMailTransport() !== null');
 expect(read('app/(auth)/forgot-password/forgot-form.tsx')).toContain('disabled={pending || !available}');
});
