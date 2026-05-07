// products-list.component.ts
// CLIENT VERSION FIXED + FAST + IMAGE SAFE + BETTER UX

import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { timeout, finalize } from 'rxjs/operators';

import { Product } from '../forum/models/product.model';
import { ProductApiService } from '../forum/services/product-api.service';
import { CartService } from '../forum/services/cart.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductsListComponent implements OnInit {

  //////////////////////////////////////////////////////////
  // DATA
  //////////////////////////////////////////////////////////

  products: Product[] = [];
  filteredProducts: Product[] = [];

  categories: string[] = [
    'All',
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Beauty',
    'Health'
  ];

  selectedCategory = 'All';
  searchTerm = '';

  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  //////////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////////

  isLoading = false;

  addedToCart: { [key: number]: boolean } = {};

  //////////////////////////////////////////////////////////
  // CONSTRUCTOR
  //////////////////////////////////////////////////////////

  constructor(
    private productService: ProductApiService,
    public cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  //////////////////////////////////////////////////////////
  // INIT
  //////////////////////////////////////////////////////////

  ngOnInit(): void {
    this.loadProducts();
  }

  //////////////////////////////////////////////////////////
  // LOAD PRODUCTS
  //////////////////////////////////////////////////////////

  loadProducts(): void {

    this.isLoading = true;

    this.productService.getAll()
      .pipe(
        timeout(10000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (data) => {

          this.products = data || [];

          this.extractCategories();

          this.applyFilters();
        },

        error: (err) => {

          console.error('Load products error', err);

          this.products = [];
          this.filteredProducts = [];
        }
      });
  }

  //////////////////////////////////////////////////////////
  // AUTO CATEGORY FROM DB
  //////////////////////////////////////////////////////////

  extractCategories(): void {

    const dynamicCategories = this.products
      .map(p => p.category)
      .filter((x): x is string => !!x && x.trim() !== '');

    const unique = Array.from(new Set(dynamicCategories));

    this.categories = [
      'All',
      ...unique.sort()
    ];
  }

  //////////////////////////////////////////////////////////
  // FILTER + SEARCH + SORT
  //////////////////////////////////////////////////////////

  applyFilters(): void {

    let list = [...this.products];

    // category
    if (this.selectedCategory !== 'All') {

      list = list.filter(
        p => (p.category || '') === this.selectedCategory
      );
    }

    // search
    if (this.searchTerm.trim()) {

      const term = this.searchTerm.toLowerCase();

      list = list.filter(p =>

        (p.name || '')
          .toLowerCase()
          .includes(term)

        ||

        (p.description || '')
          .toLowerCase()
          .includes(term)

        ||

        (p.category || '')
          .toLowerCase()
          .includes(term)
      );
    }

    // sort
    list.sort((a, b) => {

      let result = 0;

      switch (this.sortBy) {

        case 'price':
          result = (a.price || 0) - (b.price || 0);
          break;

        case 'stock':
          result = (a.stock || 0) - (b.stock || 0);
          break;

        default:
          result =
            (a.name || '')
              .localeCompare(b.name || '');
      }

      return this.sortOrder === 'asc'
        ? result
        : -result;
    });

    this.filteredProducts = list;
  }

  //////////////////////////////////////////////////////////
  // ADD TO CART
  //////////////////////////////////////////////////////////

  addToCart(
    product: Product,
    event: Event
  ): void {

    event.stopPropagation();

    if ((product.stock || 0) <= 0) return;

    this.cartService.add(product, 1);

    const id = product.id!;

    this.addedToCart[id] = true;

    setTimeout(() => {
      this.addedToCart[id] = false;
    }, 1800);
  }

  //////////////////////////////////////////////////////////
  // STOCK STATUS
  //////////////////////////////////////////////////////////

  getStockStatus(
    stock: number
  ): { class: string; text: string } {

    if (stock <= 0) {
      return {
        class: 'out-of-stock',
        text: 'Out of Stock'
      };
    }

    if (stock < 10) {
      return {
        class: 'low-stock',
        text: 'Low Stock'
      };
    }

    return {
      class: 'in-stock',
      text: 'Available'
    };
  }

  //////////////////////////////////////////////////////////
  // IMAGE ERROR
  //////////////////////////////////////////////////////////

  onImageError(event: Event): void {

    const img =
      event.target as HTMLImageElement;

    img.src =
      'https://via.placeholder.com/500x500?text=No+Image';
  }
// ADD TO products-list.component.ts

selectedProduct: Product | null = null;

openProductPopup(product: Product): void {
  this.selectedProduct = product;
}

closeProductPopup(): void {
  this.selectedProduct = null;
}
}