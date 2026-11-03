'use client';

/**
 * Accessible, persistent feedback shown while a checkout step transition is
 * in flight. Step navigations run a server action plus an RSC navigation,
 * which can take many seconds on a cold function; the small button spinner
 * alone read as a dead click (D12 finding). role=status announces progress
 * politely and the text sets the expectation not to re-click or refresh.
 */
const CheckoutPendingNote = ({ show, label }: { show: boolean; label: string }) => {
  if (!show) return null;
  return (
    <div
      role='status'
      aria-live='polite'
      data-testid='checkout-pending-note'
      className='mt-3 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900'
    >
      <span
        aria-hidden
        className='inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent'
      />
      <span>{label}</span>
    </div>
  );
};

export default CheckoutPendingNote;
