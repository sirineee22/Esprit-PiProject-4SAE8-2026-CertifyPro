import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

interface CertificationDetail {
    id: number;
    title: string;
    provider: string;
    description: string;
    longDescription: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    duration: string;
    price: string;
    examFee: string;
    category: string;
    icon: string;
    color: string;
    topics: string[];
    skills: string[];
    prerequisites: string[];
    examFormat: {
        questions: number;
        duration: string;
        passingScore: string;
        format: string;
    };
    benefits: string[];
    validityPeriod: string;
    language: string;
    nextExamDate: string;
}

@Component({
    selector: 'app-certification-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="cert-detail-page" *ngIf="certification">

      <!-- Hero Banner -->
      <div class="cert-hero" [style.background]="certification.color">
        <div class="hero-overlay">
          <div class="hero-inner">
            <a routerLink="/certifications" class="back-link">
              <i class="bi bi-arrow-left"></i> All Certifications
            </a>
            <div class="hero-content">
              <div class="cert-icon-large">
                <i [class]="'bi ' + certification.icon"></i>
              </div>
              <div class="hero-text">
                <div class="hero-badges">
                  <span class="badge-level" [ngClass]="certification.level.toLowerCase()">{{ certification.level }}</span>
                  <span class="badge-category">{{ certification.category }}</span>
                </div>
                <h1>{{ certification.title }}</h1>
                <p class="hero-provider">by <strong>{{ certification.provider }}</strong></p>
                <p class="hero-desc">{{ certification.description }}</p>
                <div class="hero-stats">
                  <div class="stat">
                    <i class="bi bi-clock"></i>
                    <span>{{ certification.duration }}</span>
                  </div>
                  <div class="stat">
                    <i class="bi bi-globe"></i>
                    <span>{{ certification.language }}</span>
                  </div>
                  <div class="stat">
                    <i class="bi bi-shield-check"></i>
                    <span>Valid {{ certification.validityPeriod }}</span>
                  </div>
                  <div class="stat">
                    <i class="bi bi-calendar-event"></i>
                    <span>Next: {{ certification.nextExamDate }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="detail-layout">

        <!-- Left Column -->
        <div class="detail-main">

          <!-- About Section -->
          <section class="detail-section">
            <h2><i class="bi bi-info-circle"></i> About This Certification</h2>
            <p class="long-desc">{{ certification.longDescription }}</p>
          </section>

          <!-- Topics Covered -->
          <section class="detail-section">
            <h2><i class="bi bi-journal-bookmark"></i> Topics Covered</h2>
            <ul class="topics-list">
              <li *ngFor="let topic of certification.topics">
                <i class="bi bi-check-circle-fill"></i>
                {{ topic }}
              </li>
            </ul>
          </section>

          <!-- Skills You'll Gain -->
          <section class="detail-section">
            <h2><i class="bi bi-lightning-charge"></i> Skills You'll Gain</h2>
            <div class="skills-grid">
              <span class="skill-chip" *ngFor="let skill of certification.skills">{{ skill }}</span>
            </div>
          </section>

          <!-- Prerequisites -->
          <section class="detail-section">
            <h2><i class="bi bi-list-check"></i> Prerequisites</h2>
            <ul class="prereq-list">
              <li *ngFor="let prereq of certification.prerequisites">
                <i class="bi bi-dot"></i> {{ prereq }}
              </li>
            </ul>
          </section>

          <!-- Exam Format -->
          <section class="detail-section">
            <h2><i class="bi bi-clipboard-data"></i> Exam Format</h2>
            <div class="exam-grid">
              <div class="exam-stat-card">
                <i class="bi bi-question-circle"></i>
                <span class="exam-value">{{ certification.examFormat.questions }}</span>
                <span class="exam-label">Questions</span>
              </div>
              <div class="exam-stat-card">
                <i class="bi bi-hourglass-split"></i>
                <span class="exam-value">{{ certification.examFormat.duration }}</span>
                <span class="exam-label">Duration</span>
              </div>
              <div class="exam-stat-card">
                <i class="bi bi-graph-up"></i>
                <span class="exam-value">{{ certification.examFormat.passingScore }}</span>
                <span class="exam-label">Passing Score</span>
              </div>
              <div class="exam-stat-card">
                <i class="bi bi-display"></i>
                <span class="exam-value">{{ certification.examFormat.format }}</span>
                <span class="exam-label">Format</span>
              </div>
            </div>
          </section>

          <!-- Benefits -->
          <section class="detail-section">
            <h2><i class="bi bi-trophy"></i> Why Get Certified?</h2>
            <div class="benefits-grid">
              <div class="benefit-card" *ngFor="let benefit of certification.benefits">
                <i class="bi bi-check2-circle"></i>
                <p>{{ benefit }}</p>
              </div>
            </div>
          </section>

        </div>

        <!-- Right Sidebar -->
        <aside class="detail-sidebar">
          <div class="sidebar-card sticky-card">

            <!-- Price & CTA -->
            <div class="price-block">
              <p class="sidebar-label">Exam Fee</p>
              <p class="sidebar-price">{{ certification.examFee }}</p>
              <p class="sidebar-prep-price">Prep Course: <strong>{{ certification.price }}</strong></p>
            </div>

            <button class="btn-register" (click)="registerForExam()">
              <i class="bi bi-pencil-square"></i>
              Register for Exam
            </button>

            <button class="btn-enroll-secondary" (click)="enrollNow()">
              <i class="bi bi-book"></i>
              Enroll in Prep Course
            </button>

            <div class="sidebar-divider"></div>

            <!-- Key Info -->
            <ul class="sidebar-info-list">
              <li>
                <i class="bi bi-award"></i>
                <div>
                  <span class="info-label">Certification</span>
                  <span class="info-value">{{ certification.title }}</span>
                </div>
              </li>
              <li>
                <i class="bi bi-building"></i>
                <div>
                  <span class="info-label">Issued by</span>
                  <span class="info-value">{{ certification.provider }}</span>
                </div>
              </li>
              <li>
                <i class="bi bi-bar-chart-steps"></i>
                <div>
                  <span class="info-label">Level</span>
                  <span class="info-value">{{ certification.level }}</span>
                </div>
              </li>
              <li>
                <i class="bi bi-clock-history"></i>
                <div>
                  <span class="info-label">Validity</span>
                  <span class="info-value">{{ certification.validityPeriod }}</span>
                </div>
              </li>
              <li>
                <i class="bi bi-calendar-check"></i>
                <div>
                  <span class="info-label">Next Exam Date</span>
                  <span class="info-value">{{ certification.nextExamDate }}</span>
                </div>
              </li>
            </ul>

            <!-- Success Modal Overlay (shown after Register) -->
            <div class="registered-badge" *ngIf="registered">
              <i class="bi bi-patch-check-fill"></i>
              <p>You're registered! Check your email for details.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Not Found -->
    <div class="not-found" *ngIf="!certification">
      <i class="bi bi-exclamation-circle"></i>
      <h2>Certification Not Found</h2>
      <a routerLink="/certifications" class="btn-back">Back to Certifications</a>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* ====== HERO ====== */
    .cert-hero {
      position: relative;
      overflow: hidden;
    }

    .hero-overlay {
      background: linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 100%);
      padding: 3rem 2rem 4rem;
    }

    .hero-inner {
      max-width: 1200px;
      margin: 0 auto;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.85);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 2rem;
      transition: color 0.2s;
    }

    .back-link:hover { color: white; }

    .hero-content {
      display: flex;
      align-items: flex-start;
      gap: 2rem;
    }

    .cert-icon-large {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 20px;
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .cert-icon-large i {
      font-size: 3rem;
      color: white;
    }

    .hero-text { flex: 1; }

    .hero-badges {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .badge-level {
      padding: 0.3rem 0.9rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-level.beginner { background: #dcfce7; color: #166534; }
    .badge-level.intermediate { background: #fef9c3; color: #854d0e; }
    .badge-level.advanced { background: #fee2e2; color: #991b1b; }

    .badge-category {
      padding: 0.3rem 0.9rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
    }

    .hero-text h1 {
      font-size: 2.4rem;
      font-weight: 800;
      color: white;
      margin: 0 0 0.5rem;
      line-height: 1.2;
    }

    .hero-provider {
      color: rgba(255,255,255,0.8);
      font-size: 1rem;
      margin-bottom: 1rem;
    }

    .hero-provider strong { color: white; }

    .hero-desc {
      color: rgba(255,255,255,0.85);
      font-size: 1.05rem;
      line-height: 1.6;
      margin-bottom: 1.75rem;
      max-width: 680px;
    }

    .hero-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.9);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .stat i { font-size: 1rem; }

    /* ====== LAYOUT ====== */
    .detail-layout {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 2rem;
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2.5rem;
      align-items: start;
    }

    /* ====== SECTIONS ====== */
    .detail-section {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      border: 1px solid #f1f5f9;
    }

    .detail-section h2 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .detail-section h2 i {
      color: #3b82f6;
      font-size: 1.1rem;
    }

    .long-desc {
      color: #475569;
      line-height: 1.8;
      font-size: 1rem;
    }

    /* Topics */
    .topics-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.75rem;
    }

    .topics-list li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #334155;
      font-size: 0.95rem;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .topics-list li i {
      color: #10b981;
      font-size: 1rem;
      flex-shrink: 0;
    }

    /* Skills */
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .skill-chip {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 0.45rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    /* Prerequisites */
    .prereq-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .prereq-list li {
      display: flex;
      align-items: center;
      color: #475569;
      font-size: 0.95rem;
      padding: 0.4rem 0;
      border-bottom: 1px dashed #e2e8f0;
    }

    .prereq-list li:last-child { border-bottom: none; }
    .prereq-list li i { color: #6366f1; font-size: 1.5rem; }

    /* Exam Grid */
    .exam-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .exam-stat-card {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .exam-stat-card i {
      font-size: 1.5rem;
      color: #3b82f6;
    }

    .exam-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: #1e293b;
    }

    .exam-label {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Benefits */
    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }

    .benefit-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 10px;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 1px solid #bbf7d0;
    }

    .benefit-card i {
      color: #16a34a;
      font-size: 1.2rem;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    .benefit-card p {
      color: #15803d;
      font-size: 0.9rem;
      font-weight: 500;
      margin: 0;
      line-height: 1.5;
    }

    /* ====== SIDEBAR ====== */
    .detail-sidebar { position: relative; }

    .sticky-card {
      position: sticky;
      top: 80px;
      background: white;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      padding: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    }

    .price-block {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .sidebar-label {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .sidebar-price {
      font-size: 2.5rem;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .sidebar-prep-price {
      font-size: 0.9rem;
      color: #64748b;
    }

    .sidebar-prep-price strong {
      color: #334155;
      font-weight: 700;
    }

    /* CTA Buttons */
    .btn-register {
      width: 100%;
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      margin-bottom: 0.75rem;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);
    }

    .btn-register:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.45);
    }

    .btn-register:active { transform: translateY(0); }

    .btn-enroll-secondary {
      width: 100%;
      background: white;
      color: #1e3a8a;
      border: 2px solid #1e3a8a;
      padding: 0.9rem;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .btn-enroll-secondary:hover {
      background: #eff6ff;
    }

    .sidebar-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 1.5rem 0;
    }

    /* Info List */
    .sidebar-info-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sidebar-info-list li {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
    }

    .sidebar-info-list li > i {
      font-size: 1.1rem;
      color: #3b82f6;
      margin-top: 0.1rem;
      flex-shrink: 0;
    }

    .sidebar-info-list li > div {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .info-value {
      font-size: 0.9rem;
      color: #1e293b;
      font-weight: 600;
    }

    /* Registered Badge */
    .registered-badge {
      margin-top: 1.5rem;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 1px solid #86efac;
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      animation: fadeIn 0.4s ease;
    }

    .registered-badge i {
      font-size: 2rem;
      color: #16a34a;
      display: block;
      margin-bottom: 0.5rem;
    }

    .registered-badge p {
      color: #15803d;
      font-weight: 600;
      font-size: 0.9rem;
      margin: 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Not Found */
    .not-found {
      text-align: center;
      padding: 6rem 2rem;
    }

    .not-found i {
      font-size: 4rem;
      color: #cbd5e1;
      display: block;
      margin-bottom: 1rem;
    }

    .not-found h2 { color: #475569; margin-bottom: 1.5rem; }

    .btn-back {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #1e3a8a;
      color: white;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .detail-layout {
        grid-template-columns: 1fr;
      }
      .sticky-card { position: static; }
      .hero-text h1 { font-size: 1.8rem; }
      .hero-content { flex-direction: column; }
      .cert-icon-large { width: 70px; height: 70px; }
      .cert-icon-large i { font-size: 2rem; }
      .exam-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 600px) {
      .hero-overlay { padding: 2rem 1rem 3rem; }
      .detail-layout { padding: 1.5rem 1rem; }
    }
  `]
})
export class CertificationDetailComponent implements OnInit {
    certification: CertificationDetail | undefined;
    registered = false;

    private allCertifications: CertificationDetail[] = [
        {
            id: 1,
            title: 'AWS Certified Solutions Architect',
            provider: 'Amazon Web Services',
            description: 'Master the design of resilient and scalable distributed systems on the AWS platform.',
            longDescription: 'The AWS Certified Solutions Architect – Associate examination is intended for individuals who perform a solutions architect role and have one or more years of hands-on experience designing available, cost-efficient, fault-tolerant, and scalable distributed systems on AWS. This certification validates your ability to design and deploy well-architected solutions on AWS that meet the needs of organizations and applications.',
            level: 'Intermediate',
            duration: '40 hours',
            price: '$150',
            examFee: '$300',
            category: 'IT & Cloud',
            icon: 'bi-cloud-check',
            color: 'linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)',
            topics: [
                'Design Resilient Architectures',
                'Design High-Performing Architectures',
                'Design Secure Applications',
                'Design Cost-Optimized Architectures',
                'AWS Core Services (EC2, S3, RDS, VPC)',
                'Auto Scaling & Load Balancing',
                'Database Selection Strategies',
                'Identity & Access Management (IAM)'
            ],
            skills: ['Cloud Architecture', 'AWS EC2', 'S3 Storage', 'VPC Networking', 'IAM Security', 'RDS Databases', 'Lambda Functions', 'CloudFormation'],
            prerequisites: [
                'One or more years of hands-on experience with AWS',
                'Basic understanding of networking and security',
                'Familiarity with Linux or Windows system administration',
                'Knowledge of at least one scripting language is a plus'
            ],
            examFormat: {
                questions: 65,
                duration: '130 min',
                passingScore: '72%',
                format: 'Online / Proctored'
            },
            benefits: [
                'Globally recognized credential from AWS',
                'Increase your earning potential by 30%+',
                'Opens doors to senior cloud roles',
                'Validates your ability to design cloud systems',
                'Access to exclusive AWS community events',
                'Priority access to AWS job board'
            ],
            validityPeriod: '3 Years',
            language: 'English',
            nextExamDate: 'April 15, 2026'
        },
        {
            id: 2,
            title: 'Google Data Analytics',
            provider: 'Google Career Certificates',
            description: 'Learn foundational data analytics skills including SQL, R, and Tableau to solve business problems.',
            longDescription: 'The Google Data Analytics Professional Certificate prepares you for an entry-level role in data analytics in under six months. You will learn in-demand skills that will have you job-ready for a new career in one of the most in-demand fields. No degree or experience is required. Through a mix of videos, assessments, and hands-on labs you will learn how to prepare, process, analyze, and share data for thoughtful action.',
            level: 'Beginner',
            duration: '180 hours',
            price: '$39/mo',
            examFee: '$0 (included)',
            category: 'IT & Cloud',
            icon: 'bi-graph-up-arrow',
            color: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
            topics: [
                'Foundations of Data, Data Analysis',
                'Ask Questions to Make Data-Driven Decisions',
                'Prepare Data for Exploration',
                'Process Data from Dirty to Clean',
                'Analyze Data to Answer Questions',
                'Share Data Through the Art of Visualization',
                'Data Analysis with R Programming',
                'Google Data Analytics Capstone Project'
            ],
            skills: ['SQL', 'R Programming', 'Tableau', 'Data Cleaning', 'Data Visualization', 'Spreadsheets', 'Statistics', 'BigQuery'],
            prerequisites: [
                'No prior experience required',
                'Basic computer literacy',
                'Curiosity and willingness to learn',
                'Access to a computer with internet connection'
            ],
            examFormat: {
                questions: 50,
                duration: '90 min',
                passingScore: '80%',
                format: 'Online / Unproctored'
            },
            benefits: [
                'No prior experience needed',
                'Self-paced, flexible schedule',
                'Google-branded certificate on LinkedIn',
                'Resume-ready portfolio projects',
                'Access to Google\'s job search platform',
                'Eligible for 150+ job partner network'
            ],
            validityPeriod: 'Lifetime',
            language: 'English',
            nextExamDate: 'Anytime (Self-paced)'
        },
        {
            id: 3,
            title: 'Project Management (PMP)',
            provider: 'PMI Institute',
            description: 'The global gold standard for project management professionals worldwide.',
            longDescription: 'The Project Management Professional (PMP)® is the world\'s leading project management certification. Now including predictive, agile, and hybrid approaches, the PMP® proves project leadership experience and expertise in any way of working. It supercharges careers for project leaders across industries and helps organizations find the people they need to work smarter and perform better.',
            level: 'Advanced',
            duration: '35 hours',
            price: '$405',
            examFee: '$555',
            category: 'Business',
            icon: 'bi-kanban',
            color: 'linear-gradient(135deg, #1e3a8a 0%, #6366f1 100%)',
            topics: [
                'Project Integration Management',
                'Project Scope Management',
                'Project Schedule Management',
                'Project Cost Management',
                'Project Quality Management',
                'Project Resource Management',
                'Risk Management & Agile Approaches',
                'Stakeholder Engagement'
            ],
            skills: ['Agile', 'Scrum', 'Risk Management', 'Budget Planning', 'Stakeholder Management', 'Earned Value Management', 'PMBOK', 'Leadership'],
            prerequisites: [
                'Secondary degree (high school diploma, associate\'s degree, or global equivalent)',
                'Five years of project management experience (with secondary degree) OR 3 years with four-year degree',
                '35 hours of project management education/training'
            ],
            examFormat: {
                questions: 180,
                duration: '230 min',
                passingScore: 'Above Target',
                format: 'Online / Proctored'
            },
            benefits: [
                'Highest-paying PM certification globally',
                'Average salary increase of $15,000+',
                'Recognized in 180+ countries',
                'Access to PMI global community',
                'Professional Development Units (PDUs)',
                'Credibility with executive stakeholders'
            ],
            validityPeriod: '3 Years',
            language: 'English / French / Spanish',
            nextExamDate: 'May 2, 2026'
        },
        {
            id: 4,
            title: 'Full Stack Web Development',
            provider: 'CertifyPro Academy',
            description: 'Comprehensive certification covering modern frontend and backend technologies.',
            longDescription: 'The CertifyPro Full Stack Web Development certification is a comprehensive program designed to validate your ability to build modern, production-ready web applications from frontend to backend. You will master Angular, React, Node.js, databases, and cloud deployment practices through real-world projects and rigorous assessments.',
            level: 'Intermediate',
            duration: '12 weeks',
            price: '$299',
            examFee: '$199',
            category: 'Development',
            icon: 'bi-code-slash',
            color: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            topics: [
                'HTML5, CSS3 & Modern JavaScript (ES6+)',
                'Angular & React Frameworks',
                'Node.js & Express.js Backend',
                'REST API Design & GraphQL',
                'SQL & NoSQL Databases',
                'Authentication & Security',
                'Docker & AWS Deployment',
                'Git, CI/CD Pipelines'
            ],
            skills: ['Angular', 'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'Docker', 'REST APIs'],
            prerequisites: [
                'Basic knowledge of HTML, CSS, and JavaScript',
                'Understanding of object-oriented programming concepts',
                'Familiarity with command line tools',
                'A computer with at least 8GB RAM'
            ],
            examFormat: {
                questions: 80,
                duration: '120 min',
                passingScore: '75%',
                format: 'Online + Project'
            },
            benefits: [
                'CertifyPro Academy certified badge',
                'Portfolio project reviews',
                'Career placement assistance',
                'Access to mentorship network',
                'Job board with 500+ partners',
                'Alumni community access'
            ],
            validityPeriod: '2 Years',
            language: 'English / Arabic / French',
            nextExamDate: 'Rolling Admission'
        },
        {
            id: 5,
            title: 'UX/UI Professional Design',
            provider: 'Creative Studio',
            description: 'Master user experience research and user interface design for web and mobile.',
            longDescription: 'The UX/UI Professional Design certification from Creative Studio is a comprehensive credential for those looking to establish or advance their career in design. The program covers the full spectrum of user-centered design, from research methods and wireframing to high-fidelity prototyping and usability testing, using industry-standard tools like Figma and Adobe XD.',
            level: 'Beginner',
            duration: '60 hours',
            price: '$250',
            examFee: '$189',
            category: 'Design',
            icon: 'bi-palette',
            color: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            topics: [
                'Design Thinking & Human-Centered Design',
                'User Research Methods & Personas',
                'Information Architecture & Wireframing',
                'UI Design Principles & Typography',
                'Prototyping with Figma',
                'Usability Testing & Heuristic Evaluation',
                'Accessibility (WCAG Guidelines)',
                'Design Systems & Component Libraries'
            ],
            skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Wireframing', 'Design Systems', 'Typography', 'Accessibility'],
            prerequisites: [
                'No formal design experience required',
                'Interest in human behavior and problem solving',
                'A computer capable of running Figma (free tool)',
                'An eye for aesthetics is a plus'
            ],
            examFormat: {
                questions: 60,
                duration: '90 min',
                passingScore: '70%',
                format: 'Online + Portfolio'
            },
            benefits: [
                'Recognized by top design agencies',
                'Portfolio-building support',
                'Figma certification pathway',
                'Access to design resource library',
                'Freelance network connection',
                'LinkedIn profile optimization tips'
            ],
            validityPeriod: '2 Years',
            language: 'English / French',
            nextExamDate: 'April 22, 2026'
        },
        {
            id: 6,
            title: 'Certified Ethical Hacker (CEH)',
            provider: 'EC-Council',
            description: 'The most extensive information security training program in the market.',
            longDescription: 'The Certified Ethical Hacker (CEH) is a globally recognized certification that demonstrates expertise in ethical hacking methodologies. Holders of the CEH can think like a hacker and better defend their organizations against cyberattacks. The program covers 20 of the most current security domains an ethical hacker needs to know when penetration testing, securing, and hardening modern infrastructure.',
            level: 'Advanced',
            duration: '40 hours',
            price: '$1199',
            examFee: '$950',
            category: 'IT & Cloud',
            icon: 'bi-shield-lock',
            color: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            topics: [
                'Introduction to Ethical Hacking',
                'Footprinting and Reconnaissance',
                'Scanning Networks',
                'Enumeration & Vulnerability Analysis',
                'System Hacking & Malware Threats',
                'Sniffing, Social Engineering, DoS Attacks',
                'Session Hijacking & Web Server Attacks',
                'Cryptography & Cloud Computing Security'
            ],
            skills: ['Penetration Testing', 'Kali Linux', 'Metasploit', 'Wireshark', 'Network Security', 'Vulnerability Assessment', 'Cryptography', 'Incident Response'],
            prerequisites: [
                'Minimum 2 years of IT security experience',
                'Understanding of TCP/IP networking',
                'Knowledge of Windows and Linux operating systems',
                'Familiarity with basic programming/scripting concepts'
            ],
            examFormat: {
                questions: 125,
                duration: '240 min',
                passingScore: '70%',
                format: 'Online / Proctored'
            },
            benefits: [
                'Globally recognized by governments & enterprises',
                'Highest-paying cybersecurity certification',
                'Required by DoD 8570 compliance',
                'Access to EC-Council iLabs',
                'Membership in EC-Council community',
                'Ethical hacking toolkit & resources'
            ],
            validityPeriod: '3 Years',
            language: 'English',
            nextExamDate: 'April 10, 2026'
        }
    ];

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.certification = this.allCertifications.find(c => c.id === id);
    }

    registerForExam() {
        this.registered = true;
        setTimeout(() => {
            // Could navigate to a registration form in the future
        }, 300);
    }

    enrollNow() {
        // Could navigate to enrollment/payment page
        alert('Redirecting to enrollment page...');
    }
}
