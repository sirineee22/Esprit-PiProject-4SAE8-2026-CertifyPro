package esprit.tn.ecommerce;


import com.ecommerce.controller.OrderController;
import com.ecommerce.dto.OrderDTO;
import com.ecommerce.entity.Order;
import com.ecommerce.service.OrderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock
    OrderService service;

    @InjectMocks
    OrderController controller;

    @Test
    void shouldGetAllOrders() {
        when(service.getAll()).thenReturn(List.of(new Order()));

        assertEquals(1, controller.getAll().size());
    }

    @Test
    void shouldCreateOrder() {
        Order order = new Order();
        order.setId(1L);

        when(service.createOrder(any(OrderDTO.class)))
                .thenReturn(order);

        assertEquals(1L,
                controller.createOrder(new OrderDTO()).getId());
    }

    @Test
    void shouldGetOrderById() {
        Order order = new Order();
        order.setId(7L);

        when(service.getById(7L)).thenReturn(order);

        assertEquals(7L, controller.getById(7L).getId());
    }
}