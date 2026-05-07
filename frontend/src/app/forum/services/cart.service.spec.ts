import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { Product } from '../models/product.model';

describe('CartService', () => {
  let service: CartService;

  const productA: Product = {
    id: 1,
    name: 'Phone',
    description: 'Smart phone',
    price: 100,
    stock: 10,
    category: 'Tech',
    imageUrl: 'phone.jpg'
  };

  const productB: Product = {
    id: 2,
    name: 'Laptop',
    description: 'Gaming laptop',
    price: 500,
    stock: 5,
    category: 'Tech',
    imageUrl: 'laptop.jpg'
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);

    service.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty cart', () => {
    expect(service.items.length).toBe(0);
    expect(service.total()).toBe(0);
  });

  it('should add one item to cart', () => {
    service.add(productA);

    expect(service.items.length).toBe(1);
    expect(service.items[0].product.id).toBe(1);
    expect(service.items[0].quantity).toBe(1);
  });

  it('should add item with custom quantity', () => {
    service.add(productA, 3);

    expect(service.items.length).toBe(1);
    expect(service.items[0].quantity).toBe(3);
  });

  it('should merge same product and increase quantity', () => {
    service.add(productA, 1);
    service.add(productA, 2);

    expect(service.items.length).toBe(1);
    expect(service.items[0].quantity).toBe(3);
  });

  it('should add multiple different products', () => {
    service.add(productA, 1);
    service.add(productB, 2);

    expect(service.items.length).toBe(2);
  });

  it('should update quantity', () => {
    service.add(productA, 1);

    service.updateQty(1, 5);

    expect(service.items[0].quantity).toBe(5);
  });

  it('should remove item when quantity <= 0', () => {
    service.add(productA, 2);

    service.updateQty(1, 0);

    expect(service.items.length).toBe(0);
  });

  it('should remove item manually', () => {
    service.add(productA, 1);
    service.add(productB, 1);

    service.remove(1);

    expect(service.items.length).toBe(1);
    expect(service.items[0].product.id).toBe(2);
  });

  it('should calculate total correctly', () => {
    service.add(productA, 2); // 200
    service.add(productB, 1); // 500

    expect(service.total()).toBe(700);
  });

  it('should clear cart', () => {
    service.add(productA, 1);
    service.add(productB, 1);

    service.clear();

    expect(service.items.length).toBe(0);
    expect(service.total()).toBe(0);
  });

  it('should persist cart in localStorage', () => {
    service.add(productA, 2);

    const stored = JSON.parse(localStorage.getItem('ecommerce_cart_v1') || '[]');

    expect(stored.length).toBe(1);
    expect(stored[0].quantity).toBe(2);
  });

  it('should emit updated values through items$', async () => {
    let emitted: any[] = [];
  
    const sub = service.items$.subscribe(items => {
      emitted = items;
    });
  
    service.add(productA);
  
    expect(emitted.length).toBe(1);
    expect(emitted[0].quantity).toBe(1);
  
    sub.unsubscribe();
  });
});