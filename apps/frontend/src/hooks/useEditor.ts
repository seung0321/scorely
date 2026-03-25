'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ResumeSections } from '@scorely/types'
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

export function useSectionEditor(resumeId: string, initialSections: ResumeSections) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const { saveSections } = useResume()
  const sectionsRef = useRef<ResumeSections>(initialSections)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleSectionChange = useCallback(
    (key: keyof ResumeSections, value: string | string[]) => {
      sectionsRef.current = { ...sectionsRef.current, [key]: value }
      if (timerRef.current) clearTimeout(timerRef.current)
      setSaveStatus('saving')  // 즉시 saving 표시 → 재분석 버튼 비활성화
      timerRef.current = setTimeout(async () => {
        try {
          await saveSections(resumeId, sectionsRef.current)
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch {
          setSaveStatus('error')
        }
      }, 500)
    },
    [resumeId, saveSections],
  )

  return { saveStatus, handleSectionChange, sectionsRef }
}
