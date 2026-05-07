package esprit.tn.ecommerce;


import com.ecommerce.controller.ProductController;
import com.ecommerce.entity.Product;
import com.ecommerce.service.ProductService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock
    ProductService service;

    @InjectMocks
    ProductController controller;

    @Test
    void shouldGetAllProducts() {
        when(service.getAll()).thenReturn(List.of(new Product()));

        assertEquals(1, controller.getAll().size());
    }

    @Test
    void shouldCreateProduct() {
        Product p = new Product();
        p.setName("Phone");

        when(service.create(any())).thenReturn(p);

        assertEquals("Phone", controller.create(new Product()).getName());
    }

    @Test
    void shouldDeleteProduct() {
        controller.delete(1L);

        verify(service).delete(1L);
    }
}