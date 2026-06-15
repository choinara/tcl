package com.peakmate.backend.domain.usertab.service;

import com.peakmate.backend.domain.usertab.entity.UserOpenTab;
import com.peakmate.backend.domain.usertab.repository.UserOpenTabRepository;
import com.peakmate.backend.interfaces.usertab.dto.request.TabItemDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * UserOpenTabDomainService 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
class UserOpenTabDomainServiceTest {

    @Mock
    private UserOpenTabRepository repository;

    @InjectMocks
    private UserOpenTabDomainService service;

    @Captor
    private ArgumentCaptor<List<UserOpenTab>> tabListCaptor;

    private static final Long USER_ID = 1L;

    @BeforeEach
    void setUp() {
        // Mockito 초기화는 @ExtendWith가 처리
    }

    @Test
    @DisplayName("replaceAll - 정상 저장: 새 row 삽입")
    void replaceAll_normalSave() {
        List<TabItemDto> items = List.of(
                new TabItemDto("/warehouse/pre-inbound", "WH0010", "가입고등록"),
                new TabItemDto("/production/plan", "PD0010", "생산계획")
        );

        service.replaceAll(USER_ID, items, "/warehouse/pre-inbound");

        verify(repository).deleteByAdminUserId(USER_ID);
        verify(repository).saveAll(tabListCaptor.capture());

        List<UserOpenTab> saved = tabListCaptor.getValue();
        assertThat(saved).hasSize(2);
        assertThat(saved.get(0).getTabPath()).isEqualTo("/warehouse/pre-inbound");
        assertThat(saved.get(0).getIsActive()).isTrue();
        assertThat(saved.get(0).getSortOrder()).isEqualTo(0);
        assertThat(saved.get(1).getTabPath()).isEqualTo("/production/plan");
        assertThat(saved.get(1).getIsActive()).isFalse();
        assertThat(saved.get(1).getSortOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("replaceAll - 기존 삭제 후 재삽입 (멱등성)")
    void replaceAll_idempotent() {
        List<TabItemDto> items = List.of(
                new TabItemDto("/", null, "Dashboard")
        );

        service.replaceAll(USER_ID, items, "/");
        service.replaceAll(USER_ID, items, "/");

        verify(repository, times(2)).deleteByAdminUserId(USER_ID);
        verify(repository, times(2)).saveAll(any());
    }

    @Test
    @DisplayName("replaceAll - 빈 배열 시 전체 삭제만 수행")
    void replaceAll_emptyList_deletesOnly() {
        service.replaceAll(USER_ID, List.of(), null);

        verify(repository).deleteByAdminUserId(USER_ID);
        verify(repository, never()).saveAll(any());
    }

    @Test
    @DisplayName("replaceAll - null 배열 시 전체 삭제만 수행")
    void replaceAll_nullList_deletesOnly() {
        service.replaceAll(USER_ID, null, null);

        verify(repository).deleteByAdminUserId(USER_ID);
        verify(repository, never()).saveAll(any());
    }

    @Test
    @DisplayName("findByUser - sortOrder ASC 정렬 조회")
    void findByUser_sortOrder() {
        UserOpenTab tab1 = UserOpenTab.create(USER_ID, "/", null, 0, false, "Dashboard");
        UserOpenTab tab2 = UserOpenTab.create(USER_ID, "/production/plan", "PD0010", 1, true, "생산계획");
        when(repository.findByAdminUserIdOrderBySortOrderAsc(USER_ID))
                .thenReturn(List.of(tab1, tab2));

        List<UserOpenTab> result = service.findByUser(USER_ID);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getSortOrder()).isEqualTo(0);
        assertThat(result.get(1).getSortOrder()).isEqualTo(1);
        assertThat(result.get(1).getIsActive()).isTrue();
    }

    @Test
    @DisplayName("clearAll - 사용자의 모든 탭 삭제")
    void clearAll_deletesAll() {
        service.clearAll(USER_ID);

        verify(repository).deleteByAdminUserId(USER_ID);
    }
}
