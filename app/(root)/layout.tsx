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
      <main className='flex-1 w-full'>{children}</main>
      <Footer />
      <CartDrawer />
      <AiConcierge />
    </div>
  );
}
