import{SHOPPING_HELP,shoppingHelpIntent}from './store-shopping-help';
import{CATALOG_UNAVAILABLE}from './catalog-retrieval-language';
import{homeDepartment}from './home-language';
import {WORKFLOW_HELP,workflowIntent,workflowAnswer,type WorkflowIntent} from './store-workflow-help';
import { findProductsState } from './chat';
import { getAllCategoriesState } from './actions/product.actions';
import { testCheckoutMode, ordersEnabled } from './payment-capabilities';
import { SUPPORT_COPY, supportLanguage } from './support-language';

export const SUPPORT_LABEL = SUPPORT_COPY.EN.label;
export type SupportIntent = 'policy'|'order'|'contact'|'payment'|'shipping'|'categories'|'greeting'|'product'|WorkflowIntent|keyof typeof SHOPPING_HELP;
/** Restricted intent routing, never an instruction interpreter or a policy source. */
export function supportIntent(text:string):SupportIntent {
 const q=text.toLowerCase().normalize('NFC');
 if (/refund|return|replace|polic|guarantee|warranty|cancel|discount|coupon|रिफंड|वापस|वापसी|रद्द|नीति|गारंटी|devolu|reembolso|cancelar|garantía|rembours|retour|annul|garantie|rückgab|erstattung|stornier|返品|返金|キャンセル|保証/u.test(q)) return 'policy';
 const shopping=shoppingHelpIntent(text);if(shopping)return shopping;
 if (/order|track|package|parcel|dispatch|ऑर्डर|आर्डर|ट्रैक|पार्सल|pedido|seguimiento|commande|suivi|bestellung|bestellstatus|sendungsverfolg|注文|追跡/u.test(q)) return 'order';
 const workflow=workflowIntent(text);if(workflow)return workflow;
 if (/contact|support|human|agent|email|help|complaint|मदद|सहायता|संपर्क|इंसान|शिकायत|ayuda|humano|equipo|aide|équipe|humain|hilfe|mensch|kontakt|問い合わせ|サポート|担当者/u.test(q)) return 'contact';
 if (/payment|pay|checkout|cash|paypal|stripe|card|भुगतान|पेमेंट|चेकआउट|पैसे|pago|pagar|paiement|payer|zahlung|bezahlen|支払|決済/u.test(q)) return 'payment';
 if (/shipping|delivery|arriv|customs|duties|डिलीवरी|शिपिंग|कस्टम|डिलीवर|envío|entrega|aduana|livraison|douane|versand|lieferung|zoll|配送|送料|配達|関税/u.test(q)) return 'shipping';
 if (/categor|what do you sell|browse|what can i buy|श्रेण|कैटेगरी|क्या बेच|catégor|kategor|カテゴリー|カテゴリ|商品一覧/u.test(q)) return 'categories';
 if (/^(hi|hello|hey|namaste|hola|bonjour|salut|hallo|guten tag|नमस्ते|नमस्कार|こんにちは|おはよう)[!?.।\s]*$/u.test(q.trim())) return 'greeting';
 return 'product';
}
export type StoreHelpResult={intent:SupportIntent;language:ReturnType<typeof supportLanguage>;status:'available'|'unavailable';sources:string[];answer:string;catalogData?:string};
/** One bounded retrieval contract for public help and the optional model path.
 * Static workflow text is application-owned; catalogData is untrusted stored data.
 * Neither branch reads private cart/address/orders/enquiries or executes effects. */
export async function retrieveStoreHelp(text:string,preferredLanguage?:string):Promise<StoreHelpResult>{
 const language=supportLanguage(text,preferredLanguage),copy=SUPPORT_COPY[language],intent=supportIntent(text);
 const result=(body:string,sources:string[],status:StoreHelpResult['status']='available',catalogData?:string):StoreHelpResult=>({intent,language,status,sources,answer:copy.label+'\n'+body,...(catalogData!==undefined?{catalogData}:{})});
 const payment=testCheckoutMode()?copy.test:!ordersEnabled()?copy.closed:copy.payment;
 if(intent==='policy')return result(copy.policy,['/contact']);
 if(intent==='cart'||intent==='address'||intent==='checkout')return result(SHOPPING_HELP[intent].copy[language]+(intent==='checkout'?'\n'+payment:''),SHOPPING_HELP[intent].sources);
 if(intent==='account'||intent==='recovery'||intent==='locale'||intent==='enquiries')return result(workflowAnswer(intent,language),WORKFLOW_HELP[intent].sources);
 if(intent==='order')return result(copy.order,['/user/orders','/contact']);
 if(intent==='contact')return result(copy.contact,['/contact']);
 if(intent==='payment')return result(payment,['/payment-method']);
 if(intent==='shipping')return result(copy.shipping,['/contact']);
 if(intent==='greeting')return result(copy.greeting,['/search','/user/orders','/contact']);
 if(intent==='categories'){
  try{const state=await getAllCategoriesState();if(state.status==='unavailable')return result(CATALOG_UNAVAILABLE[language],['/search','/contact'],'unavailable');
   return result(state.categories.length?copy.categories+' '+state.categories.map(c=>`${homeDepartment(c.category,language)} (${c._count})`).join(', ')+'. '+copy.categoryEnd:copy.noCategories,['/search']);
  }catch{return result(CATALOG_UNAVAILABLE[language],['/search','/contact'],'unavailable')}
 }
 try{const state=await findProductsState(text);if(state.status==='unavailable')return result(CATALOG_UNAVAILABLE[language],['/search','/contact'],'unavailable');
  return result(state.products?copy.matches+'\n'+state.products+'\n'+copy.productEnd:copy.noProduct,['/search','/contact'], 'available',state.products);
 }catch{return result(CATALOG_UNAVAILABLE[language],['/search','/contact'],'unavailable')}
}
/** Compatibility answer surface backed by the same source-mapped retrieval. */
export async function groundedSupportAnswer(text:string,preferredLanguage?:string):Promise<string>{return(await retrieveStoreHelp(text,preferredLanguage)).answer}
