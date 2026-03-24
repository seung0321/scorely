'use client'

import { useCallback, useEffect } from 'react'
import { useEditor as useTipTapEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { ResumeSections } from '@resumate/types'
import { useEditor, useSectionEditor, SaveStatus } from '@/hooks/useEditor'
import { SECTION_LABELS, SECTION_ORDER, RECOMMENDABLE_SECTIONS } from '@/constants/sections'

const saveStatusLabel: Record<SaveStatus, string> = {
  idle: '',
  saving: '저장 중...',
  saved: '자동 저장됨 ✓',
  error: '저장 실패',
}

const saveStatusColor: Record<SaveStatus, string> = {
  idle: 'text-transparent',
  saving: 'text-gray-400',
  saved: 'text-green-500',
  error: 'text-red-500',
}

function sectionValueToString(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.map((v) => sectionValueToString(v)).join('\n\n')
  if (typeof val === 'object') return Object.values(val as Record<string, unknown>).map((v) => sectionValueToString(v)).join('\n')
  return String(val)
}

function textToHtml(text: unknown): string {
  const str = sectionValueToString(text)
  if (!str) return ''
  // TipTap에서 저장된 HTML인 경우 (반드시 태그로 시작) 그대로 사용
  if (str.trimStart().startsWith('<')) return str
  return str
    .split('\n\n')
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

interface SectionBlockProps {
  title: string
  content: string
  placeholder?: string
  excluded?: boolean
  showRecommendButton?: boolean
  isRecommendLoading?: boolean
  onRecommend?: (currentContent: string) => void
  overrideContent?: string
  onChange: (value: string) => void
}

function SectionBlock({ title, content, placeholder, excluded, showRecommendButton, isRecommendLoading, onRecommend, overrideContent, onChange }: SectionBlockProps) {
  const editor = useTipTapEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? '내용을 입력하세요...' }),
    ],
    content: textToHtml(content),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-4 min-h-[100px] text-gray-800 leading-relaxed',
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
  })

  useEffect(() => {
    if (overrideContent && editor) {
      editor.commands.setContent(textToHtml(overrideContent), true)
    }
  }, [overrideContent, editor])

  return (
    <div className={`bg-white rounded-xl border shadow-sm mb-3 ${excluded ? 'border-amber-200' : 'border-gray-100'}`}>
      <div className={`px-4 py-2 border-b rounded-t-xl flex items-center justify-between gap-2 ${excluded ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          {excluded && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              분석 제외
            </span>
          )}
        </div>
        {showRecommendButton && !excluded && (
          <button
            type="button"
            onClick={() => onRecommend?.(editor?.getText() ?? '')}
            disabled={isRecommendLoading}
            className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-600 px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
          >
            {isRecommendLoading ? '추천 중...' : 'AI 추천 받기'}
          </button>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

interface ResumeEditorProps {
  resumeId: string
  sections: ResumeSections
  extractedText?: string
  onSaveStatusChange?: (status: SaveStatus) => void
  activeRecommendSection?: string
  onSectionRecommend?: (sectionType: string, content: string) => void
  sectionOverrides?: Record<string, string>
}

function FallbackEditor({
  resumeId,
  extractedText,
  onSaveStatusChange,
}: {
  resumeId: string
  extractedText: string
  onSaveStatusChange?: (status: SaveStatus) => void
}) {
  const { saveStatus, handleContentChange } = useEditor(resumeId)

  useEffect(() => {
    onSaveStatusChange?.(saveStatus)
  }, [saveStatus, onSaveStatusChange])

  const editor = useTipTapEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '이력서 내용을 입력하세요...' }),
    ],
    content: extractedText,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-4 min-h-[500px] text-gray-800 leading-relaxed',
      },
    },
    onUpdate: ({ editor: e }) => {
      handleContentChange(e.getText())
    },
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs text-gray-400">전체 텍스트로 표시됩니다 (섹션 추출 필요 시 재업로드)</p>
        <p className={`text-xs transition-colors ${saveStatusColor[saveStatus]}`}>
          {saveStatusLabel[saveStatus]}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default function ResumeEditor({ resumeId, sections, extractedText, onSaveStatusChange, activeRecommendSection, onSectionRecommend, sectionOverrides }: ResumeEditorProps) {
  const hasContent = SECTION_ORDER.some((key) =>
    key === 'projects' ? (sections.projects?.length ?? 0) > 0 : !!sections[key],
  )

  if (!hasContent) {
    if (extractedText) {
      return (
        <FallbackEditor
          resumeId={resumeId}
          extractedText={extractedText}
          onSaveStatusChange={onSaveStatusChange}
        />
      )
    }
    return (
      <div className="flex items-center justify-center h-40 bg-white rounded-xl border border-gray-100">
        <p className="text-sm text-gray-400">표시할 이력서 텍스트가 없습니다.</p>
      </div>
    )
  }

  return (
    <SectionedEditor
      resumeId={resumeId}
      sections={sections}
      onSaveStatusChange={onSaveStatusChange}
      activeRecommendSection={activeRecommendSection}
      onSectionRecommend={onSectionRecommend}
      sectionOverrides={sectionOverrides}
    />
  )
}

function SectionedEditor({
  resumeId,
  sections,
  onSaveStatusChange,
  activeRecommendSection,
  onSectionRecommend,
  sectionOverrides,
}: {
  resumeId: string
  sections: ResumeSections
  onSaveStatusChange?: (status: SaveStatus) => void
  activeRecommendSection?: string
  onSectionRecommend?: (sectionType: string, content: string) => void
  sectionOverrides?: Record<string, string>
}) {
  const { saveStatus, handleSectionChange, sectionsRef } = useSectionEditor(resumeId, sections)

  useEffect(() => {
    onSaveStatusChange?.(saveStatus)
  }, [saveStatus, onSaveStatusChange])

  const handleProjectChange = useCallback(
    (index: number, value: string) => {
      // sections.projects(stale prop)가 아닌 sectionsRef.current.projects(최신값)를 사용
      const updated = [...(sectionsRef.current.projects ?? [])]
      updated[index] = value
      handleSectionChange('projects', updated)
    },
    [sectionsRef, handleSectionChange],
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs text-gray-400">섹션별로 자동 저장됩니다</p>
        <p className={`text-xs transition-colors ${saveStatusColor[saveStatus]}`}>
          {saveStatusLabel[saveStatus]}
        </p>
      </div>

      {SECTION_ORDER.map((key) => {
        if (key === 'projects') {
          if (!sections.projects?.length) return null
          return sections.projects.map((proj, i) => (
            <SectionBlock
              key={`project-${i}`}
              title={`프로젝트${sections.projects!.length > 1 ? ` ${i + 1}` : ''}`}
              content={proj}
              placeholder="프로젝트 내용을 입력하세요..."
              showRecommendButton={RECOMMENDABLE_SECTIONS.has('projects')}
              isRecommendLoading={activeRecommendSection === `projects-${i}`}
              onRecommend={(content) => onSectionRecommend?.(`projects-${i}`, content)}
              overrideContent={sectionOverrides?.[`projects-${i}`]}
              onChange={(val) => handleProjectChange(i, val)}
            />
          ))
        }

        const value = sections[key] as string | undefined
        if (!value) return null

        return (
          <SectionBlock
            key={key}
            title={SECTION_LABELS[key]}
            content={value}
            excluded={key === 'coverLetter'}
            showRecommendButton={RECOMMENDABLE_SECTIONS.has(key)}
            isRecommendLoading={activeRecommendSection === key}
            onRecommend={(content) => onSectionRecommend?.(key, content)}
            overrideContent={sectionOverrides?.[key]}
            onChange={(val) => handleSectionChange(key, val)}
          />
        )
      })}
    </div>
  )
}
