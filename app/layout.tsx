import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: '<< CHEVRON >> | People Flow OpenData Platform',
  description: '<< CHEVRON >> | People Flow OpenData Platform',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
