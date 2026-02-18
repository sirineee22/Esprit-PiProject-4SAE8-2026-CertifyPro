import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainerRequestService, TrainerRequest } from '../../../trainer-requests/services/trainer-request.service';

@Component({
  selector: 'app-trainer-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trainer-requests-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Trainer Applications</h1>
          <p class="subtitle">Review and approve professional trainer certifications</p>
        </div>
        <div class="header-stats">
          <div class="stat-badge pending">
            <div class="stat-icon">
              <i class="bi bi-hourglass-split"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{pendingRequests.length}}</span>
              <span class="stat-label">Pending Review</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Loading applications...</p>
      </div>

      <!-- Requests Grid -->
      <div class="requests-grid" *ngIf="!isLoading && pendingRequests.length > 0">
        <div class="request-card" *ngFor="let request of pendingRequests">
          <!-- Card Header -->
          <div class="card-header">
            <div class="user-profile">
              <div class="avatar">
                {{request.user.firstName[0]}}{{request.user.lastName[0]}}
              </div>
              <div class="user-info">
                <h3>{{request.user.firstName}} {{request.user.lastName}}</h3>
                <span class="email">
                  <i class="bi bi-envelope"></i>
                  {{request.user.email}}
                </span>
              </div>
            </div>
            <div class="submission-date">
              <i class="bi bi-calendar3"></i>
              {{request.createdAt | date:'MMM d, y'}}
            </div>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <!-- Subjects -->
            <div class="section">
              <label class="section-label">
                <i class="bi bi-mortarboard-fill"></i>
                Expertise Areas
              </label>
              <div class="tags">
                <span class="tag" *ngFor="let subject of request.subjects.split(',')">
                  {{subject.trim()}}
                </span>
              </div>
            </div>

            <!-- Experience -->
            <div class="section" *ngIf="request.experience">
              <label class="section-label">
                <i class="bi bi-briefcase-fill"></i>
                Experience
              </label>
              <p class="section-value">{{request.experience}}</p>
            </div>

            <!-- Certificates -->
            <div class="section" *ngIf="request.certificatesLink">
              <label class="section-label">
                <i class="bi bi-patch-check-fill"></i>
                Credentials
              </label>
              <a [href]="request.certificatesLink" target="_blank" class="credential-link">
                <span>View Certificates</span>
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
            </div>

            <!-- Motivation -->
            <div class="section">
              <label class="section-label">
                <i class="bi bi-chat-quote-fill"></i>
                Motivation Statement
              </label>
              <div class="message-box">
                <p>{{request.message}}</p>
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="card-footer">
            <button 
              class="btn btn-reject" 
              (click)="rejectRequest(request)"
              [disabled]="isProcessing"
            >
              <i class="bi bi-x-circle"></i>
              <span>Decline</span>
            </button>
            <button 
              class="btn btn-approve" 
              (click)="approveRequest(request)"
              [disabled]="isProcessing"
            >
              <i class="bi bi-check-circle-fill"></i>
              <span>Approve & Activate</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && pendingRequests.length === 0">
        <div class="empty-icon">
          <i class="bi bi-inbox"></i>
        </div>
        <h2>All Caught Up!</h2>
        <p>No pending trainer applications at this time.</p>
        <div class="empty-illustration">
          <i class="bi bi-check-circle-fill"></i>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .trainer-requests-container {
      padding: 2.5rem;
      max-width: 1400px;
      margin: 0 auto;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 3rem;
      gap: 2rem;
    }

    .header-content h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: #0b1120;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }

    .subtitle {
      color: #6b7280;
      font-size: 1.125rem;
      font-weight: 500;
    }

    .header-stats {
      display: flex;
      gap: 1rem;
    }

    .stat-badge {
      background: white;
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 1rem;
      min-width: 200px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 800;
      color: #0b1120;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 600;
      margin-top: 0.25rem;
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 2rem;
      gap: 1.5rem;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top-color: #f59e0b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-container p {
      color: #6b7280;
      font-weight: 600;
    }

    /* Requests Grid */
    .requests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
      gap: 2rem;
    }

    .request-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .request-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      border-color: #f59e0b;
    }

    /* Card Header */
    .card-header {
      padding: 1.75rem;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .user-profile {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .avatar {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
    }

    .user-info h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0b1120;
      margin: 0 0 0.25rem 0;
    }

    .email {
      font-size: 0.875rem;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .submission-date {
      font-size: 0.8125rem;
      color: #6b7280;
      background: white;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      border: 1px solid #e5e7eb;
    }

    /* Card Body */
    .card-body {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 800;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-label i {
      font-size: 0.875rem;
      color: #f59e0b;
    }

    .section-value {
      font-size: 0.9375rem;
      color: #0b1120;
      font-weight: 500;
      margin: 0;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: #1e40af;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      border: 1px solid #bfdbfe;
    }

    .credential-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #2563eb;
      font-weight: 600;
      font-size: 0.9375rem;
      text-decoration: none;
      transition: all 0.2s;
      padding: 0.5rem 0;
    }

    .credential-link:hover {
      color: #1d4ed8;
      gap: 0.75rem;
    }

    .message-box {
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 12px;
      border-left: 4px solid #f59e0b;
    }

    .message-box p {
      margin: 0;
      color: #374151;
      font-size: 0.9375rem;
      line-height: 1.7;
    }

    /* Card Footer */
    .card-footer {
      padding: 1.5rem 1.75rem;
      background: #f8fafc;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 1rem;
    }

    .btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding: 0.875rem 1.25rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn i {
      font-size: 1.125rem;
    }

    .btn-approve {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3);
    }

    .btn-approve:hover:not(:disabled) {
      background: linear-gradient(135deg, #16a34a, #15803d);
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.4);
    }

    .btn-reject {
      background: white;
      color: #dc2626;
      border: 2px solid #e5e7eb;
    }

    .btn-reject:hover:not(:disabled) {
      background: #fef2f2;
      border-color: #dc2626;
      transform: translateY(-2px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 6rem 2rem;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 2px dashed #e5e7eb;
    }

    .empty-icon {
      font-size: 5rem;
      color: #d1d5db;
      margin-bottom: 1.5rem;
    }

    .empty-state h2 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0b1120;
      margin-bottom: 0.75rem;
    }

    .empty-state p {
      color: #6b7280;
      font-size: 1.125rem;
      margin-bottom: 2rem;
    }

    .empty-illustration {
      font-size: 3rem;
      color: #22c55e;
      opacity: 0.3;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .trainer-requests-container {
        padding: 1.5rem;
      }

      .page-header {
        flex-direction: column;
        gap: 1.5rem;
      }

      .requests-grid {
        grid-template-columns: 1fr;
      }

      .card-footer {
        flex-direction: column;
      }
    }
  `]
})
export class TrainerRequestsComponent implements OnInit {
  pendingRequests: TrainerRequest[] = [];
  isProcessing = false;
  isLoading = true;

  constructor(
    private trainerRequestService: TrainerRequestService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadPendingRequests();
  }

  loadPendingRequests() {
    this.isLoading = true;
    this.trainerRequestService.getPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load requests', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  approveRequest(request: TrainerRequest) {
    if (!confirm(`Approve ${request.user.firstName} ${request.user.lastName} as a trainer?\n\nThis will:\n• Change their role to TRAINER\n• Activate their account\n• Grant them trainer privileges`)) {
      return;
    }

    this.isProcessing = true;
    this.trainerRequestService.approveRequest(request.id).subscribe({
      next: () => {
        alert(`✅ Success!\n\n${request.user.firstName} ${request.user.lastName} is now an approved trainer.\n\nImportant: They must log out and log in again to access trainer features (their session still has the old role).`);
        this.loadPendingRequests();
        this.isProcessing = false;
      },
      error: (err) => {
        console.error('Failed to approve request', err);
        let message = 'Failed to approve request. Please try again.';
        if (err.error) {
          message = typeof err.error === 'string' ? err.error : err.error.message || message;
        }
        alert('❌ Error: ' + message);
        this.isProcessing = false;
      }
    });
  }

  rejectRequest(request: TrainerRequest) {
    if (!confirm(`Decline ${request.user.firstName} ${request.user.lastName}'s trainer application?\n\nThey can reapply after 7 days.`)) {
      return;
    }

    this.isProcessing = true;
    this.trainerRequestService.rejectRequest(request.id).subscribe({
      next: () => {
        alert(`Application from ${request.user.firstName} ${request.user.lastName} has been declined.`);
        this.loadPendingRequests();
        this.isProcessing = false;
      },
      error: (err) => {
        console.error('Failed to reject request', err);
        let message = 'Failed to reject request. Please try again.';
        if (err.error) {
          message = typeof err.error === 'string' ? err.error : err.error.message || message;
        }
        alert('❌ Error: ' + message);
        this.isProcessing = false;
      }
    });
  }
}
