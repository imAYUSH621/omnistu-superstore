export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen flex-col w-full' style={{ margin: 0, padding: 0 }}>
      <main className='flex-1 w-full'>{children}</main>
    </div>
  );
}
