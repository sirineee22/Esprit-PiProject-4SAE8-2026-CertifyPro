import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-certifications-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="certifications-container">
      <div class="page-header">
        <h1>Certifications Disponibles</h1>
        <p>Obtenez des certifications reconnues par l'industrie</p>
      </div>

      <div class="empty-state">
        <i class="bi bi-award"></i>
        <h2>Bientôt disponible</h2>
        <p>Le catalogue de certifications sera disponible prochainement.</p>
        <a routerLink="/" class="btn-home">Retour à l'accueil</a>
      </div>
    </div>
  `,
  styles: [`
    .certifications-container {
      padding: 3rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .page-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: hsl(222, 47%, 20%);
      margin-bottom: 0.5rem;
    }

    .page-header p {
      font-size: 1.1rem;
      color: #64748b;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .empty-state i {
      font-size: 4rem;
      color: hsl(38, 92%, 50%);
      margin-bottom: 1.5rem;
    }

    .empty-state h2 {
      font-size: 1.8rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 1rem;
    }

    .empty-state p {
      font-size: 1.1rem;
      color: #64748b;
      margin-bottom: 2rem;
    }

    .btn-home {
      display: inline-block;
      padding: 0.875rem 2rem;
      background: hsl(222, 47%, 20%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-home:hover {
      background: hsl(222, 47%, 15%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
  `]
})
export class CertificationsListComponent {}
