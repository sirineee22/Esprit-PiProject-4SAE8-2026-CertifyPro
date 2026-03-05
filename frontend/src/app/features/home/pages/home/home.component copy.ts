import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <!-- Hero Section -->
    <section class="hero-wrapper">
      <div class="hero-bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
      <div class="grain-overlay"></div>
      <div class="container">
        <div class="row align-items-center">
          
          <!-- Left Column -->
          <div class="col-lg-6 hero-content">
            <span class="hero-badge">
              <i class="bi bi-award-fill"></i> Industry-Recognized Certifications
            </span>
            
            <h1 class="hero-title">
              Advance Your Career with <br>
              <span class="highlight">Professional Training</span>
            </h1>
            
            <p class="hero-description">
              Master in-demand skills, earn recognized certifications, and connect with a global community of professionals. Your path to excellence starts here.
            </p>
            
            <div class="hero-actions">
              <a [routerLink]="isLoggedIn ? '/courses' : '/login'" class="btn-hero-primary">
                Explore Courses
                <i class="bi bi-arrow-right"></i>
              </a>
              <a routerLink="/certifications" class="btn-hero-secondary">
                View Certifications
              </a>

              <!-- ✅ BOUTON MESSAGERIE dans les hero-actions (visible si connecté) -->
              <a *ngIf="isLoggedIn" routerLink="/chat" class="btn-hero-chat">
                <i class="bi bi-chat-dots-fill"></i>
                Messagerie
                <span class="chat-notif-dot"></span>
              </a>
            </div>

             <div class="hero-stats">
              <div class="row">
                <div class="col-md-4 col-12">
                  <div class="stat-item">
                    <div class="stat-icon-box blue-stat"><i class="bi bi-journal-bookmark-fill"></i></div>
                    <div class="stat-info">
                      <span class="stat-value">500+</span>
                      <p class="stat-label">Online Courses</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-4 col-12">
                  <div class="stat-item">
                    <div class="stat-icon-box amber-stat"><i class="bi bi-patch-check-fill"></i></div>
                    <div class="stat-info">
                      <span class="stat-value">50+</span>
                      <p class="stat-label">Certifications</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-4 col-12">
                  <div class="stat-item">
                    <div class="stat-icon-box purple-stat"><i class="bi bi-people-fill"></i></div>
                    <div class="stat-info">
                      <span class="stat-value">100K+</span>
                      <p class="stat-label">Learners</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="col-lg-6">
            <div class="hero-visual">
              <div class="hero-img-container">
                <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="mainBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:hsl(222, 47%, 25%)" />
                      <stop offset="100%" style="stop-color:hsl(222, 47%, 15%)" />
                    </linearGradient>
                    <linearGradient id="accentGold" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:hsl(38, 92%, 55%)" />
                      <stop offset="100%" style="stop-color:hsl(38, 92%, 45%)" />
                    </linearGradient>
                    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:rgba(255,255,255,0.2)" />
                      <stop offset="100%" style="stop-color:rgba(255,255,255,0.05)" />
                    </linearGradient>
                    <filter id="softDrop">
                      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-opacity="0.15" />
                    </filter>
                  </defs>
                  <rect x="40" y="40" width="320" height="240" rx="20" fill="url(#mainBlue)" opacity="0.03" />
                  <g filter="url(#softDrop)">
                    <rect x="60" y="80" width="220" height="140" rx="12" fill="url(#glassGrad)" stroke="white" stroke-opacity="0.3" />
                    <rect x="80" y="105" width="100" height="6" rx="3" fill="white" opacity="0.4" />
                    <rect x="80" y="120" width="140" height="4" rx="2" fill="white" opacity="0.2" />
                    <rect x="80" y="130" width="120" height="4" rx="2" fill="white" opacity="0.2" />
                  </g>
                  <circle cx="300" cy="180" r="40" fill="url(#accentGold)" opacity="0.1" />
                  <circle cx="300" cy="180" r="25" stroke="url(#accentGold)" stroke-width="2" stroke-dasharray="4 4" opacity="0.3" />
                  <g filter="url(#softDrop)">
                    <rect x="140" y="130" width="200" height="130" rx="16" fill="white" fill-opacity="0.7" stroke="white" stroke-width="2" />
                    <rect x="140" y="150" width="200" height="25" fill="url(#mainBlue)" opacity="0.05" />
                    <circle cx="290" cy="205" r="22" fill="url(#accentGold)" opacity="0.9" />
                    <path d="M282 205 L288 211 L298 199" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    <rect x="165" y="165" width="80" height="8" rx="4" fill="url(#mainBlue)" opacity="0.2" />
                    <rect x="165" y="185" width="100" height="5" rx="2" fill="url(#mainBlue)" opacity="0.1" />
                    <rect x="165" y="195" width="90" height="5" rx="2" fill="url(#mainBlue)" opacity="0.1" />
                    <rect x="165" y="205" width="70" height="5" rx="2" fill="url(#mainBlue)" opacity="0.1" />
                  </g>
                  <path d="M100 220 Q 140 280, 240 260" stroke="url(#accentGold)" stroke-width="2" stroke-dasharray="6 6" opacity="0.4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Certification Path -->
    <section class="certification-path-section">
      <div class="container">
        <h2 class="section-title">Your Path to Certification</h2>
        <p class="section-description">Our streamlined process makes it easy to start learning and achieve your goals.</p>
        <div class="row g-4 mt-4">
          <div class="col-md-6 col-lg-3" *ngFor="let step of certificationSteps; let i = index">
            <div class="step-card">
              <div class="step-number">{{ i + 1 }}</div>
              <div class="step-icon-container"><div class="step-icon" [innerHTML]="step.icon"></div></div>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-description">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Courses -->
    <section class="featured-courses-section">
      <div class="container">
        <h3 class="section-title">Featured Courses</h3>
        <p class="section-description">Expand your expertise with our curated selection.</p>
        <div class="row g-4 mt-4">
          <div class="col-md-4" *ngFor="let course of featuredCourses">
            <div class="course-card">
              <div class="course-card-body">
                <span class="badge badge-muted me-2">{{course.category}}</span>
                <span class="badge badge-success">{{course.level}}</span>
                <h5 class="course-title mt-3">{{course.title}}</h5>
                <p class="course-description">{{course.description}}</p>
              </div>
              <div class="course-card-footer">
                <small class="course-hours">{{course.hours}} hours</small>
                <span class="course-price">{{course.price | number}}</span>
              </div>
              <div class="course-card-footer">
                <a [routerLink]="isLoggedIn ? '/courses/' + course.slug : '/login'" class="btn btn-outline-primary w-100">View Course</a>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center mt-5">
          <a [routerLink]="isLoggedIn ? '/courses' : '/login'" class="btn btn-primary">Browse All Courses</a>
        </div>
      </div>
    </section>

    <!-- ============================================================
         ✅ BOUTON FLOTTANT MESSAGERIE (style WhatsApp / Messenger)
         Visible partout sur la page, coin bas-droit
         Uniquement si l'utilisateur est connecté
    ============================================================ -->
    <ng-container *ngIf="isLoggedIn">
      <a routerLink="/chat" class="fab-chat" title="Ouvrir la Messagerie">
        <div class="fab-icon">
          <i class="bi bi-chat-dots-fill"></i>
        </div>
        <span class="fab-label">Messagerie</span>
        <!-- Badge nombre de messages non lus -->
        <span class="fab-badge">3</span>
      </a>
    </ng-container>
  `,
  styles: [`
    /* ============================================================
       BOUTON DANS LES HERO ACTIONS
    ============================================================ */
    .btn-hero-chat {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-hero-chat:hover {
      background: rgba(245, 158, 11, 0.9);
      border-color: transparent;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
    }

    .btn-hero-chat i {
      font-size: 1.1rem;
    }

    .chat-notif-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      display: inline-block;
      animation: pulse-dot 2s infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.7; }
    }

    /* ============================================================
       BOUTON FLOTTANT FAB (Floating Action Button) 
       Style WhatsApp / Facebook Messenger
       Position : coin bas-droit, visible sur toute la page
    ============================================================ */
    .fab-chat {
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 9999;

      display: flex;
      align-items: center;
      gap: 10px;

      background: linear-gradient(135deg, #1a2f4e, #0d1f35);
      color: white;
      text-decoration: none;
      border-radius: 50px;
      padding: 14px 22px 14px 18px;

      box-shadow:
        0 8px 32px rgba(13, 31, 53, 0.5),
        0 2px 8px rgba(0, 0, 0, 0.3);

      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid rgba(245, 158, 11, 0.3);

      /* Animation d'entrée */
      animation: fab-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes fab-enter {
      from {
        transform: scale(0) translateY(20px);
        opacity: 0;
      }
      to {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }

    .fab-chat:hover {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-color: transparent;
      transform: scale(1.06) translateY(-3px);
      box-shadow:
        0 16px 40px rgba(245, 158, 11, 0.5),
        0 4px 16px rgba(0, 0, 0, 0.2);
      color: white;
    }

    /* Pulse animation quand pas hover */
    .fab-chat:not(:hover) .fab-icon {
      animation: fab-pulse 3s ease-in-out infinite;
    }

    @keyframes fab-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .fab-icon {
      width: 36px;
      height: 36px;
      background: rgba(245, 158, 11, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: background 0.3s;
    }

    .fab-chat:hover .fab-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .fab-label {
      font-weight: 700;
      font-size: 0.9rem;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    /* Badge nombre de messages non lus */
    .fab-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
      animation: badge-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both;
    }

    @keyframes badge-pop {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }

    /* Sur mobile : seulement l'icône ronde (comme WhatsApp) */
    @media (max-width: 768px) {
      .fab-chat {
        bottom: 24px;
        right: 24px;
        border-radius: 50%;
        padding: 18px;
        width: 60px;
        height: 60px;
        justify-content: center;
      }

      .fab-label {
        display: none;
      }

      .fab-icon {
        width: auto;
        height: auto;
        background: transparent;
        font-size: 1.5rem;
      }
    }
  `],
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private authService = inject(AuthService);

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  certificationSteps = [
    { title: 'Create Account', description: 'Sign up in seconds and set up your goals.', icon: '<i class="bi bi-person-plus"></i>' },
    { title: 'Enroll', description: 'Browse and enroll in industry-standard modules.', icon: '<i class="bi bi-book"></i>' },
    { title: 'Assessment', description: 'Test your knowledge with practical quizzes.', icon: '<i class="bi bi-clipboard-check"></i>' },
    { title: 'Certify', description: 'Earn globally recognized certificates.', icon: '<i class="bi bi-patch-check"></i>' }
  ];

  featuredCourses = [
    { category: 'Management', level: 'Advanced', title: 'Project Management Pro', description: 'Master methodologies and earn your PMP.', hours: 40, price: 12500, slug: 'pmp' },
    { category: 'Technology', level: 'Beginner', title: 'Data Analytics', description: 'Learn data analysis and visualization.', hours: 32, price: 8700, slug: 'data-analytics' },
    { category: 'Leadership', level: 'Intermediate', title: 'Leadership Excellence', description: 'Lead high-performing teams.', hours: 24, price: 6300, slug: 'leadership' },
  ];
}