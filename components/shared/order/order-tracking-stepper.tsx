'use client';
import { CheckCircle2, Clock, PackageCheck, Truck, Home } from 'lucide-react';
import { buildOrderTrackingView } from '@/lib/tracking';
import { displayedOrderId } from '@/lib/order-simulation';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {ORDER_DETAIL_COPY} from '@/lib/order-detail-language';

interface OrderTrackingProps {
  orderId: string;
  simulated?: boolean;
  isPaid?: boolean;
  isDelivered?: boolean;
  createdAt?: Date | string;
  dispatchStatus?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  dispatchedAt?: Date | string | null;
}

export default function OrderTrackingStepper(props: OrderTrackingProps) {
  const language=useStoreLanguage(),copy=ORDER_DETAIL_COPY[language];
  const { orderId, isPaid = true, isDelivered = false } = props;
  const formattedId = displayedOrderId(orderId);

  const view = buildOrderTrackingView({
    language,
    simulated: props.simulated,
    isPaid,
    isDelivered,
    createdAt: props.createdAt,
    dispatchStatus: props.dispatchStatus,
    trackingNumber: props.trackingNumber,
    trackingCarrier: props.trackingCarrier,
    dispatchedAt: props.dispatchedAt,
  });

  const icons = [CheckCircle2, PackageCheck, Truck, Home];
  const fillWidth =
    view.progress === 'delivered'
      ? 'calc(100% - 4rem)'
      : view.progress === 'shipped'
        ? 'calc(66% - 2rem)'
        : view.progress === 'processing'
          ? '33%'
          : '15%';

  return (
    <div className='p-6 rounded-2xl bg-card border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800'>
        <div>
          <span className='text-xs uppercase tracking-wider text-muted-foreground font-semibold'>
            {copy.status}
          </span>
          <h3 className='text-lg font-bold text-foreground'>
            {copy.id}: <span className='text-emerald-600 font-mono break-all'>{formattedId}</span>
          </h3>
        </div>
      </div>

      <div className='relative py-4'>
        <div className='absolute top-9 left-8 right-8 h-1 bg-neutral-200 dark:bg-neutral-800 -translate-y-1/2 z-0' />
        <div
          className='absolute top-9 left-8 h-1 bg-emerald-600 -translate-y-1/2 transition-all duration-500 z-0'
          style={{ width: fillWidth }}
        />

        <div className='grid grid-cols-4 relative z-10 text-center gap-2'>
          {view.steps.map((step, idx) => {
            const Icon = icons[idx];
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

      <div className='bg-neutral-50 dark:bg-neutral-900/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs'>
        <div className='space-y-0.5'>
          <p className='font-semibold text-foreground flex items-center gap-1.5'>
            <Clock className='w-3.5 h-3.5 text-amber-500' />
            {copy.carrier}: {view.carrierStatus}
          </p>
          <p className='text-muted-foreground'>{view.carrierDetail}</p>
        </div>
      </div>
    </div>
  );
}
