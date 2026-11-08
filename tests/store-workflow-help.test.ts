jest.mock('@/lib/chat',()=>({findProducts:jest.fn().mockResolvedValue('')}));
jest.mock('@/lib/actions/product.actions',()=>({getAllCategories:jest.fn().mockResolvedValue([])}));
import {WORKFLOW_HELP,workflowIntent} from '@/lib/store-workflow-help';
import {SUPPORT_LANGUAGES,SUPPORT_COPY} from '@/lib/support-language';
import {groundedSupportAnswer,supportIntent} from '@/lib/grounded-support';
import {findProducts} from '@/lib/chat';
afterEach(()=>jest.clearAllMocks());
it.each([
 ['how do I sign in','account'],['साइन इन कैसे करें','account'],['iniciar sesión','account'],['connexion à mon compte','account'],['anmelden','account'],['アカウント作成','account'],
 ['forgot password','recovery'],['पासवर्ड भूल गया','recovery'],['contraseña olvidada','recovery'],['mot de passe oublié','recovery'],['Passwort vergessen','recovery'],['パスワードを忘れた','recovery'],
 ['change currency','locale'],['भाषा बदलें','locale'],['cambiar idioma','locale'],['changer la devise','locale'],['Sprache ändern','locale'],['通貨の変更','locale'],
 ['my support ticket','enquiries'],['मेरी पूछताछ','enquiries'],['mis consultas','enquiries'],['mes demandes','enquiries'],['meine Anfragen','enquiries'],['問い合わせ履歴','enquiries'],
])('routes %s to public workflow %s',(query,intent)=>{expect(workflowIntent(query)).toBe(intent);expect(supportIntent(query)).toBe(intent)});
it.each(SUPPORT_LANGUAGES)('all %s workflow answers use static verified public facts, not private lookup',async lang=>{
 for(const [intent,item]of Object.entries(WORKFLOW_HELP)){
  const query={account:'sign in',recovery:'reset password',locale:'currency',enquiries:'my support ticket'}[intent]!;
  expect(await groundedSupportAnswer(query,lang)).toBe(SUPPORT_COPY[lang].label+'\n'+item.copy[lang]);
  expect(item.copy[lang].length).toBeGreaterThan(60);
  for(const link of item.copy[lang].match(/\/[a-z/-]+/g)??[])expect(['/sign-in','/sign-up','/user/orders','/forgot-password','/contact','/user/enquiries']).toContain(link);
 }
 expect(findProducts).not.toHaveBeenCalled();
});
it('does not mistake a policy/order action for account help',()=>{expect(supportIntent('cancel my account and refund')).toBe('policy');expect(supportIntent('track my order after sign in')).toBe('order')});
it('does not echo visitor secrets or claim password reset/email was triggered',async()=>{const answer=await groundedSupportAnswer('reset password token private-token-123');expect(answer).not.toContain('private-token');expect(answer).toContain('No reset request or email');expect(answer).toContain('/forgot-password');expect(answer).not.toContain('has been sent to your email');});
it('retrieval metadata refers to actual existing public workflow pages',()=>{const fs=require('fs');for(const item of Object.values(WORKFLOW_HELP))for(const source of item.sources){const file=source==='/'?'app/(root)/page.tsx':source.startsWith('/user/')?'app'+source+'/page.tsx':source==='/contact'?'app/(root)/contact/page.tsx':'app/(auth)'+source+'/page.tsx';expect(fs.existsSync(file)).toBe(true)}});
