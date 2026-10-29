import type { Metadata } from 'next';
import '@/assets/styles/globals.css';
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from '@/lib/constants';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: {
    template: `%s | Omnistu Superstore`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Authentic Amazon Typography & Layout Stylesheets */}
        <link rel='stylesheet' href='/assets/css/21WtwhH1EKL.css' />
        <link rel='stylesheet' href='/assets/css/215CM2Cgm9L._RC%7C51FWJRVXGBL.css_.css' />
        <link rel='stylesheet' href='/assets/css/asset_3b5a397f7a5e.css' />
        <link rel='stylesheet' href='/assets/css/asset_e161a8ecc720.css' />
        <link rel='stylesheet' href='/assets/css/51Kn5IB9d7L.css' />
        <link rel='icon' href='/images/logo.svg' />
      </head>
      <body className='antialiased bg-[#eaeded] dark:bg-[#0f1111] text-[#0f1111] dark:text-neutral-100 font-["Amazon_Ember",Arial,sans-serif]'>
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
