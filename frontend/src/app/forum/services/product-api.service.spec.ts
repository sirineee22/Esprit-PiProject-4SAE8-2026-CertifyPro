import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import { ProductApiService } from './product-api.service';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';

describe('ProductApiService', () => {
  let service: ProductApiService;
  let httpMock: HttpTestingController;

  const api = `${environment.apiBaseUrl2}/api/products`;

  const mockProduct: Product = {
    id: 1,
    name: 'Phone',
    description: 'Smartphone premium',
    price: 1200,
    stock: 15,
    category: 'Electronics',
    imageUrl: 'phone.jpg'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(ProductApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all products', () => {
    service.getAll().subscribe(products => {
      expect(products.length).toBe(2);
      expect(products[0].name).toBe('Phone');
      expect(products[1].id).toBe(2);
    });

    const req = httpMock.expectOne(api);

    expect(req.request.method).toBe('GET');

    req.flush([
      mockProduct,
      {
        ...mockProduct,
        id: 2,
        name: 'Laptop'
      }
    ]);
  });

  it('should get product by id', () => {
    service.getById(1).subscribe(product => {
      expect(product.id).toBe(1);
      expect(product.name).toBe('Phone');
      expect(product.price).toBe(1200);
    });

    const req = httpMock.expectOne(`${api}/1`);

    expect(req.request.method).toBe('GET');

    req.flush(mockProduct);
  });

  it('should create product', () => {
    const payload = {
      name: 'Tablet',
      price: 800
    };

    service.create(payload).subscribe(product => {
      expect(product.name).toBe('Tablet');
      expect(product.id).toBe(3);
    });

    const req = httpMock.expectOne(api);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      ...mockProduct,
      id: 3,
      name: 'Tablet',
      price: 800
    });
  });

  it('should update product', () => {
    const payload = {
      name: 'Updated Phone'
    };

    service.update(1, payload).subscribe(product => {
      expect(product.name).toBe('Updated Phone');
    });

    const req = httpMock.expectOne(`${api}/1`);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({
      ...mockProduct,
      name: 'Updated Phone'
    });
  });

  it('should delete product', () => {
    service.delete(1).subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${api}/1`);

    expect(req.request.method).toBe('DELETE');

    req.flush(null);
  });

  it('should handle get product by id error', () => {
    service.getById(99).subscribe({
      next: () => {
        throw new Error('Expected error');
      },
      error: error => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne(`${api}/99`);

    req.flush(
      { message: 'Not Found' },
      {
        status: 404,
        statusText: 'Not Found'
      }
    );
  });

  it('should handle create product server error', () => {
    service.create({ name: 'Bad Product' }).subscribe({
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
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    );
  });
});