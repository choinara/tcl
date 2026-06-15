package com.peakmate.backend.interfaces.memo.controller;

import com.peakmate.backend.domain.admin.entity.AdminUser;
import com.peakmate.backend.domain.admin.repository.AdminUserRepository;
import com.peakmate.backend.domain.memo.entity.MenuMemo;
import com.peakmate.backend.domain.memo.repository.MenuMemoRepository;
import com.peakmate.core.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

/**
 * 메뉴별 메모 Controller -- DB 기반.
 * menu_memo 테이블에 대화형으로 메모를 저장/조회한다.
 */
@Slf4j
@RestController
@RequestMapping("/api/menu-memos")
@RequiredArgsConstructor
public class MenuMemoController {

    private final AdminUserRepository adminUserRepository;
    private final MenuMemoRepository menuMemoRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final Pattern MENU_CODE_PATTERN = Pattern.compile("^[A-Z]{2}\\d{4}$");

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ApiResponse<Void>> handleException(RuntimeException ex) {
        log.warn("MenuMemo 처리 오류: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.error("MEMO999", ex.getMessage()));
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> findByMenuCode(@RequestParam String menuCode) {
        validateMenuCode(menuCode);

        List<MenuMemo> memos = menuMemoRepository.findByMenuCodeOrderByCreatedAtAsc(menuCode);
        List<Map<String, Object>> entries = memos.stream().map(this::toMap).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", entries);
        response.put("totalElements", entries.size());
        return ApiResponse.success(response);
    }

    @GetMapping("/exists")
    public ApiResponse<Map<String, Object>> existsByMenuCode(@RequestParam String menuCode) {
        validateMenuCode(menuCode);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("exists", menuMemoRepository.existsByMenuCode(menuCode));
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> append(@RequestBody Map<String, Object> request) {
        String menuCode = (String) request.get("menuCode");
        String content = (String) request.get("content");

        validateMenuCode(menuCode);

        if (content == null || content.isBlank()) {
            return ApiResponse.error("MEMO002", "메모 내용은 필수입니다.");
        }

        AdminUser currentUser = getCurrentUser();
        MenuMemo memo = MenuMemo.create(menuCode, currentUser.getName(), content.trim());
        menuMemoRepository.save(memo);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "메모가 저장되었습니다");
        return ApiResponse.success(result);
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        String content = (String) request.get("content");
        if (content == null || content.isBlank()) {
            return ApiResponse.error("MEMO002", "메모 내용은 필수입니다.");
        }
        MenuMemo memo = menuMemoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("메모를 찾을 수 없습니다. id=" + id));
        memo.updateContent(content.trim());
        menuMemoRepository.save(memo);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "메모가 수정되었습니다");
        return ApiResponse.success(result);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Object>> delete(@PathVariable Long id) {
        if (!menuMemoRepository.existsById(id)) {
            throw new IllegalArgumentException("메모를 찾을 수 없습니다. id=" + id);
        }
        menuMemoRepository.deleteById(id);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "메모가 삭제되었습니다");
        return ApiResponse.success(result);
    }

    private void validateMenuCode(String menuCode) {
        if (menuCode == null || !MENU_CODE_PATTERN.matcher(menuCode).matches()) {
            throw new IllegalArgumentException("유효하지 않은 메뉴코드: " + menuCode);
        }
    }

    private AdminUser getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("현재 사용자를 찾을 수 없습니다"));
    }

    private Map<String, Object> toMap(MenuMemo memo) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("id", memo.getId());
        entry.put("author", memo.getAuthor());
        entry.put("date", memo.getCreatedAt().format(DATE_FMT));
        entry.put("content", memo.getContent());
        return entry;
    }
}
