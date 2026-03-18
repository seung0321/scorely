'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useResume } from './useResume'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useEditor(resumeId: string) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { saveText } = useResume()

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const handleContentChange = useCallback(
    (content: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)

      setSaveStatus('saving')
      debounceTimer.current = setTimeout(async () => {
        try {
          await saveText(resumeId, content)
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch {
          setSaveStatus('error')
        }
      }, 500)
    },
    [resumeId, saveText]
  )

  return { saveStatus, handleContentChange }
}
