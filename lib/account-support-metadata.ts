import {cookies,headers} from 'next/headers';
import {ACCOUNT_SUPPORT_COPY} from './account-support-language';
import {supportLanguage} from './support-language';
import {detectLanguage} from './locale-detect';
export async function accountSupportMetadata(){const cookie=(await cookies()).get('omnistu_lang')?.value;const language=cookie?supportLanguage('',cookie):detectLanguage((await headers()).get('accept-language'));return{title:ACCOUNT_SUPPORT_COPY[language].title}}
