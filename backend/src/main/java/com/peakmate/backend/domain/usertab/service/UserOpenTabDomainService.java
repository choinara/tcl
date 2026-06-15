package com.peakmate.backend.domain.usertab.service;

import com.peakmate.backend.domain.usertab.entity.UserOpenTab;
import com.peakmate.backend.domain.usertab.repository.UserOpenTabRepository;
import com.peakmate.backend.interfaces.usertab.dto.request.TabItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 사용자별 열린 탭 세션 도메인 서비스.
 * 전체 삭제 후 재삽입 전략 (탭 수가 평균 5~20개로 소량).
 */
@Service
@Transactional
@RequiredArgsConstructor
public class UserOpenTabDomainService {

    private final UserOpenTabRepository repository;

    /**
     * 사용자의 탭 세션을 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<UserOpenTab> findByUser(Long adminUserId) {
        return repository.findByAdminUserIdOrderBySortOrderAsc(adminUserId);
    }

    /**
     * 사용자의 탭 세션을 일괄 교체합니다 (멱등).
     * 기존 데이터를 모두 삭제 후 새로 삽입합니다.
     */
    public void replaceAll(Long adminUserId, List<TabItemDto> items, String activePath) {
        repository.deleteByAdminUserId(adminUserId);

        if (items == null || items.isEmpty()) {
            return;
        }

        int order = 0;
        List<UserOpenTab> entities = new ArrayList<>();
        for (TabItemDto item : items) {
            boolean isActive = activePath != null && activePath.equals(item.path());
            entities.add(UserOpenTab.create(
                    adminUserId, item.path(), item.menuCode(), order++, isActive, item.label()
            ));
        }
        repository.saveAll(entities);
    }

    /**
     * 사용자의 탭 세션을 모두 삭제합니다.
     */
    public void clearAll(Long adminUserId) {
        repository.deleteByAdminUserId(adminUserId);
    }
}
