import Link from 'next/link'

const features = [
  {
    icon: '📄',
    title: 'PDF 한 번 업로드',
    desc: '이력서 PDF를 올리면 AI가 텍스트를 자동 추출합니다. 복사 붙여넣기의 번거로움이 없어졌습니다.',
  },
  {
    icon: '⚡',
    title: '직군별 AI 분석',
    desc: '6개 핵심 직군 기준으로 나의 강점과 보완점을 점수화하고, 실전 중심의 상세 피드백을 제공합니다.',
  },
  {
    icon: '✏️',
    title: '에디터에서 바로 수정',
    desc: '제안된 피드백을 바탕으로 텍스트를 즉시 수정하고, 재분석 버튼 하나로 실시간 점수 변화를 확인하세요.',
  },
]

const steps = [
  { num: 1, label: 'PDF 업로드', active: true },
  { num: 2, label: 'AI 분석', active: true },
  { num: 3, label: '점수 확인', active: false },
  { num: 4, label: '에디터 수정', active: false },
  { num: 5, label: '재분석 & 완성', active: true },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            AI가 이력서를{' '}
            <span className="text-primary-600">분석하고 개선</span>까지
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            PDF 한 번 업로드로 직군별 점수, 피드백, 에디터까지 — 한 곳에서 원스톱으로 취업 준비를 끝내세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              무료로 시작하기
            </Link>
            <Link
              href="#how-it-works"
              className="border border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              서비스 둘러보기
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">회원가입 무료 · 신용카드 필요 없음</p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">이렇게 사용하세요</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      step.active
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.num}
                  </div>
                  <span className="text-xs text-gray-600 text-center whitespace-nowrap">{step.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block w-12 h-px bg-gray-300 mx-2 mb-5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 px-4 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            합격으로 가는 첫 단추, 지금 바로 시작하세요.
          </h2>
          <Link
            href="/register"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            내 이력서 무료로 분석하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-gray-400">Resumate © 2025</p>
          <div className="flex gap-4 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600">이용약관</a>
            <a href="#" className="hover:text-gray-600">개인정보처리방침</a>
            <a href="#" className="hover:text-gray-600">고객센터</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
