import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <!-- Hero Section -->
    <section class="hero-wrapper">
      <div class="container">
        <div class="row align-items-center">
          
          <!-- Left Column: Content -->
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
              <a routerLink="/courses" class="btn-hero-primary">
                Explore Courses
                <i class="bi bi-arrow-right"></i>
              </a>
              <a routerLink="/certifications" class="btn-hero-secondary">
                View Certifications
              </a>
            </div>

            <!-- Integrated Stats Section -->
             <div class="hero-stats">
              <div class="row">
                <div class="col-md-4 col-12">
                  <div class="stat-item">
                    <div class="stat-icon-box">
                      <i class="bi bi-journal-bookmark-fill"></i>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">500+</span>
                      <p class="stat-label">Online Courses</p>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4 col-12">
                  <div class="stat-item">
                    <div class="stat-icon-box">
                      <i class="bi bi-patch-check-fill"></i>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">50+</span>
                      <p class="stat-label">Certifications</p>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4 col-12">
                  <div class="stat-item">
                    <div class="stat-icon-box">
                      <i class="bi bi-people-fill"></i>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">100K+</span>
                      <p class="stat-label">Happy Learners</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Illustration -->
          <div class="col-lg-6">
            <div class="hero-visual">
              <div class="abstract-shape shape-1"></div>
              <div class="abstract-shape shape-2"></div>
              
              <div class="hero-img-container">
                <!-- SVG Illustration - Flowing Waves and Growth Bars -->
                <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <!-- Orange gradient for bars -->
                    <linearGradient id="barGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" style="stop-color:#d97706;stop-opacity:0.8" />
                      <stop offset="50%" style="stop-color:#e67e00;stop-opacity:0.9" />
                      <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="barGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" style="stop-color:#b45309;stop-opacity:0.7" />
                      <stop offset="50%" style="stop-color:#d97706;stop-opacity:0.85" />
                      <stop offset="100%" style="stop-color:#e67e00;stop-opacity:0.95" />
                    </linearGradient>
                    <!-- Wave gradient -->
                    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#e67e00;stop-opacity:0.3" />
                      <stop offset="50%" style="stop-color:#f59e0b;stop-opacity:0.5" />
                      <stop offset="100%" style="stop-color:#e67e00;stop-opacity:0.3" />
                    </linearGradient>
                  </defs>
                  
                  <!-- Growth Bars (columns) -->
                  <rect x="150" y="350" width="80" height="200" rx="8" fill="url(#barGrad1)" opacity="0.85"/>
                  <rect x="280" y="280" width="80" height="270" rx="8" fill="url(#barGrad2)" opacity="0.9"/>
                  <rect x="410" y="200" width="80" height="350" rx="8" fill="url(#barGrad1)" opacity="0.95"/>
                  <rect x="540" y="120" width="80" height="430" rx="8" fill="url(#barGrad2)" opacity="1"/>
                  
                  <!-- Flowing wave lines -->
                  <path d="M 50 450 Q 150 420, 250 440 T 450 430 T 650 450 T 850 440" 
                        stroke="url(#waveGrad)" stroke-width="2" fill="none" opacity="0.6"/>
                  <path d="M 50 470 Q 150 440, 250 460 T 450 450 T 650 470 T 850 460" 
                        stroke="url(#waveGrad)" stroke-width="2" fill="none" opacity="0.5"/>
                  <path d="M 50 490 Q 150 460, 250 480 T 450 470 T 650 490 T 850 480" 
                        stroke="url(#waveGrad)" stroke-width="2" fill="none" opacity="0.4"/>
                  
                  <!-- Subtle flowing curves -->
                  <path d="M 0 350 Q 200 300, 400 350 T 800 350" 
                        stroke="#e67e00" stroke-width="1.5" fill="none" opacity="0.2"/>
                  <path d="M 0 380 Q 200 330, 400 380 T 800 380" 
                        stroke="#f59e0b" stroke-width="1.5" fill="none" opacity="0.15"/>
                </svg>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>

    <!-- Path to Certification Section -->
    <section class="certification-path-section">
      <div class="container">
        <h2 class="section-title">Your Path to Certification</h2>
        <p class="section-description">
          Our streamlined process makes it easy to start learning, track your progress, and achieve your professional goals.
        </p>
        <div class="row g-4 mt-4">
          <div class="col-md-6 col-lg-3" *ngFor="let step of certificationSteps; let i = index">
            <div class="step-card">
              <div class="step-number">{{ i + 1 }}</div>
              <div class="step-icon-container">
                <div class="step-icon" [innerHTML]="step.icon"></div>
              </div>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-description">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Courses Section -->
    <section class="featured-courses-section">
      <div class="container">
        <h3 class="section-title">Featured Courses</h3>
        <p class="section-description">Expand your expertise with our curated selection of professional courses.</p>
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
                <a routerLink="/courses/{{course.slug}}" class="btn btn-outline-primary w-100">View Course</a>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center mt-5">
          <a routerLink="/courses" class="btn btn-primary">Browse All Courses</a>
        </div>
      </div>
    </section>
    `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  certificationSteps = [
    {
      title: 'Create Your Account',
      description: 'Sign up in seconds and set up your personalized learning profile with your goals and interests.',
      icon: `<i class="bi bi-person-plus"></i>`
    },
    {
      title: 'Enroll in Courses',
      description: 'Browse our catalog and enroll in courses that align with your career objectives and skill gaps.',
      icon: `<i class="bi bi-book"></i>`
    },
    {
      title: 'Complete Assessments',
      description: 'Test your knowledge with interactive quizzes and practical evaluations throughout your journey.',
      icon: `<i class="bi bi-clipboard-check"></i>`
    },
    {
      title: 'Earn Certifications',
      description: 'Receive industry-recognized certificates upon completion to showcase your new expertise.',
      icon: `<i class="bi bi-patch-check"></i>`
    }
  ];

  featuredCourses = [
    { category: 'Management', level: 'Advanced', title: 'Project Management Professional', description: 'Master project management methodologies and earn your PMP certification.', hours: 40, price: 12500, slug: 'pmp' },
    { category: 'Technology', level: 'Beginner', title: 'Data Analytics Fundamentals', description: 'Learn to analyze data, create visualizations, and drive business decisions.', hours: 32, price: 8700, slug: 'data-analytics' },
    { category: 'Leadership', level: 'Intermediate', title: 'Leadership Excellence', description: 'Develop essential leadership skills to inspire and guide high-performing teams.', hours: 24, price: 6300, slug: 'leadership-excellence' },
  ];
}
