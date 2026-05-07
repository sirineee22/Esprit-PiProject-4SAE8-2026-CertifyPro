/////////////////////////////////////////////////////////////
// cart.component.ts
// FIXED PAYMENT + STRONG VALIDATION + TUNISIA
/////////////////////////////////////////////////////////////

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

import { CartService, CartItem } from '../forum/services/cart.service';
import { OrderApiService } from '../forum/services/order-api.service';
import { OrderDTO } from '../forum/models/order.model';

@Component({
  standalone: true,
  selector: 'app-cart',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],
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

      /////////////////////////////////////////////////////////
      // PERSONAL
      /////////////////////////////////////////////////////////

      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(60),
          Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$')
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(100)
        ]
      ],

      phone: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{8,15}$')
        ]
      ],

      /////////////////////////////////////////////////////////
      // ADDRESS
      /////////////////////////////////////////////////////////

      address: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(120)
        ]
      ],

      city: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern('^[a-zA-ZÀ-ÿ\\s-]+$')
        ]
      ],

      postalCode: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{4,10}$')
        ]
      ],

      country: [
        'Tunisia',
        Validators.required
      ],

      /////////////////////////////////////////////////////////
      // PAYMENT
      /////////////////////////////////////////////////////////

      paymentMethod: [
        'cash',
        Validators.required
      ],

      cardNumber: [''],
      cardExpiry: [''],
      cardCvv: ['']

    });

    this.handlePaymentValidation();
  }

  ///////////////////////////////////////////////////////////
  // INIT
  ///////////////////////////////////////////////////////////

  ngOnInit(): void {

    this.cartService.items$.subscribe(items => {
      this.items = items;
    });
  }

  ///////////////////////////////////////////////////////////
  // DYNAMIC PAYMENT VALIDATION
  ///////////////////////////////////////////////////////////

  handlePaymentValidation(): void {

    this.checkoutForm
      .get('paymentMethod')
      ?.valueChanges
      .subscribe(method => {

        const cardNumber =
          this.checkoutForm.get('cardNumber');

        const cardExpiry =
          this.checkoutForm.get('cardExpiry');

        const cardCvv =
          this.checkoutForm.get('cardCvv');

        if (method === 'card') {

          cardNumber?.setValidators([
            Validators.required,
            Validators.pattern('^[0-9]{16}$')
          ]);

          cardExpiry?.setValidators([
            Validators.required,
            Validators.pattern('^(0[1-9]|1[0-2])/[0-9]{2}$'),
            this.futureExpiryValidator
          ]);

          cardCvv?.setValidators([
            Validators.required,
            Validators.pattern('^[0-9]{3,4}$')
          ]);

        } else {

          cardNumber?.clearValidators();
          cardExpiry?.clearValidators();
          cardCvv?.clearValidators();

          cardNumber?.setValue('');
          cardExpiry?.setValue('');
          cardCvv?.setValue('');
        }

        cardNumber?.updateValueAndValidity();
        cardExpiry?.updateValueAndValidity();
        cardCvv?.updateValueAndValidity();

      });
  }

  ///////////////////////////////////////////////////////////
  // CARD DATE VALIDATOR
  ///////////////////////////////////////////////////////////

  futureExpiryValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    if (!control.value) return null;

    const parts =
      control.value.split('/');

    if (parts.length !== 2) return null;

    const month = +parts[0];
    const year = +('20' + parts[1]);

    const now = new Date();

    const currentMonth =
      now.getMonth() + 1;

    const currentYear =
      now.getFullYear();

    if (
      year < currentYear ||
      (year === currentYear &&
        month < currentMonth)
    ) {
      return { expired: true };
    }

    return null;
  }

  ///////////////////////////////////////////////////////////
  // GETTERS
  ///////////////////////////////////////////////////////////

  get subtotal(): number {
    return this.cartService.total();
  }

  get tax(): number {
    return this.subtotal * 0.19;
  }

  get shipping(): number {
    return this.subtotal >= 100 ? 0 : 8;
  }

  get total(): number {
    return this.subtotal + this.tax + this.shipping;
  }

  get itemCount(): number {

    return this.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }

  ///////////////////////////////////////////////////////////
  // CART
  ///////////////////////////////////////////////////////////

  updateQuantity(
    productId: number,
    quantity: number
  ): void {

    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.cartService.updateQty(
      productId,
      quantity
    );
  }

  removeItem(productId: number): void {
    this.cartService.remove(productId);
  }

  clearCart(): void {

    if (confirm('Clear cart ?')) {
      this.cartService.clear();
    }
  }

  ///////////////////////////////////////////////////////////
  // FLOW
  ///////////////////////////////////////////////////////////

  proceedToCheckout(): void {

    if (this.items.length === 0) {
      this.error = 'Cart is empty';
      return;
    }

    this.showCheckoutForm = true;
  }

  backToCart(): void {
    this.showCheckoutForm = false;
  }

  continueShopping(): void {
    this.router.navigate(
      ['/shop/productss']
    );
  }

  ///////////////////////////////////////////////////////////
  // ORDER
  ///////////////////////////////////////////////////////////

  buildOrderPayload(): OrderDTO {

    return {

      fullName:
        this.checkoutForm.value.fullName,

      email:
        this.checkoutForm.value.email,

      address:
        this.checkoutForm.value.address,

      city:
        this.checkoutForm.value.city,

      postalCode:
        this.checkoutForm.value.postalCode,

      country:
        this.checkoutForm.value.country,

      paymentMethod:
        this.checkoutForm.value.paymentMethod,

      lines: this.items.map(i => ({
        productId: i.product.id!,
        quantity: i.quantity
      }))
    };
  }

  placeOrder(): void {

    if (this.checkoutForm.invalid) {

      this.checkoutForm.markAllAsTouched();

      this.error =
        'Please correct highlighted fields';

      return;
    }

    this.loading = true;
    this.error = null;

    const payload =
      this.buildOrderPayload();

    this.orderApi.createOrder(payload)
      .subscribe({

        next: (res) => {

          this.success = res.id;

          this.cartService.clear();

          this.loading = false;

          setTimeout(() => {
            this.router.navigate(
              ['/shop/productss']
            );
          }, 2500);
        },

        error: () => {

          this.loading = false;

          this.error =
            'Order failed. Please retry.';
        }

      });
  }

  ///////////////////////////////////////////////////////////
  // IMAGE FALLBACK
  ///////////////////////////////////////////////////////////

  onImageError(event: Event): void {

    const img =
      event.target as HTMLImageElement;

    img.src =
      'https://via.placeholder.com/400x400?text=No+Image';
  }

}