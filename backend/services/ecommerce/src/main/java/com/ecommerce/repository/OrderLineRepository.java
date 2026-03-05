package com.ecommerce.repository;

 import com.ecommerce.entity.OrderLine;
 import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderLineRepository extends JpaRepository<OrderLine, Long> {
}