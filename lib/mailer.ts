import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/email/order-confirmation';
import { SENDER_EMAIL, SERVER_URL } from '@/lib/constants';

let resend: Resend | null = null;

// Lazy: constructing Resend without a key throws, which crashed `next build`
// page-data collection whenever RESEND_API_KEY was absent (D13).
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  orderDate: string;
  items: { name: string; quantity: number; price: string }[];
  subtotal: string;
  shipping: string;
  total: string;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn('[mailer] RESEND_API_KEY not set — skipping order confirmation email');
    return;
  }

  try {
    await client.emails.send({
      from: `Omnistu Superstore <${SENDER_EMAIL}>`,
      to: [data.customerEmail],
      subject: `✅ Order Confirmed: ${data.orderId} — Omnistu Direct`,
      react: OrderConfirmationEmail({
        ...data,
        trackingUrl: `${SERVER_URL}/track?order_id=${data.orderId}`,
        serverUrl: SERVER_URL,
      }),
    });
    console.log(`[mailer] Order confirmation sent to ${data.customerEmail} for order ${data.orderId}`);
  } catch (err) {
    // Non-fatal: log but don't crash the order flow
    console.error('[mailer] Failed to send order confirmation:', err instanceof Error ? err.message : String(err));
  }
}
