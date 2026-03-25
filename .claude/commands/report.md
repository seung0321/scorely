---
description: 오늘 작업 내용을 분석해서 노션에 보고서로 저장한다
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git status:*)
---

<git_log>
!`git log --since="1 day ago" --oneline --all`
</git_log>

<git_diff>
!`git log --since="1 day ago" --oneline --stat`
</git_diff>

<git_commit_detail>
!`git log --since="1 day ago" --pretty=format:"[%h] %s%n%b" --all`
</git_commit_detail>

<git_files_changed>
!`git log --since="1 day ago" --name-status --pretty=format:"[%h] %s"`
</git_files_changed>

위 git 정보를 바탕으로 오늘 작업을 **깊이 있게 분석**해서 노션 페이지를 생성해줘.

분석 시 아래 사항을 반드시 파악해:
- 커밋 메시지와 변경 파일을 교차 분석해서 실제로 무슨 작업을 했는지 파악
- 단순 파일명 나열이 아닌, 왜 이 파일을 수정했는지 맥락을 설명
- 여러 커밋이 연관된 작업이면 하나의 흐름으로 묶어서 설명
- 에러 수정 커밋(fix:)이 있으면 어떤 문제가 있었는지 추론해서 작성

---

- 상위 페이지 제목: "AI 이력서 분석 - SCORELY"
- 새 페이지 제목: "YYYY-MM-DD 작업 내용 (핵심 작업 한 줄 요약)"
  예시: "2026-03-18 작업 내용 (Gemini 프롬프트 강화 및 ExperienceLevel 추가)"

---

페이지 내용 구성:

1. 📋 오늘 작업 요약
   - 오늘 전체 작업을 3~5줄로 요약
   - 단순 나열 말고 "왜 이 작업을 했는지" 맥락 포함
   - 예: "AI 피드백 품질 문제(점수 인플레이션, 날짜 오판)를 해결하기 위해 프롬프트를 전면 개편하고 신입/경력 구분 기능을 추가함"

2. ✅ 완료한 작업 목록
   - 커밋 단위가 아닌 기능/작업 단위로 그룹핑
   - 각 항목은 구체적으로 (파일명 + 무엇을 + 왜)
   - 예:
     - gemini.service.ts — CATEGORY_GUIDE에 13개 직군별 점수 기준표 추가 (점수 인플레이션 방지)
     - schema.prisma — experienceLevel 컬럼 추가 후 마이그레이션 (신입/경력 구분 저장)

3. 🔧 주요 변경 파일
   - 변경된 파일을 레이어별로 분류:
     📦 공유 타입 (packages/)
     🖥️ 백엔드 (apps/backend/)
     🎨 프론트엔드 (apps/frontend/)
   - 각 파일 옆에 변경 내용 한 줄 설명 추가
   - 추가(+)/수정(~)/삭제(-) 표시

4. ⚠️ 발생한 문제 & 해결 방법
   - fix: 커밋이나 에러 관련 커밋이 있으면 상세히 작성
   - 없으면 "특이사항 없음" 대신 "작업 중 주의했던 점" 으로 대체
   - 예: Prisma rename 마이그레이션 시 DROP→ADD 위험성 확인 후 진행

5. 📈 진행 현황
   - 전체 프로젝트 대비 오늘 작업이 어느 단계인지
   - 예: "백엔드 7단계 중 5단계 완료 / 프론트 구현 시작 전"

6. 💡 기술 메모 (선택, 오늘 새로 배웠거나 결정한 기술적 내용이 있을 때만)
   - 아키텍처 결정사항, 트레이드오프, 참고할 만한 내용

$ARGUMENTS가 있으면 맨 아래에 아래 섹션 추가:

8. 📝 추가 메모
   $ARGUMENTS