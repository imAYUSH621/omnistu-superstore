import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationEmailProps {
  customerName: string;
  orderId: string;
  orderDate: string;
  items: { name: string; quantity: number; price: string; image?: string }[];
  subtotal: string;
  shipping: string;
  total: string;
  trackingUrl: string;
  serverUrl?: string;
}

export const OrderConfirmationEmail = ({
  customerName = 'Valued Customer',
  orderId = 'OMN-XXXXXX',
  orderDate = new Date().toLocaleDateString(),
  items = [],
  subtotal = '$0.00',
  shipping = 'FREE',
  total = '$0.00',
  trackingUrl = 'https://omnistu-superstore.vercel.app/track',
  serverUrl = 'https://omnistu-superstore.vercel.app',
}: OrderConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Omnistu order {orderId} is confirmed! ✅</Preview>
    <Body style={{ backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Header */}
        <Section style={{ backgroundColor: '#131921', padding: '20px 30px', textAlign: 'center' as const }}>
          <Heading style={{ color: '#febd69', margin: 0, fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>
            OMNISTU⬩DIRECT
          </Heading>
          <Text style={{ color: '#ccc', margin: '4px 0 0', fontSize: '12px' }}>
            Your order is confirmed 🎉
          </Text>
        </Section>

        {/* Body */}
        <Section style={{ padding: '30px' }}>
          <Heading as="h2" style={{ fontSize: '20px', color: '#131921' }}>
            Hi {customerName},
          </Heading>
          <Text style={{ color: '#555', lineHeight: '1.6' }}>
            Thank you for your order! We&apos;ve received your order and it&apos;s being processed.
            You&apos;ll receive a shipping confirmation once your items are on their way.
          </Text>

          <Hr style={{ borderColor: '#eee', margin: '20px 0' }} />

          <Text style={{ fontSize: '14px', color: '#888', margin: '0 0 4px' }}>Order Number</Text>
          <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#131921', margin: '0 0 20px' }}>
            {orderId}
          </Text>
          <Text style={{ fontSize: '13px', color: '#888' }}>Placed on {orderDate}</Text>

          <Hr style={{ borderColor: '#eee', margin: '20px 0' }} />

          {/* Items */}
          <Heading as="h3" style={{ fontSize: '16px', color: '#131921' }}>Order Summary</Heading>
          {items.map((item, i) => (
            <Row key={i} style={{ marginBottom: '12px' }}>
              <Section style={{ display: 'flex', justifyContent: 'space-between' as const }}>
                <Text style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                  {item.name} × {item.quantity}
                </Text>
                <Text style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#131921' }}>
                  {item.price}
                </Text>
              </Section>
            </Row>
          ))}

          <Hr style={{ borderColor: '#eee', margin: '16px 0' }} />

          <Row>
            <Section style={{ display: 'flex', justifyContent: 'space-between' as const }}>
              <Text style={{ margin: '4px 0', color: '#555' }}>Subtotal</Text>
              <Text style={{ margin: '4px 0', color: '#555' }}>{subtotal}</Text>
            </Section>
          </Row>
          <Row>
            <Section style={{ display: 'flex', justifyContent: 'space-between' as const }}>
              <Text style={{ margin: '4px 0', color: '#555' }}>Shipping</Text>
              <Text style={{ margin: '4px 0', color: '#007600', fontWeight: 'bold' }}>{shipping}</Text>
            </Section>
          </Row>
          <Row>
            <Section style={{ display: 'flex', justifyContent: 'space-between' as const }}>
              <Text style={{ margin: '8px 0', fontWeight: 'bold', fontSize: '16px', color: '#131921' }}>Total</Text>
              <Text style={{ margin: '8px 0', fontWeight: 'bold', fontSize: '16px', color: '#131921' }}>{total}</Text>
            </Section>
          </Row>

          <Hr style={{ borderColor: '#eee', margin: '20px 0' }} />

          <Button
            href={trackingUrl}
            style={{
              backgroundColor: '#febd69',
              color: '#131921',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Track Your Order →
          </Button>
        </Section>

        {/* Footer */}
        <Section style={{ backgroundColor: '#f7f7f7', padding: '20px 30px', textAlign: 'center' as const, borderTop: '1px solid #eee' }}>
          <Text style={{ fontSize: '12px', color: '#888', margin: '4px 0' }}>
            Questions? Contact us at support@omnistu.com
          </Text>
          <Text style={{ fontSize: '11px', color: '#aaa', margin: '8px 0 0' }}>
            © 2026 Omnistu Superstore. 548 Market St, Suite 38000, San Francisco, CA 94104
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default OrderConfirmationEmail;
