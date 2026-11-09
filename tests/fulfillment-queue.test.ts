/**
 * G7: safe retry/exception queue - dedupe, backoff, exception capture,
 * manual-only processing, no provider calls.
 */

const mockFindFirst = jest.fn();
const mockFindUniqueOrThrow = jest.fn();
const mockFindMany = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateMany = jest.fn();
const mockQuery = jest.fn();

jest.mock('@/db/prisma', () => ({
  prisma: {
    $queryRawUnsafe: (...a: unknown[]) => mockQuery(...a),
    $transaction: (fn: (tx: unknown) => unknown) => fn({$queryRawUnsafe: (...a: unknown[]) => mockQuery(...a), fulfillmentTask: {findFirst: (...a: unknown[]) => mockFindFirst(...a),create: (...a: unknown[]) => mockCreate(...a)}}),
    fulfillmentTask: {
      findFirst: (...a: unknown[]) => mockFindFirst(...a),
      findUniqueOrThrow: (...a: unknown[]) => mockFindUniqueOrThrow(...a),
      findMany: (...a: unknown[]) => mockFindMany(...a),
      create: (...a: unknown[]) => mockCreate(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
      updateMany: (...a: unknown[]) => mockUpdateMany(...a),
    },
  },
}));

import {
  enqueueFulfillmentTask, recordTaskFailure, recordTaskSuccess,
  processDueFulfillmentTasks, dueFulfillmentTasks, backoffMs, FULFILLMENT_QUEUE_AUTONOMY,
} from '@/lib/fulfillment-queue';

beforeEach(() => {jest.clearAllMocks();mockUpdateMany.mockResolvedValue({count:1});});

describe('backoff math', () => {
  it('grows exponentially and caps at one hour', () => {
    expect(backoffMs(0)).toBe(60_000);
    expect(backoffMs(1)).toBe(120_000);
    expect(backoffMs(2)).toBe(240_000);
    expect(backoffMs(20)).toBe(3_600_000);
  });
});

describe('enqueue dedupe', () => {
  it('returns the existing active task instead of duplicating', async () => {
    mockFindFirst.mockResolvedValueOnce({ id: 't-1' });
    const r = await enqueueFulfillmentTask({ orderId: 'o1', supplier: 'CJ', payload: {} });
    expect(r).toEqual({ id: 't-1', deduplicated: true });
    expect(mockCreate).not.toHaveBeenCalled();
  });
  it('creates a new task when none is active', async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({ id: 't-2' });
    const r = await enqueueFulfillmentTask({ orderId: 'o1', supplier: 'CJ', payload: {} });
    expect(r).toEqual({ id: 't-2', deduplicated: false });
  });
});

describe('failure handling', () => {
  it('retries with backoff below maxAttempts', async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({ id: 't-3', attempts: 1, maxAttempts: 5 });
    const r = await recordTaskFailure('t-3', 'timeout');
    expect(r.status).toBe('RETRYING');
    expect(r.nextAttemptAt!.getTime()).toBeGreaterThan(Date.now() + 100_000);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'RETRYING', attempts: 2, lastError: 'timeout' }),
    }));
  });
  it('captures an exception after maxAttempts instead of retrying forever', async () => {
    mockFindUniqueOrThrow.mockResolvedValueOnce({ id: 't-4', attempts: 4, maxAttempts: 5 });
    const r = await recordTaskFailure('t-4', 'supplier 500');
    expect(r.status).toBe('FAILED_EXCEPTION');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED_EXCEPTION', attempts: 5, lastError: 'supplier 500' }),
    }));
  });
});

describe('autonomy boundary', () => {
  it('is compiled OFF and refuses to run without explicit allowRun', async () => {
    expect(FULFILLMENT_QUEUE_AUTONOMY).toBe(false);
    const runner = jest.fn();
    const r = await processDueFulfillmentTasks(runner, { allowRun: false });
    expect(r.skipped).toBe(true);
    expect(runner).not.toHaveBeenCalled();
    expect(mockFindMany).not.toHaveBeenCalled();
  });
  it('runs due tasks only when manually allowed, capturing failures', async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: 't-5', orderId: 'o1', supplier: 'CJ', payload: {}, attempts: 0, maxAttempts: 5 },
      { id: 't-6', orderId: 'o2', supplier: 'PRINTIFY', payload: {}, attempts: 0, maxAttempts: 5 },
    ]);
    mockFindUniqueOrThrow.mockResolvedValue({ id: 't-6', attempts: 0, maxAttempts: 5 });
    const runner = jest.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('boom'));
    const r = await processDueFulfillmentTasks(runner, { allowRun: true });
    expect(r).toEqual({ skipped: false, processed: 1, failed: 1 });
    expect(runner).toHaveBeenCalledTimes(2);
  });
});

describe('no provider calls (source scan)', () => {
  it('queue module imports no dispatcher/supplier client and does no fetch', () => {
    const src = require('fs').readFileSync('lib/fulfillment-queue.ts', 'utf8');
    expect(src).not.toMatch(/fulfillment-dispatcher/);
    expect(src).not.toMatch(/fetch\(/);
    expect(src).not.toMatch(/printify|cjdropshipping|blanka|brandsgateway/i);
  });
});


describe('manual claim boundaries',()=>{
 it('does not run a row when another drain already claimed it',async()=>{mockFindMany.mockResolvedValueOnce([{id:'t-claimed'}]);mockUpdateMany.mockResolvedValueOnce({count:0});const runner=jest.fn();expect(await processDueFulfillmentTasks(runner,{allowRun:true,limit:1})).toMatchObject({processed:0,failed:0});expect(runner).not.toHaveBeenCalled();expect(mockUpdate).not.toHaveBeenCalled()});
 it.each([0,-1,1.5,101,NaN,Infinity])('rejects unsafe due-row limit %s before a query',async limit=>{await expect(dueFulfillmentTasks(new Date(),limit)).rejects.toThrow('INVALID_QUEUE_BOUNDS');expect(mockFindMany).not.toHaveBeenCalled()});
 it('rejects invalid due time before a query',async()=>{await expect(dueFulfillmentTasks(new Date(NaN),1)).rejects.toThrow('INVALID_QUEUE_BOUNDS');expect(mockFindMany).not.toHaveBeenCalled()});
});
