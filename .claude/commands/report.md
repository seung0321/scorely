---
description: 오늘 작업 내용을 분석해서 노션에 보고서로 저장한다
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git status:*)
---

<git_log>
!`git log --since="today" --oneline --all`
</git_log>

<git_diff>
!`git diff HEAD~$(git log --since="today" --oneline | wc -l) HEAD`
</git_diff>

위 오늘의 작업 내용을 분석해서 아래 형식으로 노션 페이지를 생성해줘.
그리고 새 페이지 제목 뒤에는 어떤 내용을 작업했는지 제목으로 짧게 넣어줘

- 상위 페이지 제목: "AI 이력서 분석 - RESUMATE"
- 새 페이지 제목: "YYYY-MM-DD 작업 내용 (어떤것을했는지 작성)"

페이지 내용 구성:
1. 📋 오늘 작업 요약 (2~3줄)
2. ✅ 완료한 작업 목록
3. 🔧 주요 변경 파일
4. ⚠️ 발생한 문제 & 해결 방법

$ARGUMENTS가 있으면 "추가 메모" 섹션으로 맨 아래 추가해줘.
