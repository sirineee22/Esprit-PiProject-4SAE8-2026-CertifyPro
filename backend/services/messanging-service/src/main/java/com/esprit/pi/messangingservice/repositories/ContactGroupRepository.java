package com.esprit.pi.messangingservice.repositories;
// repository/ContactGroupRepository.java

import com.esprit.pi.messangingservice.entities.ContactGroup;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ContactGroupRepository
        extends MongoRepository<ContactGroup, String> {
    List<ContactGroup> findByOwnerIdOrderByTitleAsc(String ownerId);
}