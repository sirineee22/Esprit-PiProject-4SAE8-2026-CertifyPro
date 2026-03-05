package com.ecommerce.dto;

import lombok.Data;

@Data
public class ProductDTO {

    private Long id;

    private String name;

    private String description;

    private double price;

    private int stock;
}