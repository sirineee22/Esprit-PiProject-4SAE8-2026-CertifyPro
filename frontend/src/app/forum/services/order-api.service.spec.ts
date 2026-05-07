import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  HttpClientTestingModule
} from '@angular/common/http/testing';

import {
  OrderApiService,
  OrderDTO,
  OrderResponse
} from './order-api.service';

describe('OrderApiService', () => {
  let service: OrderApiService;
  let httpMock: HttpTestingController;

  const api = 'http://localhost:8081/api/orders';

  const mockOrder: OrderResponse = {
    id: 1,
    orderDate: '2026-04-22T10:00:00',
    totalPrice: 299.99,
    fullName: 'Aziz Chourabi',
    email: 'aziz@mail.com',
    address: 'Rue Tunis',
    city: 'Tunis',
    postalCode: '1000',
    country: 'Tunisia',
    paymentMethod: 'CARD'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(OrderApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create order', () => {
    const payload: OrderDTO = {
      lines: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 }
      ]
    };

    service.createOrder(payload).subscribe(order => {
      expect(order.id).toBe(1);
      expect(order.totalPrice).toBe(299.99);
      expect(order.paymentMethod).toBe('CARD');
    });

    const req = httpMock.expectOne(api);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(mockOrder);
  });

  it('should get all orders', () => {
    service.getAllOrders().subscribe(orders => {
      expect(orders.length).toBe(2);
      expect(orders[0].id).toBe(1);
      expect(orders[1].id).toBe(2);
    });

    const req = httpMock.expectOne(api);

    expect(req.request.method).toBe('GET');

    req.flush([
      mockOrder,
      {
        ...mockOrder,
        id: 2,
        totalPrice: 450
      }
    ]);
  });

  it('should get order by id', () => {
    service.getOrderById(5).subscribe(order => {
      expect(order.id).toBe(1);
      expect(order.email).toBe('aziz@mail.com');
    });

    const req = httpMock.expectOne(`${api}/5`);

    expect(req.request.method).toBe('GET');

    req.flush(mockOrder);
  });

  it('should handle create order error', () => {
    service.createOrder({
      lines: [{ productId: 1, quantity: 1 }]
    }).subscribe({
        next: () => {
            throw new Error('Expected error');
          },

      error: error => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(api);

    req.flush(
      { message: 'Server Error' },
      { status: 500, statusText: 'Internal Server Error' }
    );
  });

  it('should handle get order by id not found', () => {
    service.getOrderById(99).subscribe({
        next: () => {
            throw new Error('Expected error');
          },      error: error => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne(`${api}/99`);

    req.flush(
      { message: 'Not Found' },
      { status: 404, statusText: 'Not Found' }
    );
  });
});