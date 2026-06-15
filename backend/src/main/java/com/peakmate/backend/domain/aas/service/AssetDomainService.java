package com.peakmate.backend.domain.aas.service;

import com.peakmate.backend.domain.aas.entity.AssetInstance;
import com.peakmate.backend.domain.aas.entity.AssetInstanceMenuColConfig;
import com.peakmate.backend.domain.aas.entity.AssetType;
import com.peakmate.backend.infra.repository.aas.AssetInstanceJpaRepository;
import com.peakmate.backend.infra.repository.aas.AssetInstanceMenuColConfigRepository;
import com.peakmate.backend.infra.repository.aas.AssetTypeJpaRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetDomainService {

    private final AssetTypeJpaRepository assetTypeJpaRepository;
    private final AssetInstanceJpaRepository assetInstanceJpaRepository;
    private final AssetInstanceMenuColConfigRepository colConfigRepository;

    // =========================================================================
    // Asset Type
    // =========================================================================

    @Transactional(readOnly = true)
    public List<AssetType> getAllTypes() {
        return assetTypeJpaRepository.findByUseYnOrderByCreatedAtAsc("Y");
    }

    @Transactional(readOnly = true)
    public Optional<AssetType> findByTypeCode(String typeCode) {
        return assetTypeJpaRepository.findByTypeCode(typeCode);
    }

    @Transactional
    public AssetType saveType(AssetType assetType) {
        return assetTypeJpaRepository.save(assetType);
    }

    @Transactional
    public void deleteType(String typeCode) {
        long instanceCount = assetInstanceJpaRepository.countByTypeCode(typeCode);
        if (instanceCount > 0) {
            throw new IllegalStateException("해당 타입에 " + instanceCount + "개의 인스턴스가 존재하여 삭제할 수 없습니다.");
        }
        assetTypeJpaRepository.deleteByTypeCode(typeCode);
    }

    // =========================================================================
    // Asset Instance
    // =========================================================================

    @Transactional(readOnly = true)
    public List<AssetInstance> getAllInstances() {
        return assetInstanceJpaRepository.findByUseYnOrderByCreatedAtAsc("Y");
    }

    @Transactional(readOnly = true)
    public List<AssetInstance> getInstancesByTypeCode(String typeCode) {
        return assetInstanceJpaRepository.findByTypeCodeAndUseYnOrderByCreatedAtAsc(typeCode, "Y");
    }

    @Transactional(readOnly = true)
    public Optional<AssetInstance> findByInstanceId(String instanceId) {
        return assetInstanceJpaRepository.findByInstanceId(instanceId);
    }

    @Transactional(readOnly = true)
    public Optional<AssetInstance> findInstanceById(Long id) {
        return assetInstanceJpaRepository.findById(id);
    }

    @Transactional
    public AssetInstance saveInstance(AssetInstance instance) {
        return assetInstanceJpaRepository.save(instance);
    }

    @Transactional
    public void deleteInstanceById(Long id) {
        assetInstanceJpaRepository.deleteById(id);
    }

    @Transactional
    public AssetInstance linkToMaster(Long id, String menuCode, Long recordId,
                                      List<AssetInstance.LinkedColumnEntry> columns) {
        AssetInstance instance = assetInstanceJpaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AssetInstance not found: " + id));
        instance.link(menuCode, recordId, columns);
        return instance;
    }

    @Transactional
    public AssetInstance unlinkFromMaster(Long id) {
        AssetInstance instance = assetInstanceJpaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AssetInstance not found: " + id));
        instance.unlink();
        return instance;
    }

    // =========================================================================
    // Col Config (Q7 B안)
    // =========================================================================

    @Transactional(readOnly = true)
    public Optional<AssetInstanceMenuColConfig> findColConfig(String menuCode) {
        return colConfigRepository.findByMenuCode(menuCode);
    }

    @Transactional
    public AssetInstanceMenuColConfig upsertColConfig(String menuCode,
                                                      List<AssetInstanceMenuColConfig.ColKeyEntry> colKeys) {
        AssetInstanceMenuColConfig config = colConfigRepository.findByMenuCode(menuCode)
                .orElseGet(() -> AssetInstanceMenuColConfig.create(menuCode, colKeys));
        config.updateColKeys(colKeys);
        return colConfigRepository.save(config);
    }
}
