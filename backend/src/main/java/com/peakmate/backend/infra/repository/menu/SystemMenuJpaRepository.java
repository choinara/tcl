package com.peakmate.backend.infra.repository.menu;

import com.peakmate.backend.domain.menu.entity.SystemMenu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * SystemMenu Spring Data JPA Repository.
 */
public interface SystemMenuJpaRepository extends JpaRepository<SystemMenu, Long> {

    /**
     * useYn='Y'인 메뉴를 sortOrder 오름차순으로 조회합니다.
     */
    List<SystemMenu> findByUseYnOrderBySortOrderAsc(String useYn);

    /**
     * 모든 메뉴를 sortOrder 오름차순으로 조회합니다.
     */
    List<SystemMenu> findAllByOrderBySortOrderAsc();

    /**
     * 특정 부모 ID를 가진 자식 메뉴가 존재하는지 확인합니다.
     */
    boolean existsByParentId(Long parentId);

    /**
     * menuCode로 메뉴를 조회합니다.
     */
    Optional<SystemMenu> findByMenuCode(String menuCode);
}
