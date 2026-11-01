import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/shared/cart/cart-drawer';
import AiConcierge from '@/components/shared/ai-concierge';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen flex-col w-full bg-slate-50 dark:bg-slate-950'>
      <Header />
      {/* Demo-mode indicator: the catalog is seed/demo data and checkout runs
          in test mode. Remove only when real supplier stock and live payments
          are configured. */}
      <div className='w-full bg-amber-100 dark:bg-amber-950/60 border-b border-amber-300 dark:border-amber-800 text-center text-[11px] sm:text-xs text-amber-900 dark:text-amber-200 py-1 px-3'>
        Demo store in test mode - products are sample data and orders are not real.
      </div>
      <main className='flex-1 w-full'>{children}</main>
      <Footer />
      <CartDrawer />
      <AiConcierge />
    </div>
  );
}
