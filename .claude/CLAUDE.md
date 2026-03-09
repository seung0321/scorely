# Resumate 프로젝트 컨텍스트

## 서비스 개요
AI 기반 이력서 분석 및 개선 웹 서비스.
취준생이 PDF 이력서를 업로드하면 Gemini AI가 직군별로 분석하고,
TipTap 에디터에서 텍스트를 수정하며 재분석받을 수 있다.
버전마다 점수 변화를 추적하는 히스토리 기능 포함.

## 모노레포 구조
```
resumate/
├── apps/
│   ├── backend/   # Fastify + TypeScript + Prisma
│   └── frontend/  # Next.js 14 + TypeScript + Tailwind + TipTap
└── packages/
    └── types/     # 공유 타입 (@resumate/types)
```

## 기술 스택

### 백엔드 (apps/backend)
- Node.js + Fastify (Express 아님)
- TypeScript strict 모드
- Prisma ORM + PostgreSQL
- JWT + bcrypt 인증
- Google Gemini 1.5 Flash API
- AWS S3 (PDF 저장)
- zod (환경변수 및 요청 검증)
- pnpm

### 프론트엔드 (apps/frontend)
- Next.js 14 App Router
- TypeScript strict 모드
- Tailwind CSS
- TipTap 에디터 (@tiptap/react + @tiptap/starter-kit)
- Chart.js + react-chartjs-2
- axios

### 배포
- 백엔드: AWS EC2 + PM2 + Nginx
- 프론트엔드: Vercel
- DB: AWS RDS (PostgreSQL)
- 파일: AWS S3

## 핵심 비즈니스 로직

### 이력서 업로드 흐름
1. PDF 업로드 → S3 저장
2. Gemini가 PDF를 base64로 받아 텍스트 추출 + 분석 동시 처리
3. extractedText = editedText = 추출된 텍스트로 DB 저장
4. 분석 결과(scores, strengths, improvements, oneLiner) DB 저장

### 재분석 흐름
1. TipTap 에디터에서 텍스트 수정
2. 500ms 디바운스 후 PATCH /api/resume/:id/text 자동 저장
3. 재분석 버튼 클릭 → editedText를 Gemini에 텍스트로 전달
4. 새 버전(version+1)으로 Resume + Analysis 저장

### DB 핵심 필드
- Resume.extractedText: PDF 최초 추출 원본
- Resume.editedText: 사용자 수정 텍스트 (재분석에 사용)
- Resume.version: 버전 번호 (재분석마다 증가)

## 코드 규칙

### 공통
- any 타입 절대 사용 금지
- 모든 async 함수 try-catch 필수
- 함수/변수: camelCase
- 클래스: PascalCase
- 파일명: kebab-case

### 백엔드
- 에러는 반드시 AppError로 throw
  예: throw new AppError(404, '이력서를 찾을 수 없습니다', 'NOT_FOUND')
- 에러 코드: UNAUTHORIZED(401), FORBIDDEN(403), NOT_FOUND(404),
  VALIDATION_ERROR(400), AI_ERROR(500), S3_ERROR(500), INTERNAL_ERROR(500)
- 응답 형식 통일:
  성공: { success: true, data: T, message?: string }
  실패: { success: false, error: { code: string, message: string } }
- 인증 필요 API는 반드시 auth 미들웨어 적용
- 본인 데이터만 접근 가능 (userId 검증 필수)

### 프론트엔드
- TipTap 에디터는 반드시 dynamic import (ssr: false)
- Chart.js 컴포넌트는 'use client' 필수
- @resumate/types에서 타입 import
- API 호출은 src/lib/api.ts의 axios 인스턴스 사용

## API 엔드포인트 목록
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/resume/upload          # PDF 업로드 + 최초 분석
PATCH  /api/resume/:id/text        # editedText 자동 저장
POST   /api/resume/:id/reanalyze   # 재분석 (새 버전 생성)
GET    /api/resume/history         # 전체 버전 목록
GET    /api/resume/:id             # 특정 버전 상세

GET    /api/analysis/history       # 점수 히스토리 (차트용)

## 환경변수 목록
### 백엔드 (.env)
DATABASE_URL
JWT_SECRET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_S3_BUCKET
GEMINI_API_KEY
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

### 프론트엔드 (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000

## 직군 목록 (JobCategory)
'백엔드 개발자' | '프론트엔드 개발자' | '기획자' | '마케터' | '디자이너' | '데이터 분석가'

## 주의사항
- pnpm 사용 (npm, yarn 사용 금지)
- Fastify 사용 (Express 사용 금지)
- .env 파일 절대 커밋 금지
- AWS SDK v3 사용 (@aws-sdk/client-s3)
- Gemini model: "gemini-1.5-flash"
- JWT 만료: 7일
- PDF 최대 크기: 10MB
- bcrypt saltRounds: 10
