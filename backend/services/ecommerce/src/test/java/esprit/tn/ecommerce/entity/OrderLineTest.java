package esprit.tn.ecommerce.entity;


import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderLine;
import com.ecommerce.entity.Product;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OrderLineTest {

    @Test
    void shouldCreateOrderLine() {
        Product product = new Product();
        product.setId(10L);

        Order order = new Order();
        order.setId(20L);

        OrderLine line = new OrderLine();
        line.setId(1L);
        line.setQuantity(3);
        line.setPrice(99.9);
        line.setProduct(product);
        line.setOrder(order);

        assertEquals(1L, line.getId());
        assertEquals(3, line.getQuantity());
        assertEquals(99.9, line.getPrice());
        assertEquals(product, line.getProduct());
        assertEquals(order, line.getOrder());
    }
}