import { realPaidOrderWhere, realPaidOrderSql } from '@/lib/real-sales';
import { execFileSync } from 'child_process';

it('uses the same explicit simulation exclusions in Prisma and SQL, preserving nullable real fields', () => {
  expect(realPaidOrderWhere).toMatchObject({ isPaid: true, paymentMethod: { not: 'TestPayment' } });
  expect(JSON.stringify(realPaidOrderWhere)).toContain('QUALIFIED TEST ONLY');
  expect(JSON.stringify(realPaidOrderWhere)).toContain('TEST_ONLY');
  expect(realPaidOrderSql.sql).toContain('"paymentNote" IS NULL');
  expect(realPaidOrderSql.sql).toContain('"dispatchStatus" IS NULL');
});

// Optional actual SQL semantics, restricted to an explicitly supplied disposable
// localhost database. It creates only a TEMP table in a rolled-back transaction.
const url = process.env.REAL_SALES_ITEST_DATABASE_URL;
const run = url && /^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):/.test(url) ? test : test.skip;
run('mixed real and simulated rows contribute only real paid amounts', () => {
  const sql = `BEGIN;
    CREATE TEMP TABLE sales_reference ("isPaid" boolean,"paymentMethod" text,"paymentNote" text,"dispatchStatus" text,"totalPrice" numeric);
    INSERT INTO sales_reference VALUES
      (true,'PayPal',NULL,NULL,20),
      (true,'Stripe','Captured','DISPATCHED',30),
      (false,'PayPal',NULL,NULL,99),
      (true,'TestPayment','TEST MODE: simulated payment',NULL,1000),
      (true,'PayPal','QUALIFIED TEST ONLY synthetic','TEST_ONLY',2000),
      (true,'Stripe',NULL,'TEST_ONLY',3000);
    SELECT COALESCE(sum("totalPrice"),0) FROM sales_reference WHERE ${realPaidOrderSql.sql};
    ROLLBACK;`;
  const out = execFileSync('psql', ['-X','-At','-v','ON_ERROR_STOP=1','-d',url!], { input: sql, encoding: 'utf8' });
  expect(out.split('\n')).toContain('50');
});
