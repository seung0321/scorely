# Scorely 프로젝트 컨텍스트

## 서비스 개요
AI 기반 이력서 분석 및 개선 웹 서비스. **신입 취준생 전용.**
취준생이 PDF 이력서를 업로드하면 Gemini AI가 직군별로 분석하고,
TipTap 에디터에서 텍스트를 수정하며 재분석받을 수 있다.
섹션별 AI 추천 기능, 버전마다 점수 변화를 추적하는 히스토리 기능 포함.

## 모노레포 구조
```
scorely/
├── apps/
│   ├── backend/   # Fastify + TypeScript + Prisma
│   └── frontend/  # Next.js 14 + TypeScript + Tailwind + TipTap
└── packages/
    └── types/     # 공유 타입 (@scorely/types)
```

## 기술 스택

### 백엔드 (apps/backend)
- Node.js + Fastify (Express 아님)
- TypeScript strict 모드
- Prisma ORM + PostgreSQL
- JWT + bcryptjs 인증
- Google Gemini 2.5 Flash API (@google/genai)
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
4. 분석 결과(scores, strengths, improvements, oneLiner, penalties) DB 저장
5. 섹션별 파싱 결과(sections) DB 저장 (summary, experience, education, training, skills, projects, certifications, activities, awards, coverLetter)

### 재분석 흐름
1. TipTap 에디터에서 텍스트 수정
2. 500ms 디바운스 후 PATCH /api/resume/:id/text 자동 저장
3. 재분석 버튼 클릭 → editedText를 Gemini에 텍스트로 전달 (sections 미포함)
4. 새 버전(version+1)으로 Resume + Analysis 저장
5. **coverLetter는 재분석 텍스트에서 제외**

### 섹션별 AI 추천 흐름
1. 에디터에서 특정 섹션의 "AI 추천 받기" 버튼 클릭
2. POST /api/resume/:id/section-recommend 호출
3. sectionType + content + jobCategory + context(improvements, penalties) → Gemini
4. 추천 텍스트를 RecommendPanel 사이드바에 표시
5. 사용자가 "적용" 버튼으로 에디터에 반영

### DB 핵심 필드
- Resume.extractedText: PDF 최초 추출 원본 (불변)
- Resume.editedText: 사용자 수정 텍스트 (재분석에 사용)
- Resume.version: 버전 번호 (재분석마다 증가)
- Resume.sections: 섹션별 파싱된 텍스트 (JSON)
- Resume.experienceLevel: 항상 "신입" (고정값, 경력 모드 없음)
- Resume.jobCategory: 직군 (13종)
- Analysis.expertiseScore: 전문성 점수 (기술스택 적합도)
- Analysis.experienceScore: 실무경험 점수
- Analysis.achievementScore: 성과/프로젝트 점수
- Analysis.communicationScore: 협업/커뮤니케이션 점수
- Analysis.structureScore: 이력서 구성/가독성 점수
- Analysis.totalScore: 5개 점수 평균 (반올림)
- Analysis.penalties: 감점 항목 (category, reason, deduction)

## 신입 전용 분석 특징
- **경력 모드 없음**: 모든 분석은 신입 기준으로만 평가
- **인턴 부재 감점 금지**: 정규 인턴 없어도 감점하지 않음
- **부트캠프/교육과정 강조**: 수료 경험이 점수에 긍정 반영
- **신입 평가 포인트**: 각 직군별 category-guide에 `newGradFocus`, `newGradScoreGuide` 포함
- **점수 상한**: 일부 항목은 신입 기준 최대 90점 (직군별 상이)

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
- @scorely/types에서 타입 import
- API 호출은 src/lib/api.ts의 axios 인스턴스 사용

## API 엔드포인트 목록
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/resume/upload                      # PDF 업로드 + 최초 분석
PATCH  /api/resume/:id/text                   # editedText 자동 저장
PATCH  /api/resume/:id/sections               # 섹션별 텍스트 저장
POST   /api/resume/:id/reanalyze              # 재분석 (새 버전 생성)
POST   /api/resume/:id/section-recommend      # 섹션별 AI 추천 (NEW)
GET    /api/resume/history                    # 전체 버전 목록
GET    /api/resume/:id                        # 특정 버전 상세
DELETE /api/resume/:id                        # 이력서 삭제

GET    /api/analysis/history                  # 점수 히스토리 (차트용)

GET    /health                                # 서버 상태 확인
GET    /docs                                  # Swagger UI

