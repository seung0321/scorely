'use client'

import { useCallback, useEffect } from 'react'
import { useEditor as useTipTapEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { ResumeSections } from '@resumate/types'
import { useEditor, useSectionEditor, SaveStatus } from '@/hooks/useEditor'

const SECTION_LABELS: Record<keyof ResumeSections, string> = {
  summary: '간략 소개',
  experience: '경력',
  education: '학력',
  training: '교육 이수',
  skills: '스킬',
  projects: '프로젝트',
  certifications: '자격증',
  activities: '대외활동',
  awards: '수상',
}

const SECTION_ORDER: (keyof ResumeSections)[] = [
  'summary', 'experience', 'education', 'training', 'projects',
  'skills', 'certifications', 'activities', 'awards',
]

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

function textToHtml(text: string): string {
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  return text
    .split('\n\n')
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

interface SectionBlockProps {
  title: string
  content: string
  placeholder?: string
  onChange: (value: string) => void
}

function SectionBlock({ title, content, placeholder, onChange }: SectionBlockProps) {
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

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-3">
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
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

export default function ResumeEditor({ resumeId, sections, extractedText, onSaveStatusChange }: ResumeEditorProps) {
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

  return <SectionedEditor resumeId={resumeId} sections={sections} onSaveStatusChange={onSaveStatusChange} />
}

function SectionedEditor({
  resumeId,
  sections,
  onSaveStatusChange,
}: {
  resumeId: string
  sections: ResumeSections
  onSaveStatusChange?: (status: SaveStatus) => void
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
            onChange={(val) => handleSectionChange(key, val)}
          />
        )
      })}
    </div>
  )
}
