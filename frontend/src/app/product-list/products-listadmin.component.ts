/////////////////////////////////////////////////////////////
// products-list.component.ts
// FIXED ASYNC / TIMEOUT / NO INFINITE LOADING
// BETTER UX + AI IMAGE SAFE REQUEST
/////////////////////////////////////////////////////////////

import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { timeout, finalize } from 'rxjs/operators';

import { Product } from '../forum/models/product.model';
import { ProductApiService } from '../forum/services/product-api.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-products-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products-list-admin.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponentAdmin implements OnInit {

  ///////////////////////////////////////////////////////////
  // DATA
  ///////////////////////////////////////////////////////////

  products: Product[] = [];
  filteredProducts: Product[] = [];

  categories: string[] = [
    'All',
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Beauty',
    'Health',
    'Other'
  ];

  selectedCategory = 'All';
  searchTerm = '';

  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  ///////////////////////////////////////////////////////////
  // UI
  ///////////////////////////////////////////////////////////

  isLoading = false;
  isSaving = false;
  aiLoading = false;

  isEditModalOpen = false;
  isAddMode = false;

  showToast = false;
  toastMessage = '';

  ///////////////////////////////////////////////////////////
  // IMAGE
  ///////////////////////////////////////////////////////////

  generatedImageUrl = '';
  showGeneratedPreview = false;

  ///////////////////////////////////////////////////////////
  // FORM
  ///////////////////////////////////////////////////////////

  editedProduct: Partial<Product> = {};
  customCategory = '';

  ///////////////////////////////////////////////////////////
  // API
  ///////////////////////////////////////////////////////////

  gateway = environment.apiBaseUrl2;

  constructor(
    private api: ProductApiService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ///////////////////////////////////////////////////////////

  ngOnInit(): void {
    this.loadProducts();
  }

  ///////////////////////////////////////////////////////////
  // LOAD PRODUCTS
  ///////////////////////////////////////////////////////////

  loadProducts(): void {

    this.isLoading = true;
  
    this.api.getAll()
      .pipe(
        timeout(10000)
      )
      .subscribe({
  
        next: (res) => {
  
          this.zone.run(() => {
  
            this.products = Array.isArray(res) ? res : [];
  
            this.products = this.products.map(p => ({
              ...p,
              imageUrl: this.fixImageUrl(p.imageUrl)
            }));
  
            this.applyFilters();
  
            this.isLoading = false;
  
            this.cdr.detectChanges();
          });
        },
  
        error: () => {
  
          this.zone.run(() => {
            this.isLoading = false;
            this.toast('Unable to load products');
            this.cdr.detectChanges();
          });
        }
      });
  }
  fixImageUrl(url?: string): string {

    if (!url || url.trim() === '') {
      return 'assets/no-image.png';
    }
  
    if (url.startsWith('http')) {
      return url;
    }
  
    return `${this.gateway}/${url.replace(/^\/+/, '')}`;
  }
  ///////////////////////////////////////////////////////////
  // FILTERS
  ///////////////////////////////////////////////////////////

  applyFilters(): void {

    let list = [...this.products];

    if (this.selectedCategory !== 'All') {
      list = list.filter(
        x => (x.category || '') === this.selectedCategory
      );
    }

    if (this.searchTerm.trim()) {

      const term = this.searchTerm.toLowerCase();

      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
      );
    }

    list.sort((a, b) => {

      let r = 0;

      switch (this.sortBy) {

        case 'price':
          r = (a.price || 0) - (b.price || 0);
          break;

        case 'stock':
          r = (a.stock || 0) - (b.stock || 0);
          break;

        default:
          r = (a.name || '').localeCompare(b.name || '');
      }

      return this.sortOrder === 'asc' ? r : -r;
    });

    this.filteredProducts = list;
  }

  ///////////////////////////////////////////////////////////
  // MODAL
  ///////////////////////////////////////////////////////////

  openAddModal(): void {

    this.isAddMode = true;

    this.editedProduct = {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: 'Electronics',
      imageUrl: ''
    };

    this.resetAi();
    this.isEditModalOpen = true;
  }

  openEditModal(product: Product): void {

    this.isAddMode = false;
    this.editedProduct = { ...product };

    this.resetAi();
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {

    this.isEditModalOpen = false;
    this.editedProduct = {};
    this.resetAi();
  }

  resetAi(): void {
    this.aiLoading = false;
    this.generatedImageUrl = '';
    this.showGeneratedPreview = false;
    this.customCategory = '';
  }

  ///////////////////////////////////////////////////////////
  // CATEGORY
  ///////////////////////////////////////////////////////////

  onCategoryChange(): void {

    if (this.editedProduct.category !== 'Other') {
      this.customCategory = '';
    }
  }

  ///////////////////////////////////////////////////////////
  // SAVE
  ///////////////////////////////////////////////////////////

  saveProduct(): void {

    if (!this.editedProduct.name?.trim()) {
      this.toast('Product name required');
      return;
    }

    if (this.editedProduct.category === 'Other') {

      if (!this.customCategory.trim()) {
        this.toast('Enter category');
        return;
      }

      this.editedProduct.category =
        this.customCategory.trim();
    }

    this.isSaving = true;

    const request =
      this.isAddMode
        ? this.api.create(this.editedProduct)
        : this.api.update(
            this.editedProduct.id!,
            this.editedProduct
          );

    request
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({

        next: () => {
          this.toast(
            this.isAddMode
              ? 'Product created'
              : 'Product updated'
          );

          this.closeEditModal();
          this.loadProducts();
        },

        error: () => {
          this.toast('Save failed');
        }
      });
  }

  ///////////////////////////////////////////////////////////
  // DELETE
  ///////////////////////////////////////////////////////////

  deleteProduct(product: Product): void {

    if (!confirm(`Delete "${product.name}" ?`)) return;

    this.api.delete(product.id)
      .pipe(timeout(10000))
      .subscribe({

        next: () => {
          this.toast('Deleted');
          this.loadProducts();
        },

        error: () => {
          this.toast('Delete failed');
        }
      });
  }

  ///////////////////////////////////////////////////////////
  // STOCK
  ///////////////////////////////////////////////////////////

  getStockStatus(stock: number): string {

    if (stock <= 0) return 'Out of stock';
    if (stock < 10) return 'Low stock';

    return 'Available';
  }

  ///////////////////////////////////////////////////////////
  // VOICE INPUT
  ///////////////////////////////////////////////////////////

  startVoice(field: string): void {

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      this.toast('Speech not supported');
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = 'fr-FR';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {

      const text =
        event.results[0][0].transcript;

      (this.editedProduct as any)[field] = text;

      this.cdr.detectChanges();
    };

    recognition.start();
  }

  ///////////////////////////////////////////////////////////
  // AI IMAGE GENERATION
  ///////////////////////////////////////////////////////////

  generateAiImage(): void {

    if (this.aiLoading) return;

    this.aiLoading = true;
    this.generatedImageUrl = '';
    this.showGeneratedPreview = false;

    this.http.post<any>(
      `${this.gateway}/api/products/generate-image`,
      {
        name: this.editedProduct.name,
        description: this.editedProduct.description,
        category:
          this.editedProduct.category === 'Other'
            ? this.customCategory
            : this.editedProduct.category
      }
    )
    .pipe(
      timeout(60000), // max 60 sec
      finalize(() => {
        this.aiLoading = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({

      next: (res) => {

        if (res?.success && res?.imageUrl) {

          this.generatedImageUrl = res.imageUrl;

          this.toast(
            'Image generated ✔ Click Preview'
          );

        } else {

          this.toast('No image received');
        }
      },

      error: () => {
        this.toast('Generation timeout / failed');
      }
    });
  }

  ///////////////////////////////////////////////////////////
  // PREVIEW
  ///////////////////////////////////////////////////////////

  showPreview(): void {

    if (!this.generatedImageUrl) return;

    this.showGeneratedPreview = true;
  }

  ///////////////////////////////////////////////////////////
  // USE IMAGE
  ///////////////////////////////////////////////////////////

  useGeneratedImage(): void {

    if (!this.generatedImageUrl) return;

    this.editedProduct.imageUrl =
      this.generatedImageUrl;

    this.showGeneratedPreview = true;

    this.toast('Image selected');
  }

  ///////////////////////////////////////////////////////////
  // TOAST
  ///////////////////////////////////////////////////////////

  toast(msg: string): void {

    this.toastMessage = msg;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 2500);
  }
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/500x500?text=Image+Error';
  }
}