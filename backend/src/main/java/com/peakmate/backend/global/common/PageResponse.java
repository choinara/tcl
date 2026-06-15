package com.peakmate.backend.global.common;

import lombok.Builder;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 페이징 응답 DTO
 * <p>
 * Spring Data의 Page를 안정적인 JSON 구조로 변환
 *
 * @param <T> 컨텐츠 타입
 */
@Builder
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last,
        boolean empty
) {

    /**
     * Spring Page를 PageResponse로 변환
     *
     * @param page Spring Data Page
     * @return PageResponse
     */
    /**
     * 수동 페이징 데이터를 PageResponse로 변환
     *
     * @param content 컨텐츠 리스트
     * @param totalElements 전체 데이터 수
     * @param page 현재 페이지 (0-based)
     * @param size 페이지 크기
     * @return PageResponse
     */
    public static <T> PageResponse<T> of(List<T> content, long totalElements, int page, int size) {
        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        return PageResponse.<T>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .first(page == 0)
                .last(totalPages == 0 || page >= totalPages - 1)
                .empty(content.isEmpty())
                .build();
    }

    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .empty(page.isEmpty())
                .build();
    }
}
