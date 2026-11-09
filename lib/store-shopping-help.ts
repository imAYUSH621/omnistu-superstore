import type{SupportLanguage}from './support-language';
export const SHOPPING_HELP={
 "cart": {
  "sources": [
   "/cart",
   "/search"
  ],
  "copy": {
   "EN": "Open /cart to review items and quantities, or /search to browse. On a product page, check its options and current availability before adding it. A cart is not a stock reservation, price guarantee or completed order. This chat has not read or changed your cart. Sign-in is required to continue to checkout.",
   "HI": "उत्पाद और मात्रा देखने के लिए /cart या खोजने के लिए /search खोलें। कार्ट में जोड़ने से पहले उत्पाद पेज पर विकल्प और मौजूदा उपलब्धता देखें। कार्ट स्टॉक का आरक्षण, कीमत की गारंटी या पूरा ऑर्डर नहीं है। इस चैट ने आपका कार्ट देखा या बदला नहीं है। चेकआउट के लिए साइन इन करना होता है।",
   "ES": "Abre /cart para revisar artículos y cantidades o /search para explorar. Comprueba opciones y disponibilidad en la página del producto antes de añadirlo. El carrito no reserva existencias, garantiza precios ni completa un pedido. Este chat no ha leído ni cambiado tu carrito. Debes iniciar sesión para continuar al pago.",
   "FR": "Ouvrez /cart pour vérifier articles et quantités, ou /search pour parcourir les produits. Vérifiez options et disponibilité sur la page produit avant l'ajout. Le panier ne réserve aucun stock, ne garantit aucun prix et ne confirme pas une commande. Ce chat n'a ni lu ni modifié votre panier. La connexion est requise pour continuer.",
   "DE": "Unter /cart prüfen Sie Artikel und Mengen, unter /search suchen Sie Produkte. Prüfen Sie Optionen und Verfügbarkeit auf der Produktseite vor dem Hinzufügen. Der Warenkorb reserviert keinen Bestand, garantiert keinen Preis und ist keine abgeschlossene Bestellung. Dieser Chat hat Ihren Warenkorb weder gelesen noch geändert. Für den Checkout müssen Sie sich anmelden.",
   "JA": "商品と数量の確認は /cart、商品検索は /search です。追加前に商品ページで選択肢と現在の提供状況を確認してください。カートは在庫予約、価格保証、注文完了を意味しません。このチャットではカートの参照や変更をしていません。注文画面へ進むにはサインインが必要です。"
  }
 },
 "address": {
  "sources": [
   "/cart",
   "/shipping-address",
   "/contact"
  ],
  "copy": {
   "EN": "For a new checkout, sign in and continue from /cart to /shipping-address. Review the country and postal code in that form; saving an address does not confirm delivery coverage, shipping cost or arrival time. This chat has not read or saved an address. To change an already placed order, use /contact; editing the checkout form does not update an existing order.",
   "HI": "नए चेकआउट के लिए साइन इन करके /cart से /shipping-address पर जाएँ। फॉर्म में देश और पिन कोड देखें; पता सहेजना डिलीवरी क्षेत्र, शिपिंग कीमत या पहुँचने के समय की पुष्टि नहीं है। इस चैट ने पता देखा या सहेजा नहीं है। पहले से किए ऑर्डर में बदलाव के लिए /contact खोलें; चेकआउट का फॉर्म बदलने से पुराना ऑर्डर नहीं बदलता।",
   "ES": "Para una nueva compra, inicia sesión y continúa de /cart a /shipping-address. Revisa país y código postal; guardar una dirección no confirma cobertura, coste ni fecha de entrega. Este chat no ha leído ni guardado direcciones. Para cambiar un pedido ya realizado, usa /contact; editar el formulario no cambia pedidos existentes.",
   "FR": "Pour une nouvelle commande, connectez-vous et passez de /cart à /shipping-address. Vérifiez pays et code postal ; enregistrer une adresse ne confirme ni zone livrée, ni frais, ni date. Ce chat n'a ni lu ni enregistré d'adresse. Pour modifier une commande existante, utilisez /contact ; ce formulaire ne la modifie pas.",
   "DE": "Für einen neuen Checkout melden Sie sich an und gehen von /cart zu /shipping-address. Prüfen Sie Land und Postleitzahl; das Speichern bestätigt weder Liefergebiet noch Kosten oder Termin. Dieser Chat hat keine Adresse gelesen oder gespeichert. Für Änderungen an bestehenden Bestellungen nutzen Sie /contact; das Checkout-Formular ändert keine bestehende Bestellung.",
   "JA": "新しい注文ではサインインし、/cart から /shipping-address に進みます。国と郵便番号を確認してください。住所の保存は配送地域、送料、到着日の確認ではありません。このチャットは住所の参照や保存をしていません。注文済みの内容を変更する場合は /contact を使ってください。このフォームの編集では既存の注文は変わりません。"
  }
 },
 "checkout": {
  "sources": [
   "/cart",
   "/shipping-address",
   "/payment-method",
   "/place-order",
   "/user/orders"
  ],
  "copy": {
   "EN": "To review a new checkout, sign in and continue from /cart through /shipping-address and /payment-method to /place-order. The pages validate your cart, address and currently available methods; some steps redirect back when requirements are missing. Review the displayed items and final amounts before any order action. No order or payment has been made by this chat. Your own recorded orders are at /user/orders.",
   "HI": "नया चेकआउट देखने के लिए साइन इन करके /cart से /shipping-address और /payment-method के बाद /place-order पर जाएँ। पेज कार्ट, पता और उपलब्ध तरीकों की जाँच करते हैं; जरूरी जानकारी न होने पर पिछला पेज खुल सकता है। ऑर्डर करने से पहले दिख रहे उत्पाद और अंतिम रकम देखें। इस चैट ने ऑर्डर या भुगतान नहीं किया है। आपके दर्ज ऑर्डर /user/orders पर हैं।",
   "ES": "Para revisar una compra nueva, inicia sesión y sigue /cart, /shipping-address, /payment-method y /place-order. Las páginas validan carrito, dirección y métodos disponibles; pueden volver a pasos anteriores si falta información. Revisa artículos e importes finales antes de confirmar. Este chat no ha hecho pedidos ni pagos. Tus pedidos registrados están en /user/orders.",
   "FR": "Pour revoir une nouvelle commande, connectez-vous puis suivez /cart, /shipping-address, /payment-method et /place-order. Les pages vérifient panier, adresse et moyens disponibles ; elles peuvent revenir à une étape précédente si nécessaire. Vérifiez articles et montants finaux avant toute confirmation. Ce chat n'a passé aucune commande ni paiement. Vos commandes enregistrées sont sur /user/orders.",
   "DE": "Für einen neuen Checkout melden Sie sich an und folgen /cart, /shipping-address, /payment-method und /place-order. Die Seiten prüfen Warenkorb, Adresse und verfügbare Zahlungsarten; fehlende Angaben können zu einem früheren Schritt führen. Prüfen Sie Artikel und Endbeträge vor einer Bestellaktion. Dieser Chat hat weder bestellt noch bezahlt. Eigene gespeicherte Bestellungen stehen unter /user/orders.",
   "JA": "新しい注文の確認にはサインイン後、/cart、/shipping-address、/payment-method、/place-order の順に進みます。カート、住所、利用できる方法が確認され、不足があれば前の手順へ戻ることがあります。注文操作の前に商品と最終金額を確認してください。このチャットでは注文や支払いをしていません。記録済みの注文は /user/orders です。"
  }
 }
} satisfies Record<string,{sources:string[];copy:Record<SupportLanguage,string>}>;
export type ShoppingHelpIntent=keyof typeof SHOPPING_HELP;
/** Explanations of public pages only, never an action or private-state lookup. */
export function shoppingHelpIntent(text:string):ShoppingHelpIntent|null{
 const q=text.toLowerCase().normalize('NFC');
 if(/track|status|where.*order|sendungsverfolg|bestellstatus|seguimiento|suivi|注文状況|追跡|ऑर्डर.*स्थिति|ट्रैक/u.test(q))return null;
 if(/shipping address|delivery address|postal code|checkout address|पता|पिन कोड|direcci[oó]n|c[oó]digo postal|adresse.*livraison|adresse postale|lieferadresse|postleitzahl|配送先|住所|郵便番号/u.test(q))return 'address';
 if(/check[ -]?out|place.*order|how.*(buy|purchase)|complete.*purchase|चेकआउट|ऑर्डर.*कैसे|कैसे.*ऑर्डर|खरीद.*कैसे|कैसे.*खरीद|finalizar.*compra|c[oó]mo.*comprar|passer.*commande|comment.*acheter|zur kasse|bestellung.*aufgeben|wie.*kaufen|注文方法|購入方法|購入.*手順|決済.*手順/u.test(q))return 'checkout';
 if(/cart|basket|कार्ट|टोकरी|carrito|panier|warenkorb|カート|買い物かご/u.test(q))return 'cart';
 return null;
}
