package com.training.platform.repository;

import com.training.platform.entity.CertificationAttempt;
import com.training.platform.entity.CertificationExam;
import com.training.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CertificationAttemptRepository extends JpaRepository<CertificationAttempt, Long> {
    List<CertificationAttempt> findByUser(User user);

    List<CertificationAttempt> findByCertificationExam(CertificationExam exam);
}
