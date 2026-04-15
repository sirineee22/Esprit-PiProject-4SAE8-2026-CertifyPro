import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventsApiService } from '../../services/events.api';
import { Event, EventRegistration } from '../../../../shared/models/event.model';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-event-registrations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container p-4">
      <div class="d-flex align-items-center mb-4">
        <a [routerLink]="backLink" class="btn btn-outline-secondary btn-sm me-3">
          <i class="bi bi-arrow-left"></i> Retour
        </a>
        <h1 class="h3 m-0">Gestion des participants & Présences</h1>
      </div>

      <div *ngIf="event" class="card shadow-sm border-0 mb-4 p-3 bg-light">
          <div class="d-flex justify-content-between align-items-center">
            <div>
                <h2 class="h5 mb-1">{{event.title}}</h2>
                <span class="badge bg-secondary">{{event.type}} • {{event.mode}}</span>
            </div>
            <div class="text-end">
                <div class="small text-muted">Capacité Maximale</div>
                <div class="fw-bold fs-4">{{event.maxParticipants}} Places</div>
            </div>
          </div>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Chargement des participants...</p>
      </div>

      <div *ngIf="!loading && registrations.length === 0" class="card shadow-sm p-5 text-center">
        <i class="bi bi-people fs-1 opacity-25"></i>
        <p class="mt-3 text-muted">Aucune inscription pour cet événement.</p>
      </div>

      <div *ngIf="!loading && registrations.length > 0" class="card shadow-sm border-0 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light bg-opacity-50">
              <tr>
                <th>Participant</th>
                <th>Date d'inscription</th>
                <th>Statut</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (reg of registrations; track reg.id) {
                <tr>
                  <td>
                    <div class="d-flex flex-column">
                      <span class="fw-bold">{{reg.learnerFirstName}} {{reg.learnerLastName}}</span>
                      <span class="text-muted tiny">ID: {{reg.learnerId}}</span>
                    </div>
                  </td>
                  <td class="small">{{formatDate(reg.registeredAt)}}</td>
                  <td>
                    <span class="badge" [ngClass]="getStatusClass(reg.status)">
                      {{reg.status}}
                    </span>
                  </td>
                  <td class="text-end">
                    <div class="btn-group btn-group-sm">
                      @if (reg.status === 'PENDING') {
                        <button class="btn btn-success" (click)="approve(reg.id)" title="Approve">
                          <i class="bi bi-check-lg"></i> Approuver
                        </button>
                        <button class="btn btn-danger" (click)="reject(reg.id)" title="Reject">
                          <i class="bi bi-x-lg"></i> Rejeter
                        </button>
                      }
                      @if (reg.status === 'APPROVED' || reg.status === 'ATTENDED') {
                         @if (reg.status === 'APPROVED') {
                            <button class="btn btn-primary" (click)="markAttended(reg.id)" title="Confirmer Présence">
                                <i class="bi bi-person-check"></i> Présent
                            </button>
                         } @else {
                            <span class="text-success small fw-bold px-3">
                                <i class="bi bi-check-circle-fill"></i> Présent confirmé
                            </span>
                         }
                         <button class="btn btn-outline-danger" (click)="removeParticipant(reg.id)" title="Supprimer">
                            <i class="bi bi-trash"></i>
                         </button>
                      }

                      @if (reg.status === 'WAITLISTED') {
                         <button class="btn btn-success" (click)="approve(reg.id)" title="Approve">
                          <i class="bi bi-check-lg"></i> Faire entrer
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tiny { font-size: 0.75rem; }
    .table thead th { 
      font-size: 0.7rem; 
      font-weight: 800; 
      text-transform: uppercase; 
      color: #6b7280;
      padding: 1rem 1.5rem;
    }
    .table tbody td { padding: 1rem 1.5rem; }
    .badge { font-weight: 600; padding: 0.4em 0.8em; }
    .bg-pending { background: #fef3c7; color: #92400e; }
    .bg-approved { background: #dcfce7; color: #15803d; }
    .bg-rejected { background: #fee2e2; color: #b91c1c; }
    .bg-attended { background: #d1fae5; color: #065f46; }
    .bg-waitlisted { background: #f3f4f6; color: #374151; }
    .bg-cancelled { background: #fca5a5; color: #7f1d1d; }
    .bg-registered { background: #e0e7ff; color: #4338ca; } /* specific look for legacy */
  `]
})
export class EventRegistrationsComponent implements OnInit {
  eventId!: number;
  event: Event | null = null;
  registrations: EventRegistration[] = [];
  loading = true;
  backLink = '/events';

  constructor(
    private route: ActivatedRoute,
    private api: EventsApiService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    const currentUser = this.auth.getCurrentUser();
    const userRole = currentUser?.role?.name;
    this.backLink = userRole === 'ADMIN' ? '/admin/events' : '/events';

    this.loadEvent();
    this.loadRegistrations();
  }

  loadEvent() {
    this.api.getById(this.eventId).subscribe(ev => {
        this.event = ev;
        this.cdr.detectChanges();
    });
  }

  loadRegistrations() {
    this.loading = true;
    this.api.getRegistrations(this.eventId).subscribe({
      next: (data) => {
        this.registrations = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  approve(regId: number) {
    this.api.approveRegistration(regId).subscribe(() => this.loadRegistrations());
  }

  reject(regId: number) {
    this.api.rejectRegistration(regId).subscribe(() => this.loadRegistrations());
  }

  markAttended(regId: number) {
    this.api.markAsAttended(regId).subscribe(() => this.loadRegistrations());
  }

  removeParticipant(regId: number) {
    if (confirm('Voulez-vous retirer ce participant ? Sa place sera libérée.')) {
        this.api.rejectRegistration(regId).subscribe(() => this.loadRegistrations());
    }
  }

  formatDate(d: string) {
    return new Date(d).toLocaleString();
  }

  getStatusClass(status: string) {
    switch(status) {
      case 'PENDING': return 'bg-pending';
      case 'APPROVED': return 'bg-approved';
      case 'REJECTED': return 'bg-rejected';
      case 'ATTENDED': return 'bg-attended';
      case 'WAITLISTED': return 'bg-waitlisted';
      case 'CANCELLED': return 'bg-cancelled';
      case 'REGISTERED': return 'bg-registered';
      default: return 'bg-secondary';
    }
  }
}
