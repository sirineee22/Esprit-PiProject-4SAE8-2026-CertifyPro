package com.ecommerce.controller;


import com.ecommerce.entity.Product;
import com.ecommerce.service.ProductAiImageService;
import org.springframework.beans.factory.annotation.Autowired;
import com.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    @Autowired
    private final ProductService productService;

    @GetMapping
    public List<Product> getAll(){
        return productService.getAll();
    }

    @GetMapping("/{id}")
    public Product getById(@PathVariable Long id){
        return productService.getById(id);
    }

    @PostMapping
    public Product create(@RequestBody Product product){
        return productService.create(product);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @RequestBody Product product){
        return productService.update(id, product);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id){
        productService.delete(id);
    }





    @Autowired
    private ProductAiImageService aiService;

    @PostMapping("/generate-image")
    public Map<String,Object> generateImage(
            @RequestBody Map<String,String> body){

        return aiService.generateProductImage(
                body.get("name"),
                body.get("description"),
                body.get("category")
        );
    }



}