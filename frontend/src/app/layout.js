import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FastKey - Biometric Authentication',
  description: 'Secure, private, and fast biometric authentication for the modern web.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={cn(inter.className, "bg-slate-950 antialiased")}>{children}</body>
    </html>
  )
}