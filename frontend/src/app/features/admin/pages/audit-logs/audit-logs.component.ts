import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuditLog } from '../../../../shared/models/audit.model';
import { API_ENDPOINTS } from '../../../../core/api/api.config';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-container p-4 animate-fade-in">
      <div class="row align-items-center mb-4">
        <div class="col">
          <h1 class="page-title m-0">System Audit & History</h1>
          <p class="text-muted small">Track all user activity and administrative changes.</p>
        </div>
        <div class="col-auto">
          <button class="btn btn-outline-secondary btn-sm" (click)="loadLogs()">
             <i class="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light bg-opacity-50">
              <tr>
                <th>TIMESTAMP</th>
                <th>ACTION</th>
                <th>ACTOR</th>
                <th>TARGET</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs; track log.id) {
              <tr>
                <td class="small text-nowrap">{{ formatDate(log.createdAt) }}</td>
                <td>
                  <span class="badge" [ngClass]="getActionClass(log.action)">
                    {{ log.action }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-bold small">{{ log.actorEmail || 'System' }}</span>
                    <span class="text-muted tiny">ID: {{ log.actorId || '--' }}</span>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="small">{{ log.targetType || '--' }}</span>
                    <span class="text-muted tiny">ID: {{ log.targetId || '--' }}</span>
                  </div>
                </td>
                <td class="small text-muted">{{ log.details || '--' }}</td>
              </tr>
              } @empty {
              <tr>
                <td colspan="5" class="text-center py-5">
                  <i class="bi bi-journal-text fs-1 opacity-25 d-block mb-2"></i>
                  <p class="text-muted">No audit logs found.</p>
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
    .audit-container { max-width: 1200px; margin: 0 auto; }
    .page-title { font-weight: 800; color: #0b1f3b; }
    .table thead th { 
      font-size: 0.7rem; 
      font-weight: 800; 
      color: #9ca3af; 
      letter-spacing: 0.05em; 
      padding: 1.25rem 1.5rem; 
      text-transform: uppercase;
      border-bottom: 2px solid #f1f5f9;
    }
    .table tbody td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; }
    .badge { padding: 0.5em 0.8em; border-radius: 6px; font-weight: 600; font-size: 0.7rem; }
    .badge.bg-primary-subtle { background: #e0f2fe; color: #0369a1; }
    .badge.bg-danger-subtle { background: #fee2e2; color: #b91c1c; }
    .badge.bg-success-subtle { background: #dcfce7; color: #15803d; }
    .badge.bg-warning-subtle { background: #fef9c3; color: #a16207; }
    .tiny { font-size: 0.7rem; }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLog[] = [];
  loading = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.http.get<AuditLog[]>(API_ENDPOINTS.audit).subscribe({
      next: (data) => {
        console.log('Audit Logs loaded:', data);
        this.logs = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('FAILED to load audit logs:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(d: string) {
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  getActionClass(action: string) {
    if (action.includes('DELETE')) return 'bg-danger-subtle';
    if (action.includes('UPDATE')) return 'bg-warning-subtle';
    if (action.includes('CREATE')) return 'bg-success-subtle';
    return 'bg-primary-subtle';
  }
}
