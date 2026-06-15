package com.peakmate.backend.infra.repository.commoncode;

import com.peakmate.backend.domain.commoncode.entity.CommonCode;
import com.peakmate.backend.domain.commoncode.entity.CommonCodeGroup;
import com.peakmate.backend.domain.commoncode.entity.QCommonCode;
import com.peakmate.backend.domain.commoncode.entity.QCommonCodeGroup;
import com.peakmate.backend.domain.commoncode.repository.CommonCodeRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * CommonCodeRepository 구현체.
 * QueryDSL을 사용하여 COMMON_CODE와 COMMON_CODE_GROUP을 조인합니다.
 */
@Repository
@RequiredArgsConstructor
public class CommonCodeRepositoryImpl implements CommonCodeRepository {

    private final CommonCodeJpaRepository commonCodeJpaRepository;
    private final CommonCodeGroupJpaRepository commonCodeGroupJpaRepository;
    private final JPAQueryFactory queryFactory;

    /**
     * 그룹코드로 사용 중인 공통코드 목록 조회.
     *
     * <p>COMMON_CODE와 COMMON_CODE_GROUP을 code.groupId = group.id 조건으로 조인하여
     * group.groupCode = :groupCode AND code.useYn = 'Y' 인 코드를
     * code.sortOrder ASC 순으로 반환합니다.</p>
     *
     * @param groupCode 그룹 코드
     * @return 사용 중인 공통코드 목록 (sortOrder ASC)
     */
    @Override
    public List<CommonCode> findByGroupCode(String groupCode) {
        QCommonCode code = QCommonCode.commonCode;
        QCommonCodeGroup group = QCommonCodeGroup.commonCodeGroup;

        return queryFactory
            .selectFrom(code)
            .join(group).on(code.groupId.eq(group.id))
            .where(
                group.groupCode.eq(groupCode),
                code.useYn.eq("Y")
            )
            .orderBy(code.sortOrder.asc())
            .fetch();
    }

    /**
     * 전체 공통코드 그룹 목록 조회.
     *
     * @return 전체 공통코드 그룹 목록
     */
    @Override
    public List<CommonCodeGroup> findAllGroups() {
        return commonCodeGroupJpaRepository.findAll();
    }
}
