'use client'

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
  const chartData = {
    labels: data.map((d) => `v${d.version}`),
    datasets: [
      {
        label: '총점',
        data: data.map((d) => d.totalScore),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 5,
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20 },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const item = data[items[0].dataIndex]
            return `v${item.version} · ${item.jobCategory}`
          },
          label: (item: { raw: unknown }) => `${item.raw}점`,
        },
      },
    },
  }

  return <Line data={chartData} options={options} />
}
