package esprit.tn.ecommerce;

import com.ecommerce.dto.OrderDTO;
import com.ecommerce.dto.OrderLineDTO;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.Product;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.service.EmailService;
import com.ecommerce.service.OrderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    OrderRepository orderRepository;

    @Mock
    ProductRepository productRepository;

    @Mock
    EmailService emailService;

    @InjectMocks
    OrderService service;

    @Test
    void shouldCreateOrder() {

        Product product = new Product();
        product.setId(1L);
        product.setPrice(100);

        when(productRepository.findById(1L))
                .thenReturn(Optional.of(product));

        when(orderRepository.save(any(Order.class)))
                .thenAnswer(i -> i.getArgument(0));

        OrderLineDTO line = new OrderLineDTO();
        line.setProductId(1L);
        line.setQuantity(2);

        OrderDTO dto = new OrderDTO();
        dto.setFullName("rania");
        dto.setEmail("rania@mail.com");
        dto.setLines(List.of(line));

        Order result = service.createOrder(dto);

        assertEquals("rania", result.getFullName());
        assertEquals(200, result.getTotalPrice());

        verify(emailService).sendOrderConfirmation(
                anyString(),
                any(),
                anyString()
        );
    }

    @Test
    void shouldGetAllOrders() {
        when(orderRepository.findAll()).thenReturn(List.of(new Order()));

        assertEquals(1, service.getAll().size());
    }
}