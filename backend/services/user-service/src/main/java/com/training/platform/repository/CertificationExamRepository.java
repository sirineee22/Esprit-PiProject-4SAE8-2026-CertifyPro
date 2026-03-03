package com.training.platform.repository;

import com.training.platform.entity.CertificationExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CertificationExamRepository extends JpaRepository<CertificationExam, Long> {
    List<CertificationExam> findByCertificationCode(String certificationCode);
}
