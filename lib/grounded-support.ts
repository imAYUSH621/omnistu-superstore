import { findProducts } from './chat';
import { getAllCategories } from './actions/product.actions';
import { testCheckoutMode, ordersEnabled } from './payment-capabilities';

export const SUPPORT_LABEL = 'Automated store help (no external AI)';
/** Public facts only. Never retrieves orders, calls a model, sends mail or changes an account. */
export async function groundedSupportAnswer(text: string): Promise<string> {
  const q = text.toLowerCase();
  const label = SUPPORT_LABEL + '\n';
  if (/\b(refund|return|replace|polic|guarantee|warranty|cancel|discount|coupon)/.test(q)) {
    return label + 'I cannot confirm shipping timeframes, return windows or refund eligibility, or change an order. These terms are still being finalised for launch. Open /contact to reach the team. You can save an enquiry in the store support inbox there. No email is sent; I cannot promise a reply time.';
  }
  if (/\b(order|track|package|parcel|dispatch)/.test(q)) {
    return label + 'I do not retrieve order details. Sign in and open /user/orders to see your own orders. Carrier and tracking details appear there when recorded. For anything missing, open /contact. No order status has been checked by this chat.';
  }
  if (/\b(contact|support|human|agent|email|help|complaint)/.test(q)) {
    return label + 'Open /contact to reach the Omnistu team. You can save an enquiry in the store support inbox there. No email is sent. I have not sent a message or opened a support ticket, and cannot promise a reply time.';
  }
  if (/\b(payment|pay|checkout|cash|paypal|stripe|card)/.test(q)) {
    if (testCheckoutMode()) return label + 'This deployment has a simulated test checkout. Test payment makes no real charge, shipment or supplier order. Check the payment page for the methods currently shown.';
    if (!ordersEnabled()) return label + 'Real checkout is not available yet. You can browse the store, but this chat cannot take payments or place orders.';
    return label + 'The payment page shows the methods currently available for your order. This chat cannot take payments, place orders or confirm that a payment succeeded. Your signed-in order page is the source of truth.';
  }
  if (/\b(shipping|delivery|arriv|customs|duties)/.test(q)) {
    return label + 'I cannot confirm delivery dates, shipping charges or customs terms. Open /contact for the team to check a specific product or order. No shipping quote has been obtained here.';
  }
  if (/\b(categor|what do you sell|browse|what can i buy)/.test(q)) {
    try {
      const categories = await getAllCategories();
      if (categories.length) return label + 'Current catalog categories: ' + categories.map(c => `${c.category} (${c._count})`).join(', ') + '. Open /search to browse. Product availability is shown on each product page.';
    } catch { /* The empty message below never invents inventory. */ }
    return label + 'No catalog categories with available listings can be confirmed right now. Open /search for the current catalog. The homepage may show planned categories that do not have products yet.';
  }
  if (/\b(hi|hello|hey|namaste)\b/.test(q) && q.length < 40) return label + 'Hello! I can find products in the current catalog and explain where to see orders or contact the team. I do not access your order data, take payments or send support messages.';
  const products = await findProducts(text);
  if (products) return label + 'Matching catalog listings:\n' + products + '\nOpen a product link to check its current details and availability. No purchase or delivery promise is made here.';
  return label + 'I could not find a matching product in the current catalog. Try a product or category name, open /search, or open /contact for the team. I cannot answer general questions outside this store.';
}
