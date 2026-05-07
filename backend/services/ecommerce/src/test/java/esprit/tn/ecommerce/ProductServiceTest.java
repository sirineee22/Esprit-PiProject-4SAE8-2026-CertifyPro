package esprit.tn.ecommerce;


import com.ecommerce.entity.Product;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.service.ProductService;
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
class ProductServiceTest {

    @Mock
    ProductRepository repository;

    @InjectMocks
    ProductService service;

    @Test
    void shouldGetAllProducts() {
        when(repository.findAll()).thenReturn(List.of(new Product()));

        assertEquals(1, service.getAll().size());
    }

    @Test
    void shouldGetProductById() {
        Product product = new Product();
        product.setId(1L);

        when(repository.findById(1L)).thenReturn(Optional.of(product));

        assertEquals(1L, service.getById(1L).getId());
    }

    @Test
    void shouldCreateProduct() {
        Product product = new Product();
        product.setName("Phone");

        when(repository.save(product)).thenReturn(product);

        assertEquals("Phone", service.create(product).getName());
    }

    @Test
    void shouldDeleteProduct() {
        service.delete(1L);

        verify(repository).deleteById(1L);
    }
}