package com.peakmate.backend.domain.commoncode.service;

import com.peakmate.backend.domain.commoncode.entity.CommonCode;
import com.peakmate.backend.domain.commoncode.entity.CommonCodeGroup;
import com.peakmate.backend.domain.commoncode.repository.CommonCodeRepository;
import com.peakmate.backend.infra.repository.commoncode.CommonCodeGroupJpaRepository;
import com.peakmate.backend.infra.repository.commoncode.CommonCodeJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 공통코드 도메인 서비스.
 * 공통코드 조회 관련 도메인 로직을 담당합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommonCodeDomainService {

    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeJpaRepository commonCodeJpaRepository;
    private final CommonCodeGroupJpaRepository commonCodeGroupJpaRepository;

    /**
     * 그룹코드에 해당하는 사용 중인 공통코드 목록을 조회합니다.
     *
     * @param groupCode 그룹 코드
     * @return 공통코드 목록 (sortOrder ASC)
     */
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "commonCodes", key = "#groupCode")
    public List<CommonCode> getCodesByGroup(String groupCode) {
        log.debug("[공통코드 조회] groupCode={}", groupCode);
        return commonCodeRepository.findByGroupCode(groupCode);
    }

    /**
     * 전체 공통코드 그룹 목록을 조회합니다.
     *
     * @return 공통코드 그룹 목록
     */
    @Transactional(readOnly = true)
    public List<CommonCodeGroup> getAllGroups() {
        log.debug("[공통코드 그룹 전체 조회]");
        return commonCodeRepository.findAllGroups();
    }

    /**
     * 공통코드 그룹 삭제 (하위 코드 포함)
     */
    @Transactional
    public void deleteGroup(Long groupId) {
        commonCodeJpaRepository.deleteByGroupId(groupId);
        commonCodeGroupJpaRepository.deleteById(groupId);
    }

    /**
     * 공통코드 삭제
     */
    @Transactional
    public void deleteCode(Long codeId) {
        commonCodeJpaRepository.deleteById(codeId);
    }
}
