import {renderToStaticMarkup} from 'react-dom/server';import SupportMessage from '@/components/shared/support-message';
it('makes grounded internal routes usable',()=>{const html=renderToStaticMarkup(<SupportMessage text={'Open /contact or /user/orders or /product/shirt-1.'}/>);expect(html).toContain('href="/contact"');expect(html).toContain('href="/product/shirt-1"');});
it('never links external or unrelated paths',()=>{const html=renderToStaticMarkup(<SupportMessage text={'https://evil.test /admin/users /api/fulfillment'}/>);expect(html).not.toContain('<a');});
