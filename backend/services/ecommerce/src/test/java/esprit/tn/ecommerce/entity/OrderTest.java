package esprit.tn.ecommerce.entity;


import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderLine;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OrderTest {

    @Test
    void shouldCreateOrder() {
        Order order = new Order();

        order.setId(1L);
        order.setOrderDate(LocalDateTime.now());
        order.setFullName("rania");
        order.setEmail("rania@mail.com");
        order.setAddress("Street");
        order.setCity("Paris");
        order.setPostalCode("75000");
        order.setCountry("France");
        order.setPaymentMethod("CARD");
        order.setTotalPrice(500);

        assertEquals("rania", order.getFullName());
        assertEquals("Paris", order.getCity());
        assertEquals("CARD", order.getPaymentMethod());
        assertEquals(500, order.getTotalPrice());
    }

    @Test
    void shouldContainOrderLines() {
        Order order = new Order();
        OrderLine line = new OrderLine();

        order.setOrderLines(List.of(line));

        assertEquals(1, order.getOrderLines().size());
    }
}