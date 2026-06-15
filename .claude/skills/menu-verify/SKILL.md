---
name: verify-menu
description: 신규 메뉴 등록 검증. Rule 8-6 8개 항목 자동 확인. 메뉴코드를 인자로 전달.
argument-hint: "[menuCode]"
user-invocable: true
context: fork
agent: verifier
allowed-tools: Read Glob Grep Bash
---

# /verify-menu — 메뉴 등록 검증

Rule 8-6의 8개 검증 항목을 자동으로 확인한다.

## 입력

- `$ARGUMENTS[0]` — 검증할 메뉴코드 (예: MM0200)

## 검증 항목

1. **DB 등록**: `system_menu`에 해당 menuCode 존재 + `use_yn = 'Y'`
2. **권한 부여**: `menu_role_permission`에 SUPER_ADMIN/ADMIN 권한 존재
3. **사이드바**: 재로그인 후 사이드바에 표시되는지 (DB 조회로 간접 확인)
4. **페이지 렌더링**: `App.tsx`에 해당 경로의 Route 존재
5. **메뉴권한관리**: `pathToMenuCode` 매핑에 해당 경로 존재
6. **메뉴관리 표시여부**: `menuConfig.ts`에 fallback 등록
7. **API 권한**: 백엔드 Controller에 `@RequirePermission` 적용
8. **라우트 보호**: 페이지 컴포넌트에 `usePermission(menuCode)` 적용

## 수행

`${CLAUDE_SKILL_DIR}/scripts/verify-menu.sh $ARGUMENTS[0]` 실행 + 코드 직접 확인.

## 출력 형식

```
[메뉴 등록 검증: MM0200]

1. DB system_menu:        PASS / FAIL
2. 권한 부여:             PASS / FAIL
3. 사이드바 표시:         PASS / FAIL
4. App.tsx Route:         PASS / FAIL
5. pathToMenuCode:        PASS / FAIL
6. menuConfig fallback:   PASS / FAIL
7. @RequirePermission:    PASS / FAIL
8. usePermission:         PASS / FAIL

결과: N/8 통과
```
