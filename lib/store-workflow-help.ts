import type {SupportLanguage} from '@/lib/support-language';
/** Verified public workflows only. Sources are existing UI routes and behavior,
 * never draft commercial terms or data supplied by a visitor. */
export const WORKFLOW_HELP={
 account:{sources:['/sign-in','/sign-up'],copy:{
 EN:'Open /sign-in and use the existing account form, or /sign-up to create an account. Order history is at /user/orders after sign-in. Do not put your password in this chat. I have not accessed or changed your account.',
 HI:'मौजूदा खाते के फॉर्म से साइन इन करने के लिए /sign-in खोलें, या खाता बनाने के लिए /sign-up। साइन इन के बाद ऑर्डर का इतिहास /user/orders पर है। अपना पासवर्ड इस चैट में न लिखें। मैंने आपका खाता देखा या बदला नहीं है।',
 ES:'Abre /sign-in para entrar con el formulario existente o /sign-up para crear una cuenta. Tras entrar, tus pedidos están en /user/orders. No escribas tu contraseña en este chat. No he accedido a tu cuenta ni la he cambiado.',
 FR:"Ouvrez /sign-in pour utiliser le formulaire de connexion, ou /sign-up pour créer un compte. Après connexion, vos commandes sont sur /user/orders. Ne saisissez pas votre mot de passe dans ce chat. Je n'ai ni consulté ni modifié votre compte.",
 DE:'Öffnen Sie /sign-in für das bestehende Anmeldeformular oder /sign-up für ein neues Konto. Nach der Anmeldung finden Sie Bestellungen unter /user/orders. Schreiben Sie Ihr Passwort nicht in diesen Chat. Ich habe Ihr Konto weder gelesen noch geändert.',
 JA:'サインインは /sign-in、アカウント作成は /sign-up を開いてください。サインイン後の注文履歴は /user/orders にあります。このチャットにパスワードを書かないでください。アカウントの参照や変更はしていません。',
 }},
 recovery:{sources:['/forgot-password','/sign-in','/contact'],copy:{
 EN:'Open /forgot-password to see whether password reset is currently available. If it is disabled, the page says so; this chat cannot enable it. Never share your password or reset token here. No reset request or email has been sent by this chat. Use /contact if you need the team.',
 HI:'पासवर्ड रीसेट अभी उपलब्ध है या नहीं, यह /forgot-password पर देखें। बंद होने पर पेज बताता है; यह चैट उसे चालू नहीं कर सकती। पासवर्ड या रीसेट टोकन यहाँ न लिखें। इस चैट ने रीसेट का अनुरोध या ईमेल नहीं भेजा है। टीम के लिए /contact खोलें।',
 ES:'Abre /forgot-password para ver si el restablecimiento está disponible. Si está desactivado, la página lo indica; este chat no puede activarlo. No compartas contraseñas ni tokens. Este chat no ha solicitado un cambio ni enviado correo. Para el equipo, abre /contact.',
 FR:"Ouvrez /forgot-password pour vérifier si la réinitialisation est disponible. La page indique si elle est désactivée; ce chat ne peut pas l'activer. Ne partagez ni mot de passe ni jeton. Ce chat n'a demandé aucune réinitialisation ni envoyé d'e-mail. Pour l'équipe, ouvrez /contact.",
 DE:'Unter /forgot-password sehen Sie, ob das Zurücksetzen derzeit verfügbar ist. Die Seite zeigt eine Deaktivierung an; dieser Chat kann sie nicht aufheben. Teilen Sie weder Passwort noch Reset-Token. Dieser Chat hat weder eine Änderung angefordert noch eine E-Mail gesendet. Das Team erreichen Sie unter /contact.',
 JA:'パスワードのリセットが利用できるか /forgot-password で確認してください。利用不可の場合はページに表示されます。このチャットでは有効化できません。パスワードやリセットトークンを共有しないでください。リセット申請やメール送信はしていません。チームへの相談は /contact です。',
 }},
 locale:{sources:['/'],copy:{
 EN:'Use the language/currency selector in the store header. The first visit uses browser language; a saved manual choice takes priority. Six languages are supported: EN, HI, ES, FR, DE and JA. Some product details and policy pages remain English. Currency conversion is for reference, not a settlement quote; checkout amounts stay USD.',
 HI:'स्टोर के हेडर में भाषा/मुद्रा का विकल्प चुनें। पहली बार ब्राउज़र की भाषा इस्तेमाल होती है; सहेजा गया आपका चुनाव पहले लागू होता है। छह भाषाएँ हैं: EN, HI, ES, FR, DE और JA। उत्पाद की कुछ जानकारी और नीति पेज अभी अंग्रेज़ी में हैं। मुद्रा का रूपांतरण सिर्फ संदर्भ है; चेकआउट की रकम USD में रहती है।',
 ES:'Usa el selector de idioma y moneda en la cabecera. La primera visita usa el idioma del navegador; tu elección guardada tiene prioridad. Hay seis idiomas: EN, HI, ES, FR, DE y JA. Algunos detalles y políticas siguen en inglés. La conversión es orientativa; los importes de pago siguen en USD.',
 FR:"Utilisez le sélecteur de langue et de devise en haut de la boutique. La langue du navigateur est utilisée à la première visite; votre choix enregistré est prioritaire. Six langues: EN, HI, ES, FR, DE et JA. Certains détails et politiques restent en anglais. La conversion est indicative; les montants du paiement restent en USD.",
 DE:'Nutzen Sie die Sprach- und Währungsauswahl im Kopfbereich. Beim ersten Besuch gilt die Browsersprache; Ihre gespeicherte Auswahl hat Vorrang. Sechs Sprachen: EN, HI, ES, FR, DE und JA. Einige Produktdetails und Richtlinien bleiben Englisch. Die Umrechnung dient nur als Referenz; die Zahlungsbeträge bleiben USD.',
 JA:'ストア上部の言語・通貨セレクターを使ってください。初回はブラウザーの言語を使い、保存した選択が優先されます。対応言語は EN、HI、ES、FR、DE、JA です。一部の商品情報と規約は英語のままです。通貨換算は参考表示で、決済金額は USD のままです。',
 }},
 enquiries:{sources:['/user/enquiries','/contact'],copy:{
 EN:'Your signed-in enquiries are at /user/enquiries. Guest enquiries are not attached to an account merely because the email matches. Saving a form means it is in the store inbox, not that staff have read it or will reply by a set time. This chat does not read private enquiries or send replies.',
 HI:'साइन इन करके भेजी गई आपकी पूछताछ /user/enquiries पर है। सिर्फ ईमेल मिलने से अतिथि की पूछताछ खाते से नहीं जुड़ती। फॉर्म सहेजने का मतलब स्टोर इनबॉक्स में दर्ज होना है, न कि टीम ने पढ़ लिया या तय समय पर जवाब देगी। यह चैट निजी पूछताछ पढ़ती या जवाब भेजती नहीं है।',
 ES:'Tus consultas enviadas con sesión iniciada están en /user/enquiries. Las de invitados no se vinculan solo por coincidir el correo. Guardar el formulario no confirma que el equipo lo haya leído ni promete un plazo. Este chat no lee consultas privadas ni envía respuestas.',
 FR:"Vos demandes envoyées après connexion sont sur /user/enquiries. Les demandes invitées ne sont pas liées par simple correspondance d'e-mail. L'enregistrement ne confirme pas la lecture par l'équipe et ne promet aucun délai. Ce chat ne lit pas les demandes privées et n'envoie pas de réponses.",
 DE:'Angemeldet gesendete Anfragen finden Sie unter /user/enquiries. Gastanfragen werden nicht allein wegen gleicher E-Mail zugeordnet. Gespeichert bedeutet nicht gelesen oder eine Antwort innerhalb einer Frist. Dieser Chat liest keine privaten Anfragen und sendet keine Antworten.',
 JA:'サインイン中に送信した問い合わせは /user/enquiries にあります。ゲストの問い合わせはメールが一致するだけではアカウントに紐づきません。保存はチームの既読や期限内の回答を意味しません。このチャットは非公開の問い合わせを読んだり返信したりしません。',
 }},
} satisfies Record<string,{sources:string[];copy:Record<SupportLanguage,string>}>;
export type WorkflowIntent=keyof typeof WORKFLOW_HELP;
export function workflowIntent(text:string):WorkflowIntent|null{
 const q=text.toLowerCase().normalize('NFC');
 if(/forgot|reset|recover|पासवर्ड|password|contraseña|mot de passe|passwort|パスワード/u.test(q))return 'recovery';
 if(/enquir|my (support|ticket|message)|saved (message|request)|पूछताछ|मेरी शिकायत|mes demandes|mis consultas|meine anfragen|問い合わせ履歴|問い合わせを確認/u.test(q))return 'enquiries';
 if(/language|currency|usd|rupee|हिंदी|हिन्दी|भाषा|मुद्रा|रुपये|idioma|moneda|langue|devise|sprache|wahrung|währung|言語|通貨/u.test(q))return 'locale';
 if(/sign[ -]?in|sign[ -]?up|log[ -]?in|register|my account|create.*account|साइन|खाता|अकाउंट|iniciar sesi|registrar|mi cuenta|connexion|inscrire|mon compte|anmeld|registrier|mein konto|サインイン|アカウント|登録/u.test(q))return 'account';
 return null;
}
export function workflowAnswer(intent:WorkflowIntent,language:SupportLanguage):string{return WORKFLOW_HELP[intent].copy[language];}
