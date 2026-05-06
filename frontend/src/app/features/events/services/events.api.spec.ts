import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EventsApiService } from './events.api';
import { EventRefreshService } from './event-refresh.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Subject } from 'rxjs';

describe('EventsApiService', () => {
  let service: EventsApiService;
  let httpMock: HttpTestingController;
  let refreshSubject: Subject<void>;

  const mockEvent = {
    id: 1,
    title: 'Test Event',
    status: 'UPCOMING',
    type: 'WORKSHOP',
    mode: 'ONLINE',
  } as any;

  const mockPage = {
    content: [mockEvent],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 10,
  };

  beforeEach(() => {
    refreshSubject = new Subject<void>();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EventsApiService,
        {
          provide: EventRefreshService,
          useValue: { refreshed: refreshSubject.asObservable(), triggerRefresh: () => {} },
        },
        {
          provide: AuthService,
          useValue: {
            getToken: () => 'fake-token',
            getCurrentUser: () => ({ id: 1, role: { name: 'LEARNER' } }),
            currentUser$: new Subject().asObservable(),
          },
        },
      ],
    });

    service = TestBed.inject(EventsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('list() should GET /api/events with params', () => {
    service.list({ upcomingOnly: true, page: 0, size: 10 }).subscribe(result => {
      expect(result.content.length).toBe(1);
      expect(result.content[0].title).toBe('Test Event');
    });

    const req = httpMock.expectOne(r =>
      r.url.includes('/api/events') && r.params.get('upcomingOnly') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('getById() should GET /api/events/:id', () => {
    service.getById(1).subscribe(event => {
      expect(event.id).toBe(1);
    });

    const req = httpMock.expectOne(r => r.url.includes('/api/events/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockEvent);
  });

  it('myRegistrations() should GET /api/events/my-registrations', () => {
    service.myRegistrations().subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/events/my-registrations'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('myEvents() should GET /api/events/my', () => {
    service.myEvents().subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/events/my'));
    expect(req.request.method).toBe('GET');
    req.flush([mockEvent]);
  });

  it('register() should POST /api/events/:id/register', () => {
    service.register(1, { firstName: 'Sirine', lastName: 'Test' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/events/1/register'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ firstName: 'Sirine', lastName: 'Test' });
    req.flush({ message: 'Registered' });
  });

  it('unregister() should DELETE /api/events/:id/register', () => {
    service.unregister(1).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/events/1/register'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('delete() should DELETE /api/events/:id', () => {
    service.delete(1).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/events/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('list() should use cache on second call with same params', () => {
    const params = { page: 0, size: 10 };

    service.list(params).subscribe();
    const req1 = httpMock.expectOne(r => r.url.includes('/api/events'));
    req1.flush(mockPage);

    // Second call — should NOT make a new HTTP request (cached)
    service.list(params).subscribe();
    httpMock.expectNone(r => r.url.includes('/api/events'));
  });

  it('recommendations() should GET /api/events/recommendations', () => {
    service.recommendations(1, 6).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/events/recommendations'));
    expect(req.request.method).toBe('GET');
    req.flush([mockEvent]);
  });
});
