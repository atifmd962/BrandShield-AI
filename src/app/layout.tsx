import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'BrandShield AI — Evidence-Based Brand Governance',
  description:
    'BrandShield AI helps organisations review promotional content against approved brand guidelines, product facts, and approved claims using evidence-based AI analysis.',
  keywords: 'brand governance, promotional content review, AI brand compliance, evidence-based review',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
