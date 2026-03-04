import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { API_ENDPOINTS } from '../../../core/api/api.config';

interface Certification {
  id: number;
  code: string;
  name: string;
  description: string;
  validityMonths: number;
  requiredScore: number;
  isActive: boolean;
}

@Component({
  selector: 'app-certifications-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="certifications-catalog">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <span class="badge-premium">Official Certifications</span>
          <h1>Elevate Your <span class="text-gradient">Professional</span> Career</h1>
          <p>Get certified by industry leaders and validate your skills on a global scale.</p>

          <div class="search-bar-container">
            <div class="search-input-wrapper">
              <i class="bi bi-search"></i>
              <input type="text" placeholder="Search certifications..." (input)="onSearch($event)">
            </div>
          </div>

          <a *ngIf="isTrainer" routerLink="/trainer/create-certification" class="btn-create-cert">
            <i class="bi bi-plus-circle-fill"></i> Create Certification
          </a>
        </div>
        <div class="hero-bg-blobs">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
        </div>
      </section>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <i class="bi bi-arrow-repeat spin"></i>
        <p>Loading certifications...</p>
      </div>

      <!-- Error State -->
      <div class="no-results" *ngIf="errorMessage && !isLoading">
        <i class="bi bi-exclamation-circle"></i>
        <h3>Could not load certifications</h3>
        <p>{{ errorMessage }}</p>
        <button (click)="loadCertifications()" class="btn-reset">Try Again</button>
      </div>

      <!-- Catalog Grid -->
      <section class="catalog-grid" *ngIf="!isLoading && !errorMessage && filteredCertifications.length > 0">
        <div class="card-modern" *ngFor="let cert of filteredCertifications; let i = index">
          <div class="card-header-icon" [style.background]="getCardColor(i)">
            <i [class]="'bi ' + getCardIcon(i)"></i>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="cert-code">{{ cert.code }}</span>
              <span class="duration" *ngIf="cert.validityMonths">
                <i class="bi bi-clock"></i> {{ cert.validityMonths }} months validity
              </span>
            </div>
            <h3>{{ cert.name }}</h3>
            <p class="description">{{ cert.description || 'No description provided.' }}</p>
            <div class="card-footer">
              <span class="score-badge" *ngIf="cert.requiredScore">
                <i class="bi bi-patch-check"></i> Pass: {{ cert.requiredScore }}%
              </span>
              <a [routerLink]="['/certifications', cert.id]" class="btn-enroll">View Details</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div class="no-results" *ngIf="!isLoading && !errorMessage && filteredCertifications.length === 0">
        <i class="bi bi-journal-x"></i>
        <h3>{{ searchQuery ? 'No results found' : 'No certifications available yet' }}</h3>
        <p *ngIf="!searchQuery">Trainers haven't created any certifications yet. Check back soon!</p>
        <p *ngIf="searchQuery">No certifications match "{{ searchQuery }}".</p>
        <button *ngIf="searchQuery" (click)="resetFilters()" class="btn-reset">Clear Search</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background-color: #f8fafc; min-height: 100vh; }
    .certifications-catalog { max-width: 1300px; margin: 0 auto; padding-bottom: 5rem; }

    .hero-section {
      position: relative; padding: 6rem 2rem 4rem; text-align: center; overflow: hidden;
    }
    .hero-content { position: relative; z-index: 10; max-width: 800px; margin: 0 auto; }
    .badge-premium {
      display: inline-block; padding: 0.5rem 1.25rem;
      background: rgba(30,58,138,0.1); color: #1e3a8a; border-radius: 50px;
      font-weight: 600; font-size: 0.85rem; margin-bottom: 1.5rem;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .hero-section h1 { font-size: 3.5rem; font-weight: 800; color: #0f172a; line-height: 1.2; margin-bottom: 1.5rem; }
    .text-gradient {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero-section p { font-size: 1.25rem; color: #64748b; margin-bottom: 2.5rem; }

    .search-bar-container { max-width: 600px; margin: 0 auto; }
    .search-input-wrapper {
      display: flex; align-items: center; background: white;
      padding: 0.75rem 1.5rem; border-radius: 100px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: all 0.3s ease;
    }
    .search-input-wrapper:focus-within { box-shadow: 0 10px 30px rgba(59,130,246,0.15); border-color: #3b82f6; }
    .search-input-wrapper i { color: #94a3b8; margin-right: 1rem; font-size: 1.25rem; }
    .search-input-wrapper input { border: none; outline: none; width: 100%; font-size: 1.1rem; color: #1e293b; }

    .hero-bg-blobs { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
    .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; }
    .blob-1 { width: 400px; height: 400px; background: #3b82f6; top: -100px; right: -50px; }
    .blob-2 { width: 300px; height: 300px; background: #8b5cf6; bottom: 0; left: -50px; }

    .catalog-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; padding: 0 2rem;
    }
    .card-modern {
      background: white; border-radius: 20px; overflow: hidden;
      border: 1px solid #f1f5f9; transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      display: flex; flex-direction: column;
    }
    .card-modern:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); }
    .card-header-icon { height: 120px; display: flex; align-items: center; justify-content: center; }
    .card-header-icon i { font-size: 3.5rem; color: white; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }

    .card-body { padding: 1.75rem; flex-grow: 1; display: flex; flex-direction: column; }
    .card-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .cert-code {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      padding: 0.25rem 0.75rem; border-radius: 6px; background: #eff6ff; color: #1e3a8a; letter-spacing: 0.5px;
    }
    .duration { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
    .card-body h3 { font-size: 1.35rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem; }
    .description { font-size: 0.95rem; color: #64748b; line-height: 1.6; margin-bottom: 1.5rem; flex-grow: 1; }

    .card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; }
    .score-badge { font-size: 0.9rem; font-weight: 600; color: #059669; display: flex; align-items: center; gap: 0.35rem; }
    .btn-enroll {
      background: #1e3a8a; color: white; border: none; padding: 0.6rem 1.5rem;
      border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
      text-decoration: none; display: inline-block;
    }
    .btn-enroll:hover { background: #2563eb; transform: scale(1.05); }

    .loading-state { text-align: center; padding: 5rem 2rem; color: #94a3b8; }
    .loading-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .no-results { text-align: center; padding: 4rem 2rem; }
    .no-results i { font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem; }
    .btn-reset { margin-top: 1rem; background: none; border: 1px solid #cbd5e1; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer; }

    .btn-create-cert {
      display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 1.5rem;
      background: linear-gradient(135deg, #059669, #10b981); color: white; text-decoration: none;
      padding: 0.75rem 1.75rem; border-radius: 50px; font-weight: 700; font-size: 0.95rem;
      box-shadow: 0 4px 14px rgba(16,185,129,0.35); transition: all 0.25s ease;
    }
    .btn-create-cert:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(16,185,129,0.45); }

    @media (max-width: 768px) {
      .hero-section h1 { font-size: 2.5rem; }
      .catalog-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CertificationsListComponent implements OnInit {
  searchQuery = '';
  certifications: Certification[] = [];
  filteredCertifications: Certification[] = [];
  isLoading = true;   // ← start true so no empty-state flash before data arrives
  errorMessage = '';

  private colors = [
    'linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)',
    'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
    'linear-gradient(135deg, #1e3a8a 0%, #6366f1 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  ];

  private icons = [
    'bi-patch-check', 'bi-award', 'bi-mortarboard', 'bi-journal-check',
    'bi-trophy', 'bi-star', 'bi-bookmark-star', 'bi-lightning-charge'
  ];

  get isTrainer(): boolean {
    return this.auth.getCurrentUser()?.role?.name === 'TRAINER';
  }

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadCertifications();
  }

  loadCertifications() {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Certification[]>(API_ENDPOINTS.certifications).subscribe({
      next: (data) => {
        console.log('[CertificationsList] Raw API response:', data);
        const list = Array.isArray(data) ? data : [];
        console.log('[CertificationsList] Total certifications received:', list.length);
        // Show all active certifications (isActive true or not explicitly false)
        this.certifications = list.filter(c => c.isActive !== false);
        this.filteredCertifications = [...this.certifications];
        this.isLoading = false;
        console.log('[CertificationsList] Displaying', this.filteredCertifications.length, 'certifications');
        this.cdr.markForCheck(); // force Angular to update the view
      },
      error: (err) => {
        console.error('[CertificationsList] API Error:', err);
        this.errorMessage = 'Unable to reach the server. Make sure the backend is running on port 8083.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getCardColor(index: number): string {
    return this.colors[index % this.colors.length];
  }

  getCardIcon(index: number): string {
    return this.icons[index % this.icons.length];
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    this.filteredCertifications = this.certifications.filter(cert =>
      cert.name.toLowerCase().includes(this.searchQuery) ||
      (cert.description ?? '').toLowerCase().includes(this.searchQuery) ||
      cert.code.toLowerCase().includes(this.searchQuery)
    );
  }

  resetFilters() {
    this.searchQuery = '';
    this.filteredCertifications = [...this.certifications];
  }
}
