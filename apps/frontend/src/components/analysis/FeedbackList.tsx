import { Improvement, Penalty } from '@resumate/types'

interface FeedbackListProps {
  strengths: string[]
  improvements: Improvement[]
  penalties?: Penalty[]
  oneLiner: string
}

export default function FeedbackList({ strengths, improvements, penalties = [], oneLiner }: FeedbackListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          <span className="w-1 h-4 bg-green-500 rounded-full inline-block" />
          강점
        </h4>
        <div className="space-y-2">
          {strengths.map((strength, i) => (
            <div key={i} className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex gap-2">
              <span className="text-green-600 text-sm mt-0.5">✅</span>
              <p className="text-sm text-green-800">{strength}</p>
            </div>
          ))}
        </div>
      </div>

      {penalties.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <span className="w-1 h-4 bg-red-500 rounded-full inline-block" />
            감점 항목
          </h4>
          <div className="space-y-2">
            {penalties.map((item, i) => (
              <div key={i} className="bg-red-50 border-l-4 border-red-400 rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  🔻 {item.category}
                </span>
                <p className="text-sm text-red-800 mt-1.5">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
          <span className="w-1 h-4 bg-orange-400 rounded-full inline-block" />
          개선사항
        </h4>
        <div className="space-y-2">
          {improvements.map((item, i) => (
            <div key={i} className="bg-white border-l-4 border-orange-400 rounded-lg px-3 py-2 shadow-sm">
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                💡 {item.category}
              </span>
              <p className="text-sm text-gray-700 mt-1.5">{item.issue}</p>
              <p className="text-sm text-primary-600 mt-1">{item.suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
        <p className="text-xs text-gray-500 mb-1">한 줄 총평</p>
        <p className="text-sm text-gray-700 font-medium">"{oneLiner}"</p>
      </div>
    </div>
  )
}
