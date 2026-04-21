import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SidebarProvider } from './context/SidebarContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CHTM-RRS - Room Reservation System',
  description: 'College of Hospitality and Tourism Management - Room Reservation System',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className}>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </body>
    </html>
  )
}