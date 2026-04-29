import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'ecommerce_cart_v1';

  public itemsSubject = new BehaviorSubject<CartItem[]>(this.load());
  items$ = this.itemsSubject.asObservable();

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  add(product: Product, qty: number = 1) {
    const items = [...this.items];
    const idx = items.findIndex(i => i.product.id === product.id);

    if (idx >= 0) items[idx] = { ...items[idx], quantity: items[idx].quantity + qty };
    else items.push({ product, quantity: qty });

    this.save(items);
  }

  updateQty(productId: number, quantity: number) {
    if (quantity <= 0) return this.remove(productId);
    const items = this.items.map(i => i.product.id === productId ? { ...i, quantity } : i);
    this.save(items);
  }

  remove(productId: number) {
    const items = this.items.filter(i => i.product.id !== productId);
    this.save(items);
  }

  clear() {
    this.save([]);
  }

  total(): number {
    return this.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  private save(items: CartItem[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  private load(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch {
      return [];
    }
  }
}