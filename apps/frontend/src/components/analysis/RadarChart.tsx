'use client'

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import { ScoreDetail } from '@resumate/types'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface RadarChartProps {
  scores: ScoreDetail
}

export default function RadarChart({ scores }: RadarChartProps) {
  const data = {
    labels: ['기술', '프로젝트', '성과', '협업', '구성'],
    datasets: [
      {
        label: '점수',
        data: [
          scores.tech,
          scores.project,
          scores.achievement,
          scores.communication,
          scores.structure,
        ],
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(79, 70, 229, 1)',
        pointRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20, font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.06)' },
      },
    },
    plugins: {
      legend: { display: false },
    },
  }

  return <Radar data={data} options={options} />
}
