// Store knowledge for the shopping assistant.
//
// Only verified, operative facts live here: things that are true about how the
// store works today (how to reach the team, where order status appears, what
// the assistant can and cannot do). Commercial policy terms - shipping
// timeframes, return windows, refund eligibility, guarantees - are NOT here.
// The owner has not approved final policy terms, so the assistant must say
// they are not confirmable and route the customer to the team instead of
// quoting draft page copy as fact. When a policy is approved, add it here as
// its own chunk with the approval source in a comment.

export type KnowledgeChunk = {
  id: string;
  /** Lowercase trigger words used for retrieval scoring. */
  keywords: string[];
  /** Facts the assistant may state. Keep verbatim-safe: no promises beyond the words here. */
  text: string;
  /** On-site path the customer can open. On-site only, never an external URL. */
  link?: string;
};

export const STORE_KNOWLEDGE: KnowledgeChunk[] = [
  {
    id: 'contact-team',
    keywords: [
      'contact', 'support', 'help', 'human', 'agent', 'person', 'email',
      'talk', 'someone', 'team', 'complaint', 'problem', 'issue', 'question',
    ],
    text:
      'Customers reach the Omnistu team through the contact form at /contact (name, email and message). ' +
      'The form itself states clearly if email delivery is not configured yet. ' +
      'Suggest including the order number when the question is about an order. Never promise a reply time.',
    link: '/contact',
  },
  {
    id: 'order-status',
    keywords: [
      'order', 'status', 'track', 'tracking', 'package', 'parcel',
      'shipped', 'dispatch', 'dispatched',
    ],
    text:
      'Signed-in customers can open their order page to see the order status; a carrier and tracking ' +
      'number appear there once the order has been dispatched. The assistant does not retrieve order ' +
      'details; for anything the customer cannot see on their order page, the team can help via /contact.',
    link: '/contact',
  },
  {
    id: 'policies-pending',
    keywords: [
      'shipping', 'ship', 'delivery', 'deliver', 'delivered', 'days', 'arrive', 'arrival',
      'return', 'returns', 'refund', 'refunds', 'replace', 'replacement', 'exchange',
      'warranty', 'guarantee', 'policy', 'policies', 'damaged', 'broken', 'defective',
      'lost', 'wrong', 'customs', 'duties',
    ],
    text:
      'Shipping timeframes, return windows, refund eligibility and guarantees are being finalised for ' +
      'launch and are NOT confirmable right now. Do not quote numbers of days, amounts or promises ' +
      'from anywhere, including the store policy pages. For an order-specific answer, direct the ' +
      'customer to the team via /contact.',
    link: '/contact',
  },
  {
    id: 'assistant-limits',
    keywords: [
      'cancel', 'cancellation', 'change', 'modify', 'discount', 'coupon',
      'code', 'offer', 'deal', 'price', 'refund', 'cancel',
    ],
    text:
      'You cannot issue refunds, replacements, cancellations, order changes or discount codes, and ' +
      'there are no discount codes you may offer. All of those go to the team via /contact.',
    link: '/contact',
  },
];

/** Score chunks by distinct keyword hits and return the best few, formatted for the system prompt. */
export function findStoreKnowledge(query: string, maxChunks = 2): string {
  const words = new Set(query.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  if (!words.size) return '';
  return STORE_KNOWLEDGE.map((c) => ({
    c,
    score: c.keywords.filter((k) => words.has(k)).length,
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map(({ c }) => `- ${c.text}${c.link ? ` (link: ${c.link})` : ''}`)
    .join('\n');
}
