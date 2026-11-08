import {workflowIntent,workflowAnswer,type WorkflowIntent} from './store-workflow-help';
import { findProducts } from './chat';
import { getAllCategories } from './actions/product.actions';
import { testCheckoutMode, ordersEnabled } from './payment-capabilities';
import { SUPPORT_COPY, supportLanguage } from './support-language';

export const SUPPORT_LABEL = SUPPORT_COPY.EN.label;
export type SupportIntent = 'policy'|'order'|'contact'|'payment'|'shipping'|'categories'|'greeting'|'product'|WorkflowIntent;
/** Restricted intent routing, never an instruction interpreter or a policy source. */
export function supportIntent(text:string):SupportIntent {
 const q=text.toLowerCase().normalize('NFC');
 if (/refund|return|replace|polic|guarantee|warranty|cancel|discount|coupon|रिफंड|वापस|वापसी|रद्द|नीति|गारंटी|devolu|reembolso|cancelar|garantía|rembours|retour|annul|garantie|rückgab|erstattung|stornier|返品|返金|キャンセル|保証/u.test(q)) return 'policy';
 if (/order|track|package|parcel|dispatch|ऑर्डर|आर्डर|ट्रैक|पार्सल|pedido|seguimiento|commande|suivi|bestellung|sendungsverfolg|注文|追跡/u.test(q)) return 'order';
 const workflow=workflowIntent(text);if(workflow)return workflow;
 if (/contact|support|human|agent|email|help|complaint|मदद|सहायता|संपर्क|इंसान|शिकायत|ayuda|humano|equipo|aide|équipe|humain|hilfe|mensch|kontakt|問い合わせ|サポート|担当者/u.test(q)) return 'contact';
 if (/payment|pay|checkout|cash|paypal|stripe|card|भुगतान|पेमेंट|चेकआउट|पैसे|pago|pagar|paiement|payer|zahlung|bezahlen|支払|決済/u.test(q)) return 'payment';
 if (/shipping|delivery|arriv|customs|duties|डिलीवरी|शिपिंग|कस्टम|डिलीवर|envío|entrega|aduana|livraison|douane|versand|lieferung|zoll|配送|送料|配達|関税/u.test(q)) return 'shipping';
 if (/categor|what do you sell|browse|what can i buy|श्रेण|कैटेगरी|क्या बेच|catégor|kategor|カテゴリー|カテゴリ|商品一覧/u.test(q)) return 'categories';
 if (/^(hi|hello|hey|namaste|hola|bonjour|salut|hallo|guten tag|नमस्ते|नमस्कार|こんにちは|おはよう)[!?.।\s]*$/u.test(q.trim())) return 'greeting';
 return 'product';
}
/** Public facts only. Never retrieves orders, calls a model, sends mail or changes an account. */
export async function groundedSupportAnswer(text: string, preferredLanguage?: string): Promise<string> {
 const copy=SUPPORT_COPY[supportLanguage(text,preferredLanguage)],label=copy.label+'\n';
 const intent=supportIntent(text);
 if(intent==='policy')return label+copy.policy;
 if(['account','recovery','locale','enquiries'].includes(intent))return label+workflowAnswer(intent as WorkflowIntent,supportLanguage(text,preferredLanguage));
 if(intent==='order')return label+copy.order;
 if(intent==='contact')return label+copy.contact;
 if(intent==='payment')return label+(testCheckoutMode()?copy.test:!ordersEnabled()?copy.closed:copy.payment);
 if(intent==='shipping')return label+copy.shipping;
 if(intent==='greeting')return label+copy.greeting;
 if(intent==='categories'){
  try { const categories=await getAllCategories();if(categories.length)return label+copy.categories+' '+categories.map(c=>`${c.category} (${c._count})`).join(', ')+'. '+copy.categoryEnd; } catch { /* Never invent categories on a failed read. */ }
  return label+copy.noCategories;
 }
 const products=await findProducts(text);
 return products?label+copy.matches+'\n'+products+'\n'+copy.productEnd:label+copy.noProduct;
}
