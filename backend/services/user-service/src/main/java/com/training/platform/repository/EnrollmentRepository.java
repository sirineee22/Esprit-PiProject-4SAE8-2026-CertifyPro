package com.training.platform.repository;

import com.training.platform.entity.Enrollment;
import com.training.platform.entity.Session;
import com.training.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByUser(User user);

    List<Enrollment> findBySession(Session session);
}
