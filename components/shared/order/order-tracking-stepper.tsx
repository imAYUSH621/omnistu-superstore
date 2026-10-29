import { CheckCircle2, Clock, PackageCheck, Truck, Home } from 'lucide-react';

interface OrderTrackingProps {
  orderId: string;
  isPaid?: boolean;
  isDelivered?: boolean;
  createdAt?: Date | string;
}

export default function OrderTrackingStepper({
  orderId,
  isPaid = true,
  isDelivered = false,
  createdAt,
}: OrderTrackingProps) {
  // Format formatted Amazon-style order ID if it's a UUID
  const formattedId = orderId.length > 15
    ? `#114-${orderId.slice(0, 7)}-${orderId.slice(-7)}`
    : `#114-${orderId}`;

  const steps = [
    {
      title: 'Order Placed',
      desc: createdAt ? `Confirmed (${new Date(createdAt).toLocaleDateString()})` : isPaid ? 'Payment Confirmed' : 'Payment Pending',
      completed: true,
      icon: CheckCircle2,
    },
    {
      title: 'Processing',
      desc: 'Assigned to Fulfillment',
      completed: isPaid,
      icon: PackageCheck,
    },
    {
      title: 'Shipped',
      desc: isDelivered ? 'Carrier Transit Complete' : 'In Transit via Express',
      completed: isPaid && isDelivered,
      icon: Truck,
    },
    {
      title: 'Delivered',
      desc: isDelivered ? 'Package Delivered' : 'Estimated Tomorrow by 8 PM',
      completed: isDelivered,
      icon: Home,
    },
  ];

  return (
    <div className='p-6 rounded-2xl bg-card border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6'>
      {/* Header Banner */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800'>
        <div>
          <span className='text-xs uppercase tracking-wider text-muted-foreground font-semibold'>
            Order Telemetry
          </span>
          <h3 className='text-lg font-bold text-foreground'>
            Order ID: <span className='text-emerald-600 font-mono'>{formattedId}</span>
          </h3>
        </div>
        <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300'>
          <Truck className='w-4 h-4 text-emerald-600' />
          <span>Guaranteed Next-Day Express Delivery</span>
        </div>
      </div>

      {/* 4-Step Stepper Line */}
      <div className='relative py-4'>
        {/* Background Connecting Line */}
        <div className='absolute top-9 left-8 right-8 h-1 bg-neutral-200 dark:bg-neutral-800 -translate-y-1/2 z-0' />
        {/* Progress Fill Line */}
        <div
          className='absolute top-9 left-8 h-1 bg-emerald-600 -translate-y-1/2 transition-all duration-500 z-0'
          style={{ width: isDelivered ? 'calc(100% - 4rem)' : isPaid ? '50%' : '15%' }}
        />

        <div className='grid grid-cols-4 relative z-10 text-center gap-2'>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className='flex flex-col items-center space-y-2'>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-200 shadow-sm ${
                    step.completed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 text-muted-foreground'
                  }`}
                >
                  <Icon className='w-5 h-5' />
                </div>
                <div className='space-y-0.5'>
                  <p className='text-xs font-bold text-foreground'>{step.title}</p>
                  <p className='text-[10px] text-muted-foreground hidden sm:block'>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Status Card */}
      <div className='bg-neutral-50 dark:bg-neutral-900/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs'>
        <div className='space-y-0.5'>
          <p className='font-semibold text-foreground flex items-center gap-1.5'>
            <Clock className='w-3.5 h-3.5 text-amber-500' />
            Carrier Status: In Transit
          </p>
          <p className='text-muted-foreground'>
            Dispatched via <strong className='text-foreground'>Omnistu Express Priority (Tracking #OMN-98421094)</strong>
          </p>
        </div>
        <button
          type='button'
          className='px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-medium text-foreground'
        >
          Live Map Tracking &rarr;
        </button>
      </div>
    </div>
  );
}
