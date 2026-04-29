package com.training.platform.repository;

import com.training.platform.entity.Workgroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkgroupRepository extends JpaRepository<Workgroup, Long> {
    List<Workgroup> findByVisibility(Workgroup.GroupVisibility visibility);

    List<Workgroup> findByTeacherId(Long teacherId);
}
