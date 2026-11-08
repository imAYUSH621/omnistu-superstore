import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RefundPage, { metadata as refundMetadata } from '@/app/(root)/refund-policy/page';
import ReturnsPage, { metadata as returnsMetadata } from '@/app/(root)/returns/page';
import PrivacyPage, { metadata as privacyMetadata } from '@/app/(root)/privacy/page';

function copy(Page: () => React.JSX.Element) {
  return renderToStaticMarkup(React.createElement(Page));
}

describe('public test-mode information', () => {
  it('keeps both public return URLs on identical neutral terms', () => {
    expect(ReturnsPage).toBe(RefundPage);
    expect(returnsMetadata).toBe(refundMetadata);
    expect(copy(ReturnsPage)).toBe(copy(RefundPage));
    expect(copy(ReturnsPage)).toContain('Returns and refunds are not active');
  });

  it('does not restore unapproved refund guarantees in either route or metadata', () => {
    for (const Page of [ReturnsPage, RefundPage]) {
      expect(copy(Page)).not.toMatch(/30.day|money.back guarantee|immediate free replacement|3 to 5 business days/i);
    }
    expect(JSON.stringify(returnsMetadata)).not.toMatch(/hassle.free|30.day/i);
  });

  it('explains retained account data without claiming an anonymous sandbox', () => {
    const html = copy(PrivacyPage);
    expect(html).toContain('not an anonymous sandbox');
    expect(html).toContain('does not erase your account');
    expect(html).toContain('Do not enter card numbers');
    expect(html).toContain('Live checkout, customer confirmation emails and supplier dispatch are not active');
  });

  it('does not claim global legal compliance, invented security or active simulated payment', () => {
    const html = copy(PrivacyPage) + JSON.stringify(privacyMetadata);
    expect(html).not.toMatch(/effective immediately|GDPR|CCPA|DPDP|TLS 1.3|Cloudflare|strict role.based data isolation|currently runs a simulated/i);
    expect(html).toContain('cannot delete or anonymize an account');
    expect(html).toContain('contact page can save an enquiry in the store inbox');
    expect(html).toContain('saving is not proof that the team has read, answered or processed');
  });
});
