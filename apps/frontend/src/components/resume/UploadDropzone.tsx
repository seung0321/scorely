'use client'

import { useRef, useState } from 'react'
import { JobCategory } from '@resumate/types'

const JOB_CATEGORIES: JobCategory[] = [
  'IT개발·데이터',
  '디자인',
  '마케팅·광고',
  '경영·기획',
  '영업·판매',
  '회계·세무·재무',
  '인사·노무',
  '의료·제약',
  '금융·보험',
  '연구·R&D',
  '교육',
  '생산·제조',
  '기타',
]

interface UploadDropzoneProps {
  onUpload: (file: File, jobCategory: JobCategory) => Promise<void>
  isLoading: boolean
}

export default function UploadDropzone({ onUpload, isLoading }: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jobCategory, setJobCategory] = useState<JobCategory | ''>('')
  const [fileError, setFileError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') return 'PDF 파일만 업로드 가능합니다.'
    if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하여야 합니다.'
    return null
  }

  const handleFile = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setFileError(error)
      setSelectedFile(null)
    } else {
      setFileError(null)
      setSelectedFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleSubmit = async () => {
    if (!selectedFile || !jobCategory) return
    await onUpload(selectedFile, jobCategory)
  }

  const canSubmit = selectedFile && jobCategory && !isLoading

  return (
    <div className="space-y-4">
      {/* 드래그앤드롭 영역 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-primary-600 bg-primary-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-primary-300 bg-primary-50 hover:border-primary-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileInput}
        />
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">✅</span>
            <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
            <p className="text-xs text-green-600">
              {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
            </p>
            <p className="text-xs text-gray-500">다른 파일을 선택하려면 클릭하세요</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl text-primary-400">☁</span>
            <p className="text-primary-700 font-medium">PDF 파일을 여기에 드래그하세요</p>
            <p className="text-gray-500 text-sm">또는</p>
            <span className="border border-primary-600 text-primary-600 px-4 py-2 rounded-lg text-sm hover:bg-primary-50">
              파일 선택하기
            </span>
            <p className="text-xs text-gray-400">PDF만 가능 · 최대 10MB</p>
          </div>
        )}
      </div>

      {fileError && (
        <p className="text-sm text-red-600">{fileError}</p>
      )}

      {/* 직군 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">직군 선택</label>
        <select
          value={jobCategory}
          onChange={(e) => setJobCategory(e.target.value as JobCategory)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-primary-500 bg-white"
        >
          <option value="">직군을 선택하세요</option>
          {JOB_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* 제출 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:text-gray-500 bg-primary-600 hover:bg-primary-700 text-white"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            AI가 이력서를 분석하고 있어요...
          </>
        ) : (
          '분석 시작하기'
        )}
      </button>

      {isLoading && (
        <p className="text-xs text-center text-gray-400">최대 30초 정도 소요됩니다</p>
      )}
    </div>
  )
}
