import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { Product } from '../forum/models/product.model';
import { ProductApiService } from '../forum/services/product-api.service';
import { CartService } from '../forum/services/cart.service';

@Component({
  standalone: true,
  selector: 'app-product-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];

  constructor(
    private api: ProductApiService,
    private router: Router,
    private cart: CartService
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.api.getAll().subscribe({
      next: (res) => this.products = res,
      error: (err) => console.error(err)
    });
  }

  addToCart(p: Product){
    this.cart.add(p, 1);
  }
}