---
description: Prisma 마이그레이션 및 DB 관련 작업을 처리한다
argument-hint: [migrate | generate | studio | reset]
allowed-tools: Bash(pnpm:*), Bash(npx:*)
---

apps/backend 디렉토리에서 아래 작업 실행:

$ARGUMENTS에 따라:
- "migrate": pnpm prisma migrate dev 실행
  - 마이그레이션 이름을 물어봐줘
- "generate": pnpm prisma generate 실행
- "studio": pnpm prisma studio 실행 (브라우저에서 DB 확인)
- "reset": pnpm prisma migrate reset 실행
  - 경고: DB가 초기화됨. 진행할지 먼저 확인해줘
- 없으면 현재 마이그레이션 상태를 보여줘

실행 후 결과를 요약해서 알려줘.
