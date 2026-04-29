// cart.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../forum/services/cart.service';
import { OrderApiService } from '../forum/services/order-api.service';
import { OrderDTO } from '../forum/models/order.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-cart',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  loading = false;
  success: number | null = null;
  error: string | null = null;
  showCheckoutForm = false;
  checkoutForm: FormGroup;

  constructor(
    private cartService: CartService,
    private orderApi: OrderApiService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.checkoutForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
      country: ['France', Validators.required],
      paymentMethod: ['card', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{16}$')]],
      cardExpiry: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])\/[0-9]{2}$')]],
      cardCvv: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]]
    });
  }

  ngOnInit(): void {
    this.cartService.items$.subscribe(items => {
      this.items = items;
    });
  }

  get subtotal(): number {
    return this.cartService.total();
  }

  get tax(): number {
    return this.subtotal * 0.2; // 20% TVA
  }

  get shipping(): number {
    return this.subtotal > 100 ? 0 : 9.99;
  }

  get total(): number {
    return this.subtotal + this.tax + this.shipping;
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity >= 0) {
      this.cartService.updateQty(productId, quantity);
    }
  }

  removeItem(productId: number): void {
    this.cartService.remove(productId);
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clear();
    }
  }

  proceedToCheckout(): void {
    this.showCheckoutForm = true;
  }

  backToCart(): void {
    this.showCheckoutForm = false;
  }
  buildOrderPayload(): OrderDTO {

    const lines = this.items.map(item => ({
      productId: item.product.id!,
      quantity: item.quantity
    }));
  
    return {
      fullName: this.checkoutForm.value.fullName,
      email: this.checkoutForm.value.email,
      address: this.checkoutForm.value.address,
      city: this.checkoutForm.value.city,
      postalCode: this.checkoutForm.value.postalCode,
      country: this.checkoutForm.value.country,
      paymentMethod: this.checkoutForm.value.paymentMethod,
      lines: lines
    };
  }
  placeOrder(){

    if(this.checkoutForm.invalid) return;
  
    const payload = this.buildOrderPayload();
  
    this.loading = true;
  
    this.orderApi.createOrder(payload).subscribe({
  
      next:(res)=>{
  
        this.success = res.id;
  
        this.cartService.clear();
  
        setTimeout(()=>{
          this.router.navigate(['/products']);
        },2000);
  
        this.loading = false;
      },
  
      error:(err)=>{
        this.error = "Order failed";
        this.loading = false;
      }
  
    });
  
  }
  continueShopping(): void {
    this.router.navigate(['/shop/productss']);
  }
}