import { getAllProducts } from '../lib/actions/product.actions';
import { PAGE_SIZE } from '../lib/constants';
import { prisma } from '../db/prisma';

jest.mock('../lib/utils', () => ({ ...jest.requireActual('../lib/utils'), isDatabaseAvailable: () => true }));
jest.mock('../db/prisma', () => ({ prisma: { $queryRaw: jest.fn(), product: { findMany: jest.fn() } } }));

test('invalid numeric inputs never reach SQL; pagination is integral and bounded', async () => {
  const raw = prisma.$queryRaw as jest.Mock;
  raw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ c: BigInt(0) }]);
  (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
  await getAllProducts({ query: 'all', page: NaN, limit: Infinity, price: 'NaN-25', rating: 'Infinity' });
  const values = raw.mock.calls[0].slice(1);
  expect(values.slice(-2)).toEqual([PAGE_SIZE, 0]);
  expect(values.some((v: unknown) => typeof v === 'number' && !Number.isFinite(v))).toBe(false);
});

test('failed catalog query logs only fixed text, not source snippets or user content', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('SELECT secret connection-string user query'));
  await getAllProducts({ query: 'all', page: 1 });
  expect(warn).toHaveBeenCalledWith('Catalog product search failed');
  expect(JSON.stringify(warn.mock.calls)).not.toContain('connection-string');
  warn.mockRestore();
});
