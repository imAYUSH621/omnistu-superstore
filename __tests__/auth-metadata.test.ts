const mockCookies=jest.fn(),mockHeaders=jest.fn();
jest.mock('next/headers',()=>({cookies:async()=>({get:()=>mockCookies()}),headers:async()=>({get:()=>mockHeaders()})}));
import {authMetadata} from '@/lib/auth-metadata';
import {AUTH_COPY} from '@/lib/auth-language';
import {SUPPORT_LANGUAGES} from '@/lib/support-language';
it.each(SUPPORT_LANGUAGES)('server title follows existing %s preference',async lang=>{mockCookies.mockReturnValue({value:lang});mockHeaders.mockReturnValue('en-US');expect(await authMetadata('createAccount')).toEqual({title:AUTH_COPY[lang].createAccount});});
it('first visit uses Accept-Language until middleware preference exists',async()=>{mockCookies.mockReturnValue(undefined);mockHeaders.mockReturnValue('ja-JP, en-US;q=0.8');expect(await authMetadata('signIn')).toEqual({title:AUTH_COPY.JA.signIn});});
