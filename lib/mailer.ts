import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/email/order-confirmation';
import { SENDER_EMAIL, SERVER_URL } from '@/lib/constants';

const resend = new Resend(process.env.RESEND_API_KEY);

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
  if (!process.env.RESEND_API_KEY) {
    console.warn('[mailer] RESEND_API_KEY not set — skipping order confirmation email');
    return;
  }

  try {
    await resend.emails.send({
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
