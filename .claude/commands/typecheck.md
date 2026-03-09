---
description: 백엔드/프론트엔드 TypeScript 타입 오류를 검사한다
argument-hint: [backend | frontend | all]
model: haiku
allowed-tools: Bash(pnpm:*)
---

$ARGUMENTS에 따라 타입체크 실행:
- "backend": cd apps/backend && pnpm tsc --noEmit
- "frontend": cd apps/frontend && pnpm tsc --noEmit
- 없거나 "all": 두 곳 모두 실행

오류가 있으면:
1. 어떤 파일에서 오류가 났는지
2. 오류 내용이 무엇인지
3. 어떻게 고치면 되는지

를 정리해서 알려줘.
any 타입 사용한 곳이 있으면 같이 알려줘.
