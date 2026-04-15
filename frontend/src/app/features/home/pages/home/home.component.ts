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
<<<<<<< HEAD
              <a [routerLink]="isLoggedIn ? '/courses' : '/login'" class="btn-hero-primary">
                Explore Courses
=======
              <a [routerLink]="isLoggedIn ? '/trainings' : '/login'" class="btn-hero-primary">
                Explore Trainings
>>>>>>> origin/Trainings-Evaluation
                <i class="bi bi-arrow-right"></i>
              </a>
              <a routerLink="/certifications" class="btn-hero-secondary">
                View Certifications
              </a>
            </div>

             <div class="hero-stats">
              <div class="row">
                <div class="col-md-4 col-12">
                  <div class="stat-item">
                    <div class="stat-icon-box blue-stat"><i class="bi bi-journal-bookmark-fill"></i></div>
                    <div class="stat-info">
                      <span class="stat-value">500+</span>
<<<<<<< HEAD
                      <p class="stat-label">Online Courses</p>
=======
                      <p class="stat-label">Online Trainings</p>
>>>>>>> origin/Trainings-Evaluation
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

          <!-- Right Column: Small Hero Visual -->
          <div class="col-lg-6">
            <div class="hero-visual">
              <div class="hero-img-container">
                <!-- SVG Illustration - The Credential Architecture (Modern Glassmorphism) -->
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
                    <filter id="glassBlur">
                      <feGaussianBlur stdDeviation="8" />
                    </filter>
                    <filter id="softDrop">
                      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-opacity="0.15" />
                    </filter>
                  </defs>

                  <!-- Background structural elements -->
                  <rect x="40" y="40" width="320" height="240" rx="20" fill="url(#mainBlue)" opacity="0.03" />
                  <path d="M40 100 L360 100" stroke="hsl(222, 47%, 25%)" stroke-opacity="0.05" stroke-width="1" />
                  <path d="M120 40 L120 280" stroke="hsl(222, 47%, 25%)" stroke-opacity="0.05" stroke-width="1" />

                  <!-- Floating Glass Card 1 (Behind) -->
                  <g filter="url(#softDrop)">
                    <rect x="60" y="80" width="220" height="140" rx="12" fill="url(#glassGrad)" stroke="white" stroke-opacity="0.3" />
                    <rect x="80" y="105" width="100" height="6" rx="3" fill="white" opacity="0.4" />
                    <rect x="80" y="120" width="140" height="4" rx="2" fill="white" opacity="0.2" />
                    <rect x="80" y="130" width="120" height="4" rx="2" fill="white" opacity="0.2" />
                  </g>

                  <!-- Secondary Geometric Accents -->
                  <circle cx="300" cy="180" r="40" fill="url(#accentGold)" opacity="0.1" />
                  <circle cx="300" cy="180" r="25" stroke="url(#accentGold)" stroke-width="2" stroke-dasharray="4 4" opacity="0.3" />

                  <!-- Floating Glass Card 2 (Front) -->
                  <g filter="url(#softDrop)">
                    <rect x="140" y="130" width="200" height="130" rx="16" fill="white" fill-opacity="0.7" stroke="white" stroke-width="2" />
                    <!-- Ribbon detail on card -->
                    <rect x="140" y="150" width="200" height="25" fill="url(#mainBlue)" opacity="0.05" />
                    <!-- Seal Icon -->
                    <circle cx="290" cy="205" r="22" fill="url(#accentGold)" opacity="0.9" />
                    <path d="M282 205 L288 211 L298 199" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    
                    <!-- Text placeholders -->
                    <rect x="165" y="165" width="80" height="8" rx="4" fill="url(#mainBlue)" opacity="0.2" />
                    <rect x="165" y="185" width="100" height="5" rx="2" fill="url(#mainBlue)" opacity="0.1" />
                    <rect x="165" y="195" width="90" height="5" rx="2" fill="url(#mainBlue)" opacity="0.1" />
                    <rect x="165" y="205" width="70" height="5" rx="2" fill="url(#mainBlue)" opacity="0.1" />
                  </g>

                  <!-- Connection Line -->
                  <path d="M100 220 Q 140 280, 240 260" stroke="url(#accentGold)" stroke-width="2" stroke-dasharray="6 6" opacity="0.4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Content Sections (Path to Certification, Featured Courses etc) -->
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
<<<<<<< HEAD
        <h3 class="section-title">Featured Courses</h3>
=======
        <h3 class="section-title">Featured Trainings</h3>
>>>>>>> origin/Trainings-Evaluation
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
<<<<<<< HEAD
          <a [routerLink]="isLoggedIn ? '/courses' : '/login'" class="btn btn-primary">Browse All Courses</a>
=======
          <a [routerLink]="isLoggedIn ? '/trainings' : '/login'" class="btn btn-primary">Browse All Trainings</a>
>>>>>>> origin/Trainings-Evaluation
        </div>
      </div>
    </section>
  `,
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
