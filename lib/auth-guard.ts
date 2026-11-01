import { redirect } from 'next/navigation'

export async function requireAdmin() {
  // Loaded on demand so modules that only import this guard do not pull the
  // whole auth stack in at load time.
  const { auth } = await import('@/auth')
  const session = await auth()

  if (session?.user?.role !== 'admin') {
    redirect('/unauthorized')
  }

  return session
}
