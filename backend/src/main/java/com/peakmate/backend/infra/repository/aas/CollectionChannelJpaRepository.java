package com.peakmate.backend.infra.repository.aas;

import com.peakmate.backend.domain.aas.entity.CollectionChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollectionChannelJpaRepository extends JpaRepository<CollectionChannel, Long> {
    Optional<CollectionChannel> findByChannelId(String channelId);
    List<CollectionChannel> findByUseYnOrderByCreatedAtAsc(String useYn);
}
