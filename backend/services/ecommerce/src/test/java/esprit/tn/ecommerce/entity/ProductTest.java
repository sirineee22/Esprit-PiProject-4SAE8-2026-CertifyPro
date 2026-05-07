package esprit.tn.ecommerce.entity;


import com.ecommerce.entity.Product;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ProductTest {

    @Test
    void shouldCreateAndReadProductFields() {
        Product product = new Product();

        product.setId(1L);
        product.setName("Phone");
        product.setDescription("Premium smartphone");
        product.setPrice(999.99);
        product.setStock(15);

        assertEquals(1L, product.getId());
        assertEquals("Phone", product.getName());
        assertEquals("Premium smartphone", product.getDescription());
        assertEquals(999.99, product.getPrice());
        assertEquals(15, product.getStock());
    }

    @Test
    void shouldUpdateProductFields() {
        Product product = new Product();

        product.setName("Old");
        product.setName("New");

        assertEquals("New", product.getName());
    }
}