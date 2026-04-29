package com.training.platform.repository;

import com.training.platform.entity.Certification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CertificationRepository extends JpaRepository<Certification, Long> {
    List<Certification> findByIsActive(Boolean isActive);

    Page<Certification> findByIsActive(Boolean isActive, Pageable pageable);
}
