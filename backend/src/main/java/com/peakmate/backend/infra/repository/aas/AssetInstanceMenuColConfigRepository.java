package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.AssetInstanceMenuColConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssetInstanceMenuColConfigRepository extends JpaRepository<AssetInstanceMenuColConfig, String> {
    Optional<AssetInstanceMenuColConfig> findByMenuCode(String menuCode);
}
