import type{SupportLanguage}from './support-language';
export const REVIEW_COPY={
 "EN": {
  "title": "Review order",
  "testEstimates": "Simulated test order: tax and shipping are test estimates, not real tax or shipping rates.",
  "testMethod": "Test payment (simulated, no charge)",
  "pending": "Placing your order. Please wait without clicking again. A second submit reuses the same order.",
  "failed": "The order could not be placed. Review your details and try again.",
  "placeTest": "Place test order - no charge",
  "testOnly": "TEST ONLY. No real payment, supplier order or shipment."
 },
 "HI": {
  "title": "ऑर्डर की समीक्षा",
  "testEstimates": "सिम्युलेटेड टेस्ट ऑर्डर: टैक्स और शिपिंग केवल टेस्ट अनुमान हैं, असली टैक्स या शिपिंग दरें नहीं।",
  "testMethod": "टेस्ट भुगतान (सिम्युलेटेड, कोई शुल्क नहीं)",
  "pending": "ऑर्डर बनाया जा रहा है। दोबारा क्लिक किए बिना प्रतीक्षा करें। दोबारा भेजने पर वही ऑर्डर इस्तेमाल होता है।",
  "failed": "ऑर्डर नहीं दिया जा सका। जानकारी जाँचकर फिर कोशिश करें।",
  "placeTest": "टेस्ट ऑर्डर दें - कोई शुल्क नहीं",
  "testOnly": "केवल टेस्ट। असली भुगतान, सप्लायर ऑर्डर या शिपमेंट नहीं।"
 },
 "ES": {
  "title": "Revisar pedido",
  "testEstimates": "Pedido de prueba simulado: los impuestos y el envío son estimaciones de prueba, no tarifas reales.",
  "testMethod": "Pago de prueba (simulado, sin cargo)",
  "pending": "Creando el pedido. Espera sin volver a pulsar. Un segundo envío reutiliza el mismo pedido.",
  "failed": "No se pudo hacer el pedido. Revisa los datos e inténtalo de nuevo.",
  "placeTest": "Hacer pedido de prueba, sin cargo",
  "testOnly": "SOLO PRUEBA. Sin pago, pedido al proveedor ni envío reales."
 },
 "FR": {
  "title": "Vérifier la commande",
  "testEstimates": "Commande de test simulée : les taxes et la livraison sont des estimations de test, pas des tarifs réels.",
  "testMethod": "Paiement de test (simulé, sans frais)",
  "pending": "Création de la commande. Patientez sans cliquer à nouveau. Un second envoi réutilise la même commande.",
  "failed": "La commande n'a pas pu être passée. Vérifiez les informations et réessayez.",
  "placeTest": "Passer la commande de test, sans frais",
  "testOnly": "TEST UNIQUEMENT. Aucun paiement, achat fournisseur ou envoi réel."
 },
 "DE": {
  "title": "Bestellung prüfen",
  "testEstimates": "Simulierte Testbestellung: Steuern und Versand sind Testschätzungen, keine echten Steuern oder Versandtarife.",
  "testMethod": "Testzahlung (simuliert, ohne Kosten)",
  "pending": "Bestellung wird erstellt. Bitte warte, ohne erneut zu klicken. Eine zweite Übermittlung nutzt dieselbe Bestellung.",
  "failed": "Die Bestellung konnte nicht aufgegeben werden. Prüfe deine Angaben und versuche es erneut.",
  "placeTest": "Testbestellung aufgeben, ohne Kosten",
  "testOnly": "NUR TEST. Keine echte Zahlung, Lieferantenbestellung oder Sendung."
 },
 "JA": {
  "title": "注文を確認",
  "testEstimates": "仮のテスト注文です。税金と送料はテスト用の見積もりであり、実際の税額や送料ではありません。",
  "testMethod": "テスト支払い（仮の支払い、請求なし）",
  "pending": "注文を作成しています。もう一度押さずにお待ちください。再送信しても同じ注文を使用します。",
  "failed": "注文できませんでした。内容を確認して再度お試しください。",
  "placeTest": "テスト注文を確定（請求なし）",
  "testOnly": "テスト専用です。実際の支払い、仕入先への注文、発送はありません。"
 }
} as const satisfies Record<SupportLanguage,Record<string,string>>;
export type ReviewKey=keyof typeof REVIEW_COPY.EN;
