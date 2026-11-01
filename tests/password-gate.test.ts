import * as nodeCrypto from 'node:crypto';

jest.mock('node:crypto', () => {
  const actual = jest.requireActual('node:crypto');
  return { ...actual, scrypt: jest.fn(actual.scrypt) };
});
import { createGate, HashBusyError, dummyVerify, hashPassword, verifyPassword } from '@/lib/password';

const tick = () => new Promise((r) => setTimeout(r, 5));

describe('createGate', () => {
  it('runs at most maxActive at once, queues up to maxQueue, rejects beyond', async () => {
    const run = createGate(2, 2);
    let active = 0;
    let peak = 0;
    const release: Array<() => void> = [];
    const job = () =>
      run(async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise<void>((r) => release.push(r));
        active--;
        return 'ok';
      });
    const jobs = [job(), job(), job(), job()]; // 2 active + 2 queued
    await tick();
    expect(release.length).toBe(2); // only two started
    await expect(job()).rejects.toBeInstanceOf(HashBusyError); // queue full
    for (let i = 0; i < 10; i++) {
      release.splice(0).forEach((r) => r());
      await tick();
    }
    expect(peak).toBe(2);
    await expect(Promise.all(jobs)).resolves.toEqual(['ok', 'ok', 'ok', 'ok']);
  });
  it('frees capacity after a job throws', async () => {
    const run = createGate(1, 0);
    await expect(run(async () => { throw new Error('x'); })).rejects.toThrow('x');
    await expect(run(async () => 'fine')).resolves.toBe('fine');
  });
});

describe('dummyVerify', () => {
  it('does real scrypt work (so unknown emails cost like known ones)', async () => {
    const spy = nodeCrypto.scrypt as unknown as jest.Mock;
    spy.mockClear();
    await dummyVerify('whatever');
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('real hashing still verifies', async () => {
    const h = await hashPassword('Correct-horse-1');
    expect((await verifyPassword('Correct-horse-1', h)).ok).toBe(true);
    expect((await verifyPassword('wrong', h)).ok).toBe(false);
  });
});
