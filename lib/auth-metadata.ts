import {cookies,headers} from 'next/headers';
import {AUTH_COPY,type AuthCopyKey} from '@/lib/auth-language';
import {supportLanguage} from '@/lib/support-language';
import {detectLanguage} from '@/lib/locale-detect';
/** Server metadata owns browser titles; Next may replace client title effects. */
export async function authMetadata(name:AuthCopyKey){
 const cookie=(await cookies()).get('omnistu_lang')?.value;
 const language=cookie?supportLanguage('',cookie):detectLanguage((await headers()).get('accept-language'));
 return {title:AUTH_COPY[language][name]};
}
