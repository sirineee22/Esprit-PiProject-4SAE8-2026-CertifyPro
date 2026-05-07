package com.ecommerce.service;

import com.ecommerce.dto.OrderDTO;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderLine;
import com.ecommerce.entity.Product;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            EmailService emailService
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.emailService = emailService;
    }

    ///////////////////////////////////////////////////////////
    // CREATE ORDER
    ///////////////////////////////////////////////////////////

    public Order createOrder(OrderDTO dto) {

        Order order = new Order();

        //////////////////////////////////////////////////////
        // CUSTOMER INFO
        //////////////////////////////////////////////////////

        order.setOrderDate(LocalDateTime.now());

        order.setFullName(dto.getFullName());
        order.setEmail(dto.getEmail());

        order.setAddress(dto.getAddress());
        order.setCity(dto.getCity());
        order.setPostalCode(dto.getPostalCode());
        order.setCountry(dto.getCountry());

        order.setPaymentMethod(dto.getPaymentMethod());

        //////////////////////////////////////////////////////
        // LINES
        //////////////////////////////////////////////////////

        List<OrderLine> lines =
                dto.getLines()
                        .stream()
                        .map(item -> {

                            Product product =
                                    productRepository
                                            .findById(
                                                    item.getProductId()
                                            )
                                            .orElseThrow(
                                                    () -> new RuntimeException(
                                                            "Product not found"
                                                    )
                                            );

                            //////////////////////////////////////////////////
                            // STOCK CHECK
                            //////////////////////////////////////////////////

                            if (product.getStock() < item.getQuantity()) {

                                throw new RuntimeException(
                                        "Insufficient stock for: "
                                                + product.getName()
                                );
                            }

                            //////////////////////////////////////////////////
                            // DECREASE STOCK
                            //////////////////////////////////////////////////

                            product.setStock(
                                    product.getStock()
                                            - item.getQuantity()
                            );

                            productRepository.save(product);

                            //////////////////////////////////////////////////
                            // ORDER LINE
                            //////////////////////////////////////////////////

                            OrderLine line =
                                    new OrderLine();

                            line.setOrder(order);
                            line.setProduct(product);

                            line.setQuantity(
                                    item.getQuantity()
                            );

                            line.setPrice(
                                    product.getPrice()
                            );

                            return line;

                        })
                        .toList();

        order.setOrderLines(lines);

        //////////////////////////////////////////////////////
        // TOTAL
        //////////////////////////////////////////////////////

        double total =
                lines.stream()
                        .mapToDouble(
                                l ->
                                        l.getPrice()
                                                * l.getQuantity()
                        )
                        .sum();

        order.setTotalPrice(total);

        //////////////////////////////////////////////////////
        // SAVE
        //////////////////////////////////////////////////////

        Order savedOrder =
                orderRepository.save(order);

        //////////////////////////////////////////////////////
        // EMAIL (SAFE)
        //////////////////////////////////////////////////////

        try {

            emailService.sendOrderConfirmation(
                    savedOrder
            );

        } catch (Exception e) {

            System.out.println(
                    "Email failed: "
                            + e.getMessage()
            );
        }

        return savedOrder;
    }

    ///////////////////////////////////////////////////////////
    // GET ALL
    ///////////////////////////////////////////////////////////

    public List<Order> getAll() {
        return orderRepository.findAll();
    }

    ///////////////////////////////////////////////////////////
    // GET ONE
    ///////////////////////////////////////////////////////////

    public Order getById(Long id) {

        return orderRepository
                .findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Order not found"
                        )
                );
    }
}