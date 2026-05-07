import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../forum/services/cart.service';
import { ProductApiService } from '../forum/services/product-api.service';
import { Product } from '../forum/models/product.model';
 

@Component({
  standalone: true,
  selector: 'app-product-details',
  imports: [CommonModule, RouterLink],
  template: `
  <div class="container" *ngIf="product; else loading">
    <a routerLink="/shop/products">← Back</a>
    <h2>{{ product.name }}</h2>
    <p>{{ product.description }}</p>

    <div class="row">
      <strong>{{ product.price | number:'1.2-2' }} €</strong>
      <span>Stock: {{ product.stock }}</span>
    </div>

    <button (click)="add()" [disabled]="product.stock <= 0">Add to cart</button>
  </div>

  <ng-template #loading>
    <p>Loading...</p>
  </ng-template>
  `,
  styles: [`
    .container{max-width:800px;margin:24px auto;padding:0 12px}
    .row{display:flex;justify-content:space-between;margin:12px 0}
    button{padding:10px 14px;border-radius:10px;border:1px solid #333;cursor:pointer}
  `]
})
export class ProductDetailsComponent implements OnInit {
  product?: Product;

  constructor(
    private route: ActivatedRoute,
    private api: ProductApiService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe(p => this.product = p);
  }

  add(){
    if(this.product) this.cart.add(this.product, 1);
  }
}