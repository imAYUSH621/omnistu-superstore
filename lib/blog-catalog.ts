/**
 * Omnistu blog articles (data only).
 *
 * Editorial rules: practical, claim-free articles. NO client names, results,
 * counts, rankings or guarantees. Articles are general guidance, not advice
 * about Omnistu's own performance. Owner review of article copy is pending;
 * edit this file to change what /blog shows. Bodies are English for now.
 */
export interface BlogArticle {
  slug: string;
  title: string;
  summary: string;
  /** ISO date shown on the article. */
  date: string;
  /** Paragraphs and section headings in display order. */
  body: ({ kind: 'h2' | 'p'; text: string })[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'prepare-business-website',
    title: 'What to prepare before you commission a business website',
    summary:
      'A short checklist that makes any website project faster and cheaper: goals, content, brand assets, and the decisions only you can make.',
    date: '2026-11-03',
    body: [
      {
        kind: 'p',
        text: 'Most website projects slow down for the same reason: the work is ready to start, but the inputs are not. A little preparation before you talk to a developer or agency changes the quality of every quote and every timeline you receive.',
      },
      { kind: 'h2', text: 'Write down the job the site must do' },
      {
        kind: 'p',
        text: 'One sentence is enough: "get enquiries for our services", "sell these products online", or "explain what we do and build trust". Every page and feature should trace back to that sentence. If a feature does not serve it, you probably do not need it in version one.',
      },
      { kind: 'h2', text: 'Gather your content before design starts' },
      {
        kind: 'p',
        text: 'Real text and real photos beat placeholders. Collect your service descriptions, product details, prices where you are ready to show them, and any photos you own. Design built around real content fits; design built around placeholders gets redone.',
      },
      { kind: 'h2', text: 'Decide who answers email and enquiries' },
      {
        kind: 'p',
        text: 'A contact form is only useful if someone reads what it sends. Decide which address receives enquiries and who replies, and make sure that mailbox actually works before launch day.',
      },
      { kind: 'h2', text: 'Keep the legal basics ready' },
      {
        kind: 'p',
        text: 'If you sell or collect enquiries, you will need a privacy notice and clear terms. They do not need to be long, but they must be true: say what you actually do with customer information, and only promise the delivery, refund and support terms you can honour.',
      },
      {
        kind: 'p',
        text: 'With these four things settled, a first version of a business site can be small, honest, and live quickly - and grow when the real business asks for more.',
      },
    ],
  },
  {
    slug: 'own-store-vs-marketplace',
    title: 'Selling through your own store vs a marketplace: the practical differences',
    summary:
      'Marketplaces bring shoppers to you but keep the customer relationship. Your own store is more work and more control. Here is how to think about the trade-off.',
    date: '2026-11-03',
    body: [
      {
        kind: 'p',
        text: 'A marketplace gives you shelf space in a shop that already has footfall. Your own store gives you the whole shop, including the work of bringing people to it. Neither is automatically better; the right choice depends on what you are selling and how you want to grow.',
      },
      { kind: 'h2', text: 'What a marketplace does for you' },
      {
        kind: 'p',
        text: 'Marketplaces handle discovery, payments and a baseline of buyer trust. In return they charge fees on each sale, set rules you cannot change, and usually keep the direct relationship with the customer. Your listing can also be delisted or undercut at any time.',
      },
      { kind: 'h2', text: 'What your own store does for you' },
      {
        kind: 'p',
        text: 'On your own store you control pricing, presentation, policies and the customer relationship, including the ability to contact past buyers within the terms of your privacy notice. The costs are real too: you are responsible for traffic, payments, security and support.',
      },
      { kind: 'h2', text: 'A practical way to decide' },
      {
        kind: 'p',
        text: 'Many sellers use both: a marketplace for reach, and their own store for repeat customers and brand. If you are starting out, pick the channel that matches where your buyers already look for your product, then add the other when the first one is stable.',
      },
    ],
  },
  {
    slug: 'how-dropshipping-fulfilment-works',
    title: 'How dropshipping fulfilment works, and what to check before relying on it',
    summary:
      'In dropshipping, a supplier ships directly to your customer. That removes the need to hold stock - and adds new risks of its own. Here is what to verify before you build a store on it.',
    date: '2026-11-03',
    body: [
      {
        kind: 'p',
        text: 'With dropshipping, your store lists products held by a supplier. When a customer orders, you pass the order to the supplier, who packs and ships it directly to the customer. You never hold stock - which is both the advantage and the risk.',
      },
      { kind: 'h2', text: 'What you no longer control' },
      {
        kind: 'p',
        text: 'Dispatch time, packaging quality and stock accuracy sit with the supplier. If their catalogue says "in stock" and is wrong, your customer blames your store. Shipping times from overseas suppliers can be long and variable, so your store policies must say so honestly.',
      },
      { kind: 'h2', text: 'What to check before committing' },
      {
        kind: 'p',
        text: 'Order a sample of anything you plan to sell. Check the supplier\'s stated dispatch and delivery windows against reality, read their dispute and refund process, and confirm what happens when an item goes out of stock after you have sold it. Keep supplier prices and shipping fees in a spreadsheet you update - margins in dropshipping are thin and change without notice.',
      },
      { kind: 'h2', text: 'Set customer expectations in writing' },
      {
        kind: 'p',
        text: 'Publish delivery windows that reflect the supplier\'s real performance, state how returns work when items ship from abroad, and answer tracking questions quickly. Stores that over-promise delivery times lose more to refunds and disputes than they gain in conversion.',
      },
    ],
  },
];

export function getArticle(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((a) => a.slug === slug);
}
