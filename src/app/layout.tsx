import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/session-provider'
import { UserProvider } from '@/contexts/user-context'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Camserv CRM',
  description: 'CRM Inteligente — Camserv Solutions',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Camserv CRM',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SessionProvider>
          <UserProvider>{children}</UserProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
