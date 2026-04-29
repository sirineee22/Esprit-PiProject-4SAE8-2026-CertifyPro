// products-list.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Product } from '../forum/models/product.model';
import { ProductApiService } from '../forum/services/product-api.service';
import { CartService } from '../forum/services/cart.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products-list-admin.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponentAdmin implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = ['All', 'Electronics', 'Clothing', 'Books', 'Home & Garden'];
  selectedCategory: string = 'All';
  searchTerm: string = '';
  sortBy: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  editedProduct: Partial<Product> = {};
  selectedProduct: Product | null = null;
  isEditModalOpen = false;
  isAddMode = false;
  isLoading = false;
  addedToCart: { [key: number]: boolean } = {};

  constructor(
    private productService: ProductApiService,
    public cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error("Error loading products", e);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.products];
    
    // Filter by category
    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }
    
    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term)
      );
    }
    
    // Sort products
    filtered.sort((a, b) => {
      let comparison = 0;
      switch(this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          comparison = a.stock - b.stock;
          break;
      }
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    this.filteredProducts = filtered;
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    this.cartService.add(product, 1);
    
    // Show feedback
    this.addedToCart[product.id!] = true;
    setTimeout(() => {
      this.addedToCart[product.id!] = false;
    }, 2000);
  }

  openAddModal(): void {
    this.isAddMode = true;
    this.editedProduct = {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: 'Electronics',
      imageUrl: 'https://imagedelivery.net/JAV112JY973Crznn4xb8Sg/805f7b71-bdf5-4c29-0a20-38408f1d5300/mobile'
    };
    this.isEditModalOpen = true;
  }

  openEditModal(product: Product): void {
    this.selectedProduct = product;
    this.isAddMode = false;
    this.editedProduct = { ...product };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedProduct = null;
    this.editedProduct = {};
  }

  saveProduct(): void {
    if (this.isAddMode) {
      this.productService.create(this.editedProduct as Product).subscribe({
        next: () => {
          alert("✅ Product created successfully");
          this.loadProducts();
          this.closeEditModal();
        }
      });
    } else {
      if (!this.editedProduct.id) return;
      this.productService.update(this.editedProduct.id, this.editedProduct as Product).subscribe({
        next: () => {
          alert("✅ Product updated successfully");
          this.loadProducts();
          this.closeEditModal();
        }
      });
    }
  }

  deleteProduct(product: Product): void {
    if (!product.id) return;
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.productService.delete(product.id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
          this.applyFilters();
        }
      });
    }
  }

  getStockStatus(stock: number): { class: string, text: string } {
    if (stock === 0) return { class: 'out-of-stock', text: 'Out of Stock' };
    if (stock < 10) return { class: 'low-stock', text: 'Low Stock' };
    return { class: 'in-stock', text: 'In Stock' };
  }
}