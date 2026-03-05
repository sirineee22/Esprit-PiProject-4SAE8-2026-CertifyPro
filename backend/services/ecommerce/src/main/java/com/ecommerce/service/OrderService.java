package com.ecommerce.service;


import com.ecommerce.dto.OrderDTO;
import com.ecommerce.dto.OrderLineDTO;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderLine;
import com.ecommerce.entity.Product;
 import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;
    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository, EmailService emailService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.emailService = emailService;
    }

    public Order createOrder(OrderDTO dto){

        Order order = new Order();

        order.setOrderDate(LocalDateTime.now());
        order.setFullName(dto.getFullName());
        order.setEmail(dto.getEmail());

        order.setAddress(dto.getAddress());
        order.setCity(dto.getCity());
        order.setPostalCode(dto.getPostalCode());
        order.setCountry(dto.getCountry());

        order.setPaymentMethod(dto.getPaymentMethod());

        List<OrderLine> lines = dto.getLines().stream().map(l -> {

            Product product = productRepository.findById(l.getProductId())
                    .orElseThrow();

            OrderLine line = new OrderLine();
            line.setProduct(product);
            line.setQuantity(l.getQuantity());
            line.setPrice(product.getPrice());
            line.setOrder(order);

            return line;

        }).toList();

        order.setOrderLines(lines);

        double total = lines.stream()
                .mapToDouble(l -> l.getPrice() * l.getQuantity())
                .sum();

        order.setTotalPrice(total);

        Order savedOrder = orderRepository.save(order);

        emailService.sendOrderConfirmation(
                dto.getEmail(),
                savedOrder.getId(),
                dto.getFullName()
        );

        return savedOrder;




    }   public List<Order> getAll(){
        return orderRepository.findAll();
    }

    public Order getById(Long id){
        return orderRepository.findById(id).orElseThrow();
    }

}