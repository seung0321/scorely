---
description: 변경사항을 커밋 컨벤션에 맞게 커밋한다
argument-hint: [커밋 메시지]
model: haiku
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git status:*), Bash(git diff:*)
---

<git_status>
!`git status`
</git_status>

<git_diff>
!`git diff --cached`
</git_diff>

위 변경사항을 보고 아래 커밋 컨벤션에 맞게 커밋해줘.

커밋 컨벤션:
- feat: 새 기능
- fix: 버그 수정
- chore: 설정/환경/패키지
- refactor: 리팩토링
- docs: 문서
- test: 테스트

$ARGUMENTS가 있으면 그걸 커밋 메시지로 사용.
없으면 변경사항을 분석해서 적절한 메시지를 만들어줘.

형식: "type: 메시지"
예시: "feat: 이력서 업로드 API 구현"
