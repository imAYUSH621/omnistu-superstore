import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';

export default function TrustRibbon() {
  const perks = [
    {
      icon: Truck,
      title: 'Free Express Shipping',
      desc: 'Next-day delivery on eligible items',
    },
    {
      icon: RotateCcw,
      title: '30-Day Money-Back',
      desc: 'Hassle-free return & replacement',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Checkout',
      desc: '256-bit encryption (Stripe / PayPal)',
    },
    {
      icon: Headphones,
      title: '24/7 Dedicated Care',
      desc: 'Expert support anytime you need',
    },
  ];

  return (
    <div className='my-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 p-4'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {perks.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div key={idx} className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0'>
                <Icon className='w-5 h-5' />
              </div>
              <div className='min-w-0'>
                <h4 className='text-xs font-bold text-foreground truncate'>
                  {p.title}
                </h4>
                <p className='text-[11px] text-muted-foreground truncate'>
                  {p.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
