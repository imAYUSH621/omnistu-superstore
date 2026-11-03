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
        <link rel='icon' href='/images/logo.svg' />
        {/* Pre-hydration form-focus guard: hides the fixed AI concierge
            launcher (globals.css) while any external form control has focus.
            Plain static script - must run before hydration. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- must execute synchronously pre-hydration */}
        <script src='/form-focus-guard.js' />
      </head>
      <body className='antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-neutral-100 font-sans'>
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          themes={['light', 'dark', 'professional']}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
