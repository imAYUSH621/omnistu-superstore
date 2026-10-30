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
    <div className='flex min-h-screen flex-col w-full bg-[#eaeded] dark:bg-[#0f1111]'>
      <Header />
      <main className='flex-1 w-full'>{children}</main>
      <Footer />
      <CartDrawer />
      <AiConcierge />
      <script src='/assets/js/amazon-client-core.js' defer />
    </div>
  );
}
