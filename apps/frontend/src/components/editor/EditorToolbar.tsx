'use client'

import { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor | null
  onCopy: () => void
  isCopied: boolean
}

interface ToolbarButton {
  label: string
  title: string
  action: () => void
  isActive: boolean
}

export default function EditorToolbar({ editor, onCopy, isCopied }: EditorToolbarProps) {
  if (!editor) return null

  const buttons: ToolbarButton[] = [
    {
      label: 'B',
      title: '굵게',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      label: 'I',
      title: '기울임',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      label: 'H2',
      title: '제목',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      label: '•',
      title: '목록',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      label: '↩',
      title: '실행취소',
      action: () => editor.chain().focus().undo().run(),
      isActive: false,
    },
    {
      label: '↪',
      title: '다시실행',
      action: () => editor.chain().focus().redo().run(),
      isActive: false,
    },
  ]

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      <div className="flex items-center gap-1">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            title={btn.title}
            className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
              btn.isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <button
        onClick={onCopy}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
      >
        <span>📋</span>
        <span>{isCopied ? '복사됨 ✓' : '복사하기'}</span>
      </button>
    </div>
  )
}
