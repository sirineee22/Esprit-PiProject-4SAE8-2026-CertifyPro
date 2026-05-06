import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User } from '../../shared/models/user.model';
import { lastValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockRole = { id: 1, name: 'LEARNER' } as any;
  const mockUser: User = {
    id: 1,
    firstName: 'Sirine',
    lastName: 'Test',
    email: 'sirine@test.com',
    role: mockRole,
    active: true,
  } as User;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isLoggedIn() should return false when no session', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('setSession() should store user and token', () => {
    service.setSession(mockUser, 'fake-token');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getToken()).toBe('fake-token');
    expect(service.getCurrentUser()?.email).toBe('sirine@test.com');
  });

  it('clearSession() should remove user and token', () => {
    service.setSession(mockUser, 'fake-token');
    service.clearSession();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
  });

  it('login() should POST to /api/auth/login', () => {
    service.login('sirine@test.com', 'password123').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'sirine@test.com', password: 'password123' });
    req.flush({ token: 'jwt-token', user: mockUser });
  });

  it('verify2fa() should POST to /api/auth/verify-2fa', () => {
    service.verify2fa('sirine@test.com', '123456').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/auth/verify-2fa'));
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'jwt-token', user: mockUser });
  });

  it('register() should POST to /api/auth/register/learner', () => {
    const body = {
      firstName: 'Sirine',
      lastName: 'Test',
      email: 'sirine@test.com',
      password: 'pass123',
    };
    service.register('learner', body).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/auth/register/learner'));
    expect(req.request.method).toBe('POST');
    req.flush(mockUser);
  });

  it('isEmployer() should return false for LEARNER role', () => {
    service.setSession(mockUser);
    expect(service.isEmployer()).toBe(false);
  });

  it('isCandidate() should return true for LEARNER role', () => {
    service.setSession(mockUser);
    expect(service.isCandidate()).toBe(true);
  });

  it('currentUser$ should emit updated user after setSession', async () => {
    const userPromise = lastValueFrom(service.currentUser$.pipe(take(2)));
    service.setSession(mockUser, 'token');
    const user = await userPromise;
    expect(user?.email).toBe('sirine@test.com');
  });
});