### section-recommend 상세
- Body: { sectionType, content, jobCategory }
- sectionType: 'summary' | 'experience' | 'projects' | 'awards' | 'education' | 'activities'
- Response: { recommendedText: string }
- 현재 분석의 improvements/penalties를 context로 Gemini에 전달

## 프론트엔드 페이지 구조
- `/` - 랜딩 (신입 취준생 타겟 UI)
- `/register` - 회원가입
- `/login` - 로그인
- `/upload` - PDF 업로드 + 직군 선택
- `/analysis/[id]` - 분석 결과 + TipTap 에디터 + RecommendPanel
- `/history` - 버전 히스토리 + 점수 차트

## 주요 컴포넌트
- `RecommendPanel.tsx` - 섹션별 AI 추천 사이드바 (NEW)
  - 상태: idle → loading → done/error
  - 적용 버튼으로 에디터에 직접 반영
- `ScoreDashboard.tsx` - 5개 점수 바 + 레이더 차트 + oneLiner
- `ResumeEditor.tsx` - TipTap 에디터 (각 섹션에 "AI 추천 받기" 버튼 포함)
- `RadarChart.tsx` - 5차원 레이더 차트
- `FeedbackList.tsx` - 강점/개선사항 리스트
- `HistoryChart.tsx` - 버전별 점수 추이 라인 차트

## 섹션 관련 상수 (apps/frontend/src/constants/sections.ts)
- `SECTION_ORDER`: summary, experience, education, training, projects, skills, certifications, activities, awards, coverLetter
- `RECOMMENDABLE_SECTIONS`: summary, experience, projects, awards, education, activities (AI 추천 가능 섹션)
- **coverLetter**: 에디터에서 편집 가능하나 재분석 텍스트에서 제외

## Gemini 서비스 구조 (apps/backend/src/services/gemini/)
- `analyze.ts` - 진입점 (analyzeResume, extractTextAndAnalyze, recommendSection)
- `prompt-builder.ts` - buildPrompt / buildExtractPrompt / buildSectionRecommendPrompt
- `response-parser.ts` - AI 응답 파싱/검증, totalScore 계산
- `types.ts` - 내부 타입 정의
- `category-guides/` - 직군별 가이드 13개 (각각 criteria, keywords, newGradFocus, newGradScoreGuide 포함)
- `common-guides.ts` - 공통 점수 가이드 (communication, structure)

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
'IT개발·데이터' | '디자인' | '마케팅·광고' | '경영·기획' | '영업·판매' |
'회계·세무·재무' | '인사·노무' | '의료·제약' | '금융·보험' | '연구·R&D' |
'교육' | '생산·제조' | '기타'

## 주의사항
- pnpm 사용 (npm, yarn 사용 금지)
- Fastify 사용 (Express 사용 금지)
- .env 파일 절대 커밋 금지
- AWS SDK v3 사용 (@aws-sdk/client-s3)
- Gemini model: "gemini-2.5-flash"
- Gemini 패키지: @google/genai
- JWT 만료: 7일
- PDF 최대 크기: 10MB
- bcryptjs saltRounds: 10
- experienceLevel은 항상 "신입" (경력 모드 코드 추가 금지)
- 재분석 시 editedText만 사용 (sections 데이터 미포함)
- coverLetter는 재분석 및 AI 추천 대상에서 제외

## PR 문서 작성 규칙
사용자가 "PR 작성해줘" 또는 "PR 문서 만들어줘"라고 하면 아래 절차를 자동으로 따른다.
- "백엔드 PR 작성해줘" → 백엔드 변경사항만 담은 문서 1개 생성
- "프론트 PR 작성해줘" → 프론트엔드 변경사항만 담은 문서 1개 생성
- "PR 작성해줘" (범위 미지정) → 백엔드/프론트엔드 각각 분리해서 문서 2개 생성

1. `git diff HEAD` 또는 `git log`로 변경 내용 파악
2. `docs/pr/` 디렉토리에서 가장 최근 PR 파일을 참고해 포맷 확인
3. 변경 범위에 맞는 파일명으로 `docs/pr/pr-{기능명}-{backend|frontend}.md` 생성
4. 포함 항목:
   - PR 제목 (feat/fix/refactor 컨벤션)
   - 설명 (변경 요약 bullet)
   - 🚀 git add/commit/push 명령어 (디렉토리 단위 add)
   - ✅ PR 체크리스트
   - 📊 변경 파일 트리
   - ⚠️ 주요 변경 포인트 표 (필요 시)
5. PR은 사용자가 직접 GitHub에서 올린다 (자동 push/PR 생성 금지)
