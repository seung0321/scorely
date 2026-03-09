---
description: 백엔드/프론트엔드 개발 서버를 실행한다
argument-hint: [backend | frontend | all]
---

$ARGUMENTS가 "backend"이면 apps/backend만,
"frontend"이면 apps/frontend만,
없거나 "all"이면 루트에서 pnpm dev로 전체 실행.

실행 전 아래를 확인해줘:
1. apps/backend/.env 파일 존재 여부
2. apps/frontend/.env.local 파일 존재 여부
3. prisma migrate 상태

없으면 어떤 파일이 없는지 알려주고 .env.example을 참고해서 만들어달라고 안내해줘.
