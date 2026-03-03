import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Certification {
  id: number;
  title: string;
  provider: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  price: string;
  category: string;
  icon: string;
  color: string;
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
        </div>
        <div class="hero-bg-blobs">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
        </div>
      </section>

      <!-- Filters Section -->
      <section class="filters-section">
        <div class="categories-tabs">
          <button 
            *ngFor="let cat of categories" 
            [class.active]="selectedCategory === cat"
            (click)="selectCategory(cat)"
            class="tab-btn"
          >
            {{ cat }}
          </button>
        </div>
      </section>

      <!-- Catalog Grid -->
      <section class="catalog-grid">
        <div class="card-modern" *ngFor="let cert of filteredCertifications">
          <div class="card-header-icon" [style.background]="cert.color">
            <i [class]="'bi ' + cert.icon"></i>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="level-badge" [ngClass]="cert.level.toLowerCase()">{{ cert.level }}</span>
              <span class="duration"><i class="bi bi-clock"></i> {{ cert.duration }}</span>
            </div>
            <h3>{{ cert.title }}</h3>
            <p class="provider">by {{ cert.provider }}</p>
            <p class="description">{{ cert.description }}</p>
            
            <div class="card-footer">
              <span class="price">{{ cert.price }}</span>
              <button class="btn-enroll">Enroll Now</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty Result State -->
      <div class="no-results" *ngIf="filteredCertifications.length === 0">
        <i class="bi bi-search"></i>
        <h3>No certifications found</h3>
        <p>Try adjusting your search or filters to find what you're looking for.</p>
        <button (click)="resetFilters()" class="btn-reset">Clear All Filters</button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background-color: #f8fafc;
      min-height: 100vh;
    }

    .certifications-catalog {
      max-width: 1300px;
      margin: 0 auto;
      padding-bottom: 5rem;
    }

    /* Hero Section */
    .hero-section {
      position: relative;
      padding: 6rem 2rem 4rem;
      text-align: center;
      overflow: hidden;
    }

    .hero-content {
      position: relative;
      z-index: 10;
      max-width: 800px;
      margin: 0 auto;
    }

    .badge-premium {
      display: inline-block;
      padding: 0.5rem 1.25rem;
      background: rgba(30, 58, 138, 0.1);
      color: #1e3a8a;
      border-radius: 50px;
      font-weight: 600;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .hero-section h1 {
      font-size: 3.5rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 1.5rem;
    }

    .text-gradient {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-section p {
      font-size: 1.25rem;
      color: #64748b;
      margin-bottom: 2.5rem;
    }

    /* Search Bar */
    .search-bar-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .search-input-wrapper {
      display: flex;
      align-items: center;
      background: white;
      padding: 0.75rem 1.5rem;
      border-radius: 100px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .search-input-wrapper:focus-within {
      box-shadow: 0 10px 30px rgba(59, 130, 246, 0.15);
      border-color: #3b82f6;
    }

    .search-input-wrapper i {
      color: #94a3b8;
      margin-right: 1rem;
      font-size: 1.25rem;
    }

    .search-input-wrapper input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 1.1rem;
      color: #1e293b;
    }

    /* Blobs */
    .hero-bg-blobs {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.3;
    }

    .blob-1 {
      width: 400px;
      height: 400px;
      background: #3b82f6;
      top: -100px;
      right: -50px;
    }

    .blob-2 {
      width: 300px;
      height: 300px;
      background: #8b5cf6;
      bottom: 0;
      left: -50px;
    }

    /* Filters */
    .filters-section {
      padding: 1rem 2rem 2rem;
      display: flex;
      justify-content: center;
    }

    .categories-tabs {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding: 0.5rem;
      scrollbar-width: none;
    }

    .tab-btn {
      padding: 0.6rem 1.5rem;
      border-radius: 50px;
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      border-color: #cbd5e1;
      color: #334155;
    }

    .tab-btn.active {
      background: #1e3a8a;
      color: white;
      border-color: #1e3a8a;
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
    }

    /* Grid */
    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
      padding: 0 2rem;
    }

    .card-modern {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
    }

    .card-modern:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
    }

    .card-header-icon {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .card-header-icon i {
      font-size: 3.5rem;
      color: white;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
    }

    .card-body {
      padding: 1.75rem;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .level-badge {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
    }

    .level-badge.beginner { background: #dcfce7; color: #166534; }
    .level-badge.intermediate { background: #fef9c3; color: #854d0e; }
    .level-badge.advanced { background: #fee2e2; color: #991b1b; }

    .duration {
      font-size: 0.85rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .card-body h3 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .provider {
      font-size: 0.95rem;
      color: #6366f1;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .description {
      font-size: 0.95rem;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      flex-grow: 1;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 1.5rem;
      border-top: 1px solid #f1f5f9;
    }

    .price {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
    }

    .btn-enroll {
      background: #1e3a8a;
      color: white;
      border: none;
      padding: 0.6rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-enroll:hover {
      background: #2563eb;
      transform: scale(1.05);
    }

    /* No Results */
    .no-results {
      text-align: center;
      padding: 4rem 2rem;
    }

    .no-results i {
      font-size: 3rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }

    .btn-reset {
      margin-top: 1rem;
      background: none;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .hero-section h1 { font-size: 2.5rem; }
      .catalog-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CertificationsListComponent implements OnInit {
  categories = ['All', 'IT & Cloud', 'Business', 'Marketing', 'Development', 'Design'];
  selectedCategory = 'All';
  searchQuery = '';

  certifications: Certification[] = [
    {
      id: 1,
      title: 'AWS Certified Solutions Architect',
      provider: 'Amazon Web Services',
      description: 'Master the design of resilient and scalable distributed systems on the AWS platform.',
      level: 'Intermediate',
      duration: '40 hours',
      price: '$150',
      category: 'IT & Cloud',
      icon: 'bi-cloud-check',
      color: 'linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)'
    },
    {
      id: 2,
      title: 'Google Data Analytics',
      provider: 'Google Career Certificates',
      description: 'Learn foundational data analytics skills including SQL, R, and Tableau to solve business problems.',
      level: 'Beginner',
      duration: '180 hours',
      price: '$39/mo',
      category: 'IT & Cloud',
      icon: 'bi-graph-up-arrow',
      color: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)'
    },
    {
      id: 3,
      title: 'Project Management (PMP)',
      provider: 'PMI Institute',
      description: 'The global gold standard for project management professionals worldwide.',
      level: 'Advanced',
      duration: '35 hours',
      price: '$405',
      category: 'Business',
      icon: 'bi-kanban',
      color: 'linear-gradient(135deg, #1e3a8a 0%, #6366f1 100%)'
    },
    {
      id: 4,
      title: 'Full Stack Web Development',
      provider: 'CertifyPro Academy',
      description: 'Comprehensive certification covering modern frontend and backend technologies.',
      level: 'Intermediate',
      duration: '12 weeks',
      price: '$299',
      category: 'Development',
      icon: 'bi-code-slash',
      color: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
    },
    {
      id: 5,
      title: 'UX/UI Professional Design',
      provider: 'Creative Studio',
      description: 'Master user experience research and user interface design for web and mobile.',
      level: 'Beginner',
      duration: '60 hours',
      price: '$250',
      category: 'Design',
      icon: 'bi-palette',
      color: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
    },
    {
      id: 6,
      title: 'Certified Ethical Hacker (CEH)',
      provider: 'EC-Council',
      description: 'The most extensive information security training program in the market.',
      level: 'Advanced',
      duration: '40 hours',
      price: '$1199',
      category: 'IT & Cloud',
      icon: 'bi-shield-lock',
      color: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
    }
  ];

  filteredCertifications: Certification[] = [];

  ngOnInit() {
    this.filteredCertifications = [...this.certifications];
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    this.filteredCertifications = this.certifications.filter(cert => {
      const matchesCategory = this.selectedCategory === 'All' || cert.category === this.selectedCategory;
      const matchesSearch = cert.title.toLowerCase().includes(this.searchQuery) ||
        cert.description.toLowerCase().includes(this.searchQuery) ||
        cert.provider.toLowerCase().includes(this.searchQuery);
      return matchesCategory && matchesSearch;
    });
  }

  resetFilters() {
    this.selectedCategory = 'All';
    this.searchQuery = '';
    this.applyFilters();
  }
}
