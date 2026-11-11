/**
 * Controlled writer for the SupplierFundingApproval journal. This is the ONLY
 * writer path; there is deliberately no HTTP route, server action or admin UI
 * that can create an approval, so no web caller can self-mint spend authority.
 *
 * Running this script asserts that the operator has ALREADY verified, outside
 * this app, the owner's authenticated approval for this exact order, amount
 * and purpose (one CJ supplier balance payment of the exact reviewed quote,
 * single execution, at most one identical-pair retry). The script stores that
 * externally verified authorization; it does not and cannot verify the
 * channel. The evidence reference must identify the verified original (for
 * example the owner message id), never a paraphrase.
 *
 * * CJ_FUNDING_EXECUTION_ENABLED=true DATABASE_URL=<operator-role url> npx ts-node scripts/record-supplier-funding-approval.ts <orderId> <evidenceRef> <operatorId>
 *
 * In production DATABASE_URL must use the existing owner-only operator
 * access (the database owner principal): the app runtime role (omnistu_app)
 * has no INSERT grant on the journal, so an app-side caller cannot write
 * approvals even if it reaches this code. No new database role, membership
 * or login is created for this path.
 */
import { recordSupplierFundingApproval } from '../lib/supplier-funding-execution';
import { prisma } from '../db/prisma';

const [orderId, evidenceRef, operatorId] = process.argv.slice(2);
if (!orderId || !evidenceRef || !operatorId) {
  console.error('Usage: record-supplier-funding-approval.ts <orderId> <evidenceRef> <operatorId>');
  process.exit(1);
}
recordSupplierFundingApproval(orderId, evidenceRef, operatorId)
  .then(async (r) => {
    console.log('Recorded externally verified owner approval:', JSON.stringify(r, null, 2));
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Refused:', e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
