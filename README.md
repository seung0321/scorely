# Resumate

AI 기반 이력서 분석 및 개선 웹 서비스

## 서비스 개요

취준생이 PDF 이력서를 업로드하면 Gemini AI가 직군별로 분석하고, TipTap 에디터에서 텍스트를 수정하며 재분석받을 수 있다. 버전마다 점수 변화를 추적하는 히스토리 기능 포함.

**핵심 사용 흐름**
1. PDF 업로드 → AI가 텍스트 추출 + 직군별 분석
2. 점수 & 피드백 확인
3. TipTap 에디터에서 텍스트 직접 수정 (자동 저장)
4. 재분석 버튼 → 새 점수 확인
5. 텍스트 복사 → 원래 이력서에 붙여넣기

## 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | Node.js + Fastify + TypeScript + Prisma + PostgreSQL |
| 프론트엔드 | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| AI | Google Gemini 1.5 Flash |
| 파일 저장 | AWS S3 |
| 인증 | JWT + bcrypt |
| 에디터 | TipTap |
| 차트 | Chart.js + react-chartjs-2 |
| 패키지 관리 | pnpm workspace (모노레포) |

## 프로젝트 구조

```
resumate/
├── apps/
│   ├── backend/    # Fastify API 서버
│   └── frontend/   # Next.js 웹 앱
└── packages/
    └── types/      # 공유 타입 (@resumate/types)
```

## 로컬 실행

### 사전 요건
- Node.js 20+
- pnpm
- PostgreSQL (또는 AWS RDS)

### 설치

```bash
pnpm install
```

### 환경변수 설정

```bash
# apps/backend/.env
cp apps/backend/.env.example apps/backend/.env
# DATABASE_URL, JWT_SECRET, AWS_*, GEMINI_API_KEY 입력

# apps/frontend/.env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > apps/frontend/.env.local
```

### DB 마이그레이션

```bash
cd apps/backend
pnpm prisma migrate dev
```

### 실행

```bash
# 백엔드 + 프론트엔드 동시 실행
pnpm dev

# 백엔드: http://localhost:3000
# 프론트엔드: http://localhost:3001
# Swagger: http://localhost:3000/docs
```

## 배포 아키텍처

```
사용자
  │
  ├─▶ Vercel (프론트엔드 / Next.js)
  │
  └─▶ AWS EC2 + Nginx + PM2 (백엔드 / Fastify)
            │
            ├─▶ AWS RDS PostgreSQL
            ├─▶ AWS S3 (PDF 저장)
            └─▶ Google Gemini API
```

### 배포 설정

| 서비스 | 설정 파일 |
|--------|----------|
| PM2 | `apps/backend/ecosystem.config.js` |
| Nginx | `apps/backend/nginx.conf` |
| EC2 초기화 | `scripts/setup-ec2.sh` |
| Vercel | `apps/frontend/vercel.json` |
| CI/CD | `.github/workflows/deploy-*.yml` |

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/auth/me` | 내 정보 |
| POST | `/api/resume/upload` | PDF 업로드 + 분석 |
| PATCH | `/api/resume/:id/text` | 텍스트 자동 저장 |
| POST | `/api/resume/:id/reanalyze` | 재분석 |
| GET | `/api/resume/history` | 버전 목록 |
| GET | `/api/resume/:id` | 버전 상세 |
| GET | `/api/analysis/history` | 점수 히스토리 |

## 직군 목록

백엔드 개발자 · 프론트엔드 개발자 · 기획자 · 마케터 · 디자이너 · 데이터 분석가
