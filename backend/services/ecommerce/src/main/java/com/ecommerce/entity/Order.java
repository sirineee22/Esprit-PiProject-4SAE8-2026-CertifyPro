package com.ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime orderDate;

    private double totalPrice;

    /* ===== CUSTOMER INFO ===== */

    private String fullName;

    private String email;

    /* ===== SHIPPING ===== */

    private String address;

    private String city;

    private String postalCode;

    private String country;

    /* ===== PAYMENT ===== */

    private String paymentMethod;

    /* ===== RELATIONS ===== */

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @JsonBackReference

    private List<OrderLine> orderLines;
}