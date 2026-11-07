import {renderToStaticMarkup}from'react-dom/server';
const transport=jest.fn();
jest.mock('@/lib/mail/transport',()=>({resolveMailTransport:()=>transport()}));
jest.mock('@/app/(auth)/forgot-password/forgot-form',()=>({__esModule:true,default:({available}:{available:boolean})=><span data-available={String(available)}/> }));
import Page,{dynamic} from'@/app/(auth)/forgot-password/page';
it.each([null,{kind:'smtp'},{kind:'dev-outbox'}])('reset UI reflects actual permitted transport %p',value=>{transport.mockReturnValue(value);expect(renderToStaticMarkup(<Page/>)).toContain(`data-available="${value!==null}"`)});

it('reads transport availability at request time, not static build time',()=>{expect(dynamic).toBe('force-dynamic')});
