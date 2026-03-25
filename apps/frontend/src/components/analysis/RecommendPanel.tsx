'use client'

import LoadingSpinner from '@/components/common/LoadingSpinner'

export interface RecommendState {
  sectionType: string
  status: 'idle' | 'loading' | 'done' | 'error'
  recommendedText: string
  errorMessage: string
}

interface RecommendPanelProps {
  state: RecommendState
  onApply: (sectionType: string, text: string) => void
}

const SECTION_DISPLAY_NAMES: Record<string, string> = {
  summary: '간략 소개',
  experience: '경력',
  education: '학력',
  activities: '대외활동',
  awards: '수상',
}

function getSectionLabel(sectionType: string): string {
  if (sectionType.startsWith('projects-')) {
    const idx = parseInt(sectionType.split('-')[1] ?? '0', 10)
    return `프로젝트 ${idx + 1}`
  }
  return SECTION_DISPLAY_NAMES[sectionType] ?? sectionType
}

export default function RecommendPanel({ state, onApply }: RecommendPanelProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(state.recommendedText)
    } catch {
      // clipboard API not available
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-800">AI 추천 텍스트</h2>
        <p className="text-xs text-gray-400 mt-0.5">표현 개선 참고용입니다. 적용 후 내용을 직접 검토하세요</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {state.status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">추천 준비 완료</p>
              <p className="text-xs text-gray-400 mt-1">왼쪽 섹션에서 AI 추천 받기를<br/>클릭하면 여기에 결과가 표시됩니다</p>
            </div>
          </div>
        )}

        {state.status === 'loading' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500">
              <span className="font-medium text-primary-600">{getSectionLabel(state.sectionType)}</span> 섹션 분석 중...
            </p>
            <p className="text-xs text-gray-400">잠시만 기다려주세요</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-red-600">추천 실패</p>
              <p className="text-xs text-gray-500 mt-1">{state.errorMessage || 'AI 추천 중 오류가 발생했습니다'}</p>
            </div>
          </div>
        )}

        {state.status === 'done' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                {getSectionLabel(state.sectionType)}
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {state.recommendedText}
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              적용 후 원본 정보(기간·수치 등)가 유지됐는지 꼭 확인하세요
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 text-xs border border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-600 px-3 py-2 rounded-lg font-medium transition-colors"
              >
                복사하기
              </button>
              <button
                type="button"
                onClick={() => onApply(state.sectionType, state.recommendedText)}
                className="flex-1 text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
              >
                에디터에 적용
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
