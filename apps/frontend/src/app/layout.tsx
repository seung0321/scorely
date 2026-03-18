import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from '@/components/common/Navbar'

export const metadata: Metadata = {
  title: 'Resumate - AI 이력서 분석 서비스',
  description: 'AI 기반 이력서 분석 및 개선 서비스. PDF 업로드 한 번으로 직군별 점수, 피드백, 에디터까지.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
