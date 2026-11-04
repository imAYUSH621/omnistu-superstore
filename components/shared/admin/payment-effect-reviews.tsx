export function PaymentEffectReviews({ result }: { result:
  { success: true; items: { id: string; orderId: string; createdAt: string }[]; next: string | null } |
  { success: false; message: string }
}) {
  return (
    <section className='space-y-2 rounded border p-3 text-sm' aria-label='Payment effect evidence'>
      <h2 className='font-semibold'>Post-payment effects: outcomes unconfirmed</h2>
      <p>Passive evidence recorded with the paid transaction. Email, receipt, cloud mirror and supplier dispatch may be disabled, completed, failed or not started. This is not a failure list or permission to resend.</p>
      <p>Check each source before acting. No tasks run, retry, refund or clear from this page.</p>
      {!result.success ? <p role='alert'>{result.message}</p> : result.items.length === 0 ? <p>No passive evidence on this page. Absence does not prove earlier orders completed every effect.</p> : (
        <ul className='space-y-2'>
          {result.items.map(item => <li key={item.id} className='break-words rounded border p-2'>
            <a className='break-all underline' href={`/order/${item.orderId}`}>{item.orderId}</a>
            <p>Recorded: {item.createdAt.slice(0, 19).replace('T', ' ')} UTC</p>
            <p>Review only. Outcomes not verified.</p>
          </li>)}
        </ul>
      )}
      {result.success && result.next && <a className='inline-block underline' href={`/admin/reconciliation?effectsAfter=${result.next}`}>Next evidence page</a>}
    </section>
  );
}
