import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Resumate - AI 이력서 분석 서비스',
  description: 'AI 기반 이력서 분석 및 개선 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
