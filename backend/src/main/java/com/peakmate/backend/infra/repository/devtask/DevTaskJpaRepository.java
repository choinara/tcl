package com.peakmate.backend.infra.repository.devtask;

import com.peakmate.backend.domain.devtask.entity.DevTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DevTaskJpaRepository extends JpaRepository<DevTask, Long> {
    List<DevTask> findAllByOrderByIdAsc();
    Optional<DevTask> findByTaskCode(String taskCode);
    List<DevTask> findByUseYnOrderByIdAsc(String useYn);
}
