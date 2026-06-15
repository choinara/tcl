package com.peakmate.backend.infra.aas;

import com.peakmate.backend.domain.aas.entity.OpcuaBatchPending;
import com.peakmate.backend.infra.repository.aas.OpcuaBatchPendingJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class OpcuaBatchPendingRepositoryTest {

    @TestConfiguration
    @EnableJpaAuditing(auditorAwareRef = "testAuditorProvider")
    static class TestAuditingConfig {
        @Bean
        public AuditorAware<String> testAuditorProvider() {
            return () -> Optional.of("test-user");
        }
    }

    @Autowired
    private OpcuaBatchPendingJpaRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        repository.save(OpcuaBatchPending.create("[{\"a\":1}]", "error-1"));
        OpcuaBatchPending dead = OpcuaBatchPending.create("[{\"b\":2}]", "error-2");
        dead.markDead();
        repository.save(dead);
        OpcuaBatchPending done = OpcuaBatchPending.create("[{\"c\":3}]", "error-3");
        done.markDone();
        repository.save(done);
    }

    @Test
    @DisplayName("countByStatusGrouped는 상태별 건수를 집계한다")
    void countByStatusGrouped_shouldReturnCounts() {
        List<Object[]> result = repository.countByStatusGrouped();

        assertThat(result).isNotEmpty();
        long total = result.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        assertThat(total).isEqualTo(3);
    }

    @Test
    @DisplayName("findByStatusInOrderByCreatedAtDesc는 지정 상태만 반환한다")
    void findByStatusIn_shouldFilterByStatus() {
        Page<OpcuaBatchPending> page = repository.findByStatusInOrderByCreatedAtDesc(
                List.of("PENDING", "DEAD"), PageRequest.of(0, 20));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).extracting(OpcuaBatchPending::getStatus)
                .containsOnly("PENDING", "DEAD");
    }

    @Test
    @DisplayName("deleteAllDead는 DEAD 상태 항목만 삭제하고 건수를 반환한다")
    void deleteAllDead_shouldDeleteOnlyDeadItems() {
        int deleted = repository.deleteAllDead();

        assertThat(deleted).isEqualTo(1);
        assertThat(repository.findAll()).hasSize(2);
    }
}
