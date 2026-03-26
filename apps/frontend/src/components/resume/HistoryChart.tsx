'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ScoreHistoryItem {
  version: number
  totalScore: number
  createdAt: string
  jobCategory: string
}

interface HistoryChartProps {
  data: ScoreHistoryItem[]
}

export default function HistoryChart({ data }: HistoryChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const sorted = [...data].sort((a, b) => a.version - b.version)

  const latestScore = sorted[sorted.length - 1]?.totalScore ?? 0
  const highestScore = Math.max(...sorted.map((d) => d.totalScore))
  const avgScore = Math.round(sorted.reduce((s, d) => s + d.totalScore, 0) / sorted.length)

  const latestIndex = sorted.length - 1
  const highestIndex = sorted.findIndex((d) => d.totalScore === highestScore)

  // 포인트: 최신/최고만 크게, 색상은 모두 동일한 톤
  const pointRadii = sorted.map((_, i) => {
    if (i === latestIndex || i === highestIndex) return 6
    return 3.5
  })

  const pointBorderWidths = sorted.map((_, i) => {
    if (i === latestIndex || i === highestIndex) return 2
    return 0
  })

  const pointBorderColors = sorted.map((_, i) => {
    if (i === latestIndex || i === highestIndex) return 'white'
    return 'transparent'
  })

  // 마우스 휠로 가로 스크롤
  const handleWheel = useCallback((e: WheelEvent) => {
    const el = scrollRef.current
    if (!el) return
    const isScrollable = el.scrollWidth > el.clientWidth
    if (!isScrollable) return
    e.preventDefault()
    el.scrollLeft += e.deltaY
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // 최신(오른쪽 끝)으로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [sorted.length])

  const VISIBLE_COUNT = 8
  const minWidth = sorted.length > VISIBLE_COUNT ? sorted.length * 80 : undefined

  const chartData = {
    labels: sorted.map((d) => `v${d.version}`),
    datasets: [
      {
        label: '총점',
        data: sorted.map((d) => d.totalScore),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.06)',
        borderWidth: 2,
        pointBackgroundColor: '#4f46e5',
        pointRadius: pointRadii,
        pointBorderWidth: pointBorderWidths,
        pointBorderColor: pointBorderColors,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20, font: { size: 11 }, color: '#d1d5db' },
        grid: { color: 'rgba(0,0,0,0.03)' },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#9ca3af' },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const item = sorted[items[0].dataIndex]
            const badges: string[] = []
            if (items[0].dataIndex === latestIndex) badges.push('최신')
            if (items[0].dataIndex === highestIndex) badges.push('최고')
            const badgeStr = badges.length > 0 ? ` [${badges.join('·')}]` : ''
            return `v${item.version} · ${item.jobCategory}${badgeStr}`
          },
          label: (item: { raw: unknown }) => ` ${item.raw}점`,
        },
      },
    },
  }

  const stats = [
    { label: '최신', value: latestScore },
    { label: '최고', value: highestScore },
    { label: '평균', value: avgScore },
  ]

  return (
    <div>
      {/* 통계 */}
      <div className="flex gap-2 mb-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 flex-1 text-center"
          >
            <p className="text-[11px] text-gray-500 font-medium mb-0.5">{s.label}</p>
            <p className="text-lg font-semibold text-gray-900">
              {s.value}<span className="text-xs font-normal text-gray-500 ml-0.5">점</span>
            </p>
          </div>
        ))}
      </div>

      {/* 차트 (가로 스크롤, 휠 지원) */}
      <div
        ref={scrollRef}
        className="overflow-x-auto"
      >
        <div style={{ minWidth, height: 220 }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  )
}
