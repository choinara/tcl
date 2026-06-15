package com.peakmate.backend.domain.memo.repository;

import com.peakmate.backend.domain.memo.entity.MenuMemo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuMemoRepository extends JpaRepository<MenuMemo, Long> {

    List<MenuMemo> findByMenuCodeOrderByCreatedAtAsc(String menuCode);

    boolean existsByMenuCode(String menuCode);
}
