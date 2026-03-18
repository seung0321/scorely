'use client'

import { useCallback, useState } from 'react'
import { useEditor as useTipTapEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import EditorToolbar from './EditorToolbar'
import { useEditor } from '@/hooks/useEditor'

interface ResumeEditorProps {
  resumeId: string
  initialContent: string
  onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void
}

const saveStatusLabel: Record<string, string> = {
  idle: '',
  saving: '저장 중...',
  saved: '자동 저장됨 ✓',
  error: '저장 실패',
}

const saveStatusColor: Record<string, string> = {
  idle: 'text-transparent',
  saving: 'text-gray-400',
  saved: 'text-green-500',
  error: 'text-red-500',
}

export default function ResumeEditor({
  resumeId,
  initialContent,
  onSaveStatusChange,
}: ResumeEditorProps) {
  const [isCopied, setIsCopied] = useState(false)
  const { saveStatus, handleContentChange } = useEditor(resumeId)

  const editor = useTipTapEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '이력서 내용을 입력하세요...' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none p-4 min-h-[500px] text-gray-800 leading-relaxed',
      },
    },
    onUpdate: ({ editor: e }) => {
      const text = e.getText()
      handleContentChange(text)
      onSaveStatusChange?.(saveStatus)
    },
  })

  const handleCopy = useCallback(async () => {
    if (!editor) return
    try {
      await navigator.clipboard.writeText(editor.getText())
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // clipboard API 실패 시 무시
    }
  }, [editor])

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100">
      <EditorToolbar editor={editor} onCopy={handleCopy} isCopied={isCopied} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
        <p className={`text-xs transition-colors ${saveStatusColor[saveStatus]}`}>
          {saveStatusLabel[saveStatus]}
        </p>
        <p className="text-xs text-gray-400">
          💡 수정 완료 후 복사해서 원래 이력서에 붙여넣으세요
        </p>
      </div>
    </div>
  )
}
