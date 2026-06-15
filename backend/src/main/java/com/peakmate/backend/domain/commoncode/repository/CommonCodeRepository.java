package com.peakmate.backend.domain.commoncode.repository;

import com.peakmate.backend.domain.commoncode.entity.CommonCode;
import com.peakmate.backend.domain.commoncode.entity.CommonCodeGroup;

import java.util.List;

/**
 * CommonCode Repository 인터페이스.
 * Domain 계층에서 정의하고, Infra 계층에서 구현합니다.
 */
public interface CommonCodeRepository {

    /**
     * 그룹코드로 사용 중인 공통코드 목록 조회.
     * COMMON_CODE와 COMMON_CODE_GROUP을 groupId = group.id 조건으로 조인하여
     * groupCode가 일치하고 useYn = 'Y'인 코드를 sortOrder ASC 정렬로 반환합니다.
     *
     * @param groupCode 그룹 코드
     * @return 공통코드 목록
     */
    List<CommonCode> findByGroupCode(String groupCode);

    /**
     * 전체 공통코드 그룹 목록 조회.
     *
     * @return 공통코드 그룹 목록
     */
    List<CommonCodeGroup> findAllGroups();
}
