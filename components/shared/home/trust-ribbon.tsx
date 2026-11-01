import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';
import T from '@/components/shared/i18n-text';

export default function TrustRibbon() {
  const perks = [
    { icon: Truck, titleKey: 'trustShippingTitle', descKey: 'trustShippingDesc' },
    { icon: RotateCcw, titleKey: 'trustLookupTitle', descKey: 'trustLookupDesc' },
    { icon: ShieldCheck, titleKey: 'trustCheckoutTitle', descKey: 'trustCheckoutDesc' },
    { icon: Headphones, titleKey: 'trustSupportTitle', descKey: 'trustSupportDesc' },
  ] as const;

  return (
    <div className='rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 p-4'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {perks.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.titleKey} className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0'>
                <Icon className='w-5 h-5' />
              </div>
              <div className='min-w-0'>
                <h4 className='text-xs font-bold text-foreground truncate'>
                  <T k={p.titleKey} />
                </h4>
                <p className='text-[11px] text-muted-foreground truncate'>
                  <T k={p.descKey} />
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
