---
description: 백엔드 API 엔드포인트를 테스트한다
argument-hint: [auth | resume | analysis | all]
allowed-tools: Bash(curl:*)
---

백엔드 서버가 http://localhost:3000에서 실행 중이라고 가정.

$ARGUMENTS에 따라 테스트:

"auth":
  1. POST /api/auth/register (테스트 계정 생성)
  2. POST /api/auth/login
  3. GET /api/auth/me (토큰 사용)

"resume":
  - 먼저 로그인해서 토큰 획득
  - GET /api/resume/history
  - (PDF 파일 없으면 업로드 테스트는 스킵)

"analysis":
  - 먼저 로그인해서 토큰 획득
  - GET /api/analysis/history

"all": 위 전부 순서대로 실행

GET /health 먼저 확인해서 서버가 실행 중인지 체크해줘.
서버가 안 켜져 있으면 알려줘.

각 테스트 결과를 표로 정리해줘:
| 엔드포인트 | 상태코드 | 결과 |
