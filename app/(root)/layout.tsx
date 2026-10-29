import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/shared/cart/cart-drawer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1 wrapper'>{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
