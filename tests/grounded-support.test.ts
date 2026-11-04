jest.mock('@/lib/chat', () => ({ findProducts: jest.fn().mockResolvedValue('') }));
jest.mock('@/lib/actions/product.actions', () => ({ getAllCategories: jest.fn().mockResolvedValue([]) }));
import { groundedSupportAnswer, SUPPORT_LABEL } from '@/lib/grounded-support';
import { findProducts } from '@/lib/chat';
import { getAllCategories } from '@/lib/actions/product.actions';
const original = { ...process.env };
afterEach(() => { process.env = { ...original }; jest.clearAllMocks(); });
it('every branch labels non-AI public store help', async () => {
 for (const q of ['hello', 'track order', 'refund', 'contact support', 'payment', 'shipping date', 'categories', 'shirt']) expect((await groundedSupportAnswer(q)).startsWith(SUPPORT_LABEL)).toBe(true);
});
it('never pretends to send a ticket or inspect an order', async () => { expect(await groundedSupportAnswer('contact support')).toContain('have not sent');expect(await groundedSupportAnswer('track my order SECRET')).toContain('No order status has been checked');expect(findProducts).not.toHaveBeenCalled(); });
it('does not promise unapproved policies or returns', async () => {const a=await groundedSupportAnswer('refund within 30 days');expect(a).toContain('cannot confirm');expect(a).not.toContain('30');});
it('reports closed checkout rather than simulated as default', async () => {Object.assign(process.env,{NODE_ENV:'production',ORDERS_ENABLED:'false',TEST_CHECKOUT_MODE:'false'});expect(await groundedSupportAnswer('payment')).toContain('not available yet');});
it('test checkout remains explicitly simulated',async()=>{process.env.TEST_CHECKOUT_MODE='true';expect(await groundedSupportAnswer('payment')).toContain('no real charge');});
it('categories with no listings never invent available products',async()=>{expect(await groundedSupportAnswer('categories')).toContain('planned categories');});
it('uses current category retrieval, not supplier APIs',async()=>{(getAllCategories as jest.Mock).mockResolvedValueOnce([{category:'Apparel',_count:2}]);expect(await groundedSupportAnswer('categories')).toContain('Apparel (2)');});
it('product matches preserve catalog links not buy promises',async()=>{(findProducts as jest.Mock).mockResolvedValueOnce('- Shirt | price: $10.00 | link: /product/shirt');const a=await groundedSupportAnswer('shirt');expect(a).toContain('/product/shirt');expect(a).toContain('No purchase or delivery promise');});
