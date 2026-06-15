package com.peakmate.backend.domain.aas.service;

import com.peakmate.backend.domain.aas.entity.CollectedData;
import com.peakmate.backend.domain.aas.entity.CollectionChannel;
import com.peakmate.backend.infra.repository.aas.CollectedDataJpaRepository;
import com.peakmate.backend.infra.repository.aas.CollectionChannelJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 수집 모니터링 도메인 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CollectionMonitorDomainService {

    private final CollectionChannelJpaRepository channelRepository;
    private final CollectedDataJpaRepository collectedDataRepository;

    // =========================================================================
    // Channel
    // =========================================================================

    @Transactional(readOnly = true)
    public List<CollectionChannel> getAllChannels() {
        return channelRepository.findByUseYnOrderByCreatedAtAsc("Y");
    }

    @Transactional(readOnly = true)
    public Optional<CollectionChannel> findChannelById(String channelId) {
        return channelRepository.findByChannelId(channelId);
    }

    @Transactional
    public CollectionChannel toggleChannel(String channelId) {
        CollectionChannel ch = channelRepository.findByChannelId(channelId)
                .orElseThrow(() -> new IllegalArgumentException("채널을 찾을 수 없습니다: " + channelId));
        ch.toggleActive();
        return channelRepository.save(ch);
    }

    // =========================================================================
    // Collected Data
    // =========================================================================

    @Transactional(readOnly = true)
    public List<CollectedData> getRecentData() {
        return collectedDataRepository.findTop200ByOrderByCollectedAtDesc();
    }

    @Transactional
    public CollectedData saveData(String nodeId, String channelId, String value) {
        CollectedData data = CollectedData.create(nodeId, channelId, value);
        return collectedDataRepository.save(data);
    }
}
