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
    desc: '13개 직군 기준으로 나의 강점과 보완점을 점수화하고, 신입 기준 실전 중심의 상세 피드백을 제공합니다.',
  },
  {
    icon: '✨',
    title: 'AI 추천 텍스트로 즉시 개선',
    desc: 'AI가 각 섹션별로 텍스트 개선안을 참고용으로 제시합니다. 내 스타일에 맞게 직접 수정하고, 재분석으로 점수 변화를 확인해보세요.',
  },
]

const steps = [
  { num: 1, label: 'PDF 업로드' },
  { num: 2, label: 'AI 분석' },
  { num: 3, label: '점수 확인' },
  { num: 4, label: '추천 텍스트 적용' },
  { num: 5, label: '재분석 & 완성' },
]

const RADAR_SIZE = 100
const CX = 50
const CY = 50
const R = 35

const AXES = ['전문성', '실무경험', '성과', '협업', '구성']
const SCORES = [0.70, 0.80, 0.70, 0.85, 1.0]

function getPoint(axisIndex: number, ratio: number): [number, number] {
  const angle = (axisIndex * 2 * Math.PI) / AXES.length - Math.PI / 2
  return [CX + R * ratio * Math.cos(angle), CY + R * ratio * Math.sin(angle)]
}

function toPolygon(ratios: number[]): string {
  return ratios.map((r, i) => getPoint(i, r).join(',')).join(' ')
}

const GRID_RATIOS = [0.33, 0.67, 1.0]

function RadarChartStatic() {
  const gridSteps = GRID_RATIOS.map((r) =>
    AXES.map((_, i) => getPoint(i, r)).map((p) => p.join(',')).join(' ')
  )
  const dataPolygon = toPolygon(SCORES)

  return (
    <svg viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} className="w-full h-full">
      {/* grid polygons */}
      {gridSteps.map((pts, gi) => (
        <polygon
          key={gi}
          points={pts}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="0.5"
        />
      ))}
      {/* axis lines */}
      {AXES.map((_, i) => {
        const [x, y] = getPoint(i, 1)
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        )
      })}
      {/* data polygon */}
      <polygon
        points={dataPolygon}
        fill="rgba(99,102,241,0.2)"
        stroke="#6366f1"
        strokeWidth="1"
      />
      {/* data dots */}
      {SCORES.map((r, i) => {
        const [x, y] = getPoint(i, r)
        return <circle key={i} cx={x} cy={y} r="1.5" fill="#6366f1" />
      })}
      {/* axis labels */}
      {AXES.map((label, i) => {
        const [x, y] = getPoint(i, 1.28)
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="4.5"
            fill="#6b7280"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

const CATEGORY_SCORES = [
  { label: '전문성', score: 70 },
  { label: '실무경험', score: 80 },
  { label: '성과', score: 70 },
  { label: '협업', score: 85 },
  { label: '구성', score: 100 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            신입 취준생을 위한{' '}
            <span className="text-primary-600">AI 이력서 코치</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            PDF 한 번 업로드로 신입 기준 직군별 점수, AI 피드백, 추천 텍스트까지 —{' '}
            한 곳에서 원스톱으로 취업 준비를 끝내세요.
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
          <p className="mt-4 text-sm text-gray-500">회원가입 무료 · 5시간마다 5회 무료 분석</p>
        </div>
      </section>

      {/* Analysis Result Mockup */}
      <section className="bg-[#EEF2FF] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium text-indigo-500 mb-6 tracking-wide uppercase">
            실제 분석 결과 미리보기
          </p>
          {/* Browser frame — desktop only */}
          <div
            className="hidden md:block rounded-xl overflow-hidden shadow-2xl"
            style={{ perspective: '1200px', transform: 'rotateX(3deg)' }}
          >
            {/* Browser chrome */}
            <div className="bg-gray-200 px-4 py-2.5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4">
                <div className="bg-gray-100 rounded-full text-xs text-gray-400 px-3 py-1 text-center w-48 mx-auto">
                  scorely.kr/analysis
                </div>
              </div>
            </div>

            {/* App content */}
            <div className="bg-gray-100">
              {/* App header */}
              <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">이력서 분석 결과</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">V3</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">IT개발·데이터</span>
                  <span className="text-xs text-gray-400">2026. 3. 24.</span>
                </div>
              </div>

              {/* Score dashboard */}
              <div className="bg-white border-b border-gray-100 px-5 py-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Total score */}
                  <div className="flex flex-col items-center justify-center py-2">
                    <p className="text-xs text-gray-500 mb-1">종합점수</p>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-indigo-600">81</span>
                      <span className="text-sm text-gray-400 mb-1">/ 100</span>
                    </div>
                  </div>
                  {/* Radar chart */}
                  <div className="flex items-center justify-center">
                    <div className="w-36 h-36">
                      <RadarChartStatic />
                    </div>
                  </div>
                  {/* Category bars */}
                  <div className="space-y-2">
                    {CATEGORY_SCORES.map(({ label, score }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-14 shrink-0">{label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-6 text-right">{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feedback cards */}
              <div className="p-4 grid grid-cols-2 gap-3">
                {/* Strengths */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">강점</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-800">
                      ✅ 문제-해결-결과 구조로 기술적 문제 해결 능력을 명확히 제시합니다.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-800">
                      ✅ 수치화된 성과를 명확히 제시하여 프로젝트 기여도를 객관적으로 보여줍니다.
                    </p>
                  </div>
                </div>
                {/* Improvements */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">개선사항</p>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-orange-700 mb-1">💡 communication</p>
                    <p className="text-xs text-orange-800">
                      팀 프로젝트 내에서 의견 조율 경험이 구체적으로 서술되어 있지 않습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* One liner */}
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                  문제 해결 능력과 실무 기여 경험이 돋보이는 백엔드 개발자로, 구체적인 기술 역량과 프로젝트 성과가 잘 드러나 있습니다.
                </p>
              </div>
            </div>
          </div>
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
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
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
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-primary-600 text-white">
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
          <p className="text-sm text-gray-400">Scorely © 2025</p>
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
