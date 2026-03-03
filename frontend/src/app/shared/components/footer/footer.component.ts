import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <footer class="certifypro-footer">
      <div class="container">
        <div class="row g-4">
          <!-- Brand Column -->
          <div class="col-lg-4 col-md-6">
            <div class="footer-brand">
              <div class="footer-logo-container">
                <div class="logo-box-footer">
                  <i class="bi bi-mortarboard-fill footer-logo-icon"></i>
                </div>
                <span class="footer-brand-name">CertifyPro</span>
              </div>
              <p class="footer-description">
                Empowering professionals worldwide with industry-recognized certifications and expert-led training programs.
              </p>
              <div class="social-links">
                <a href="#" class="social-link" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" class="social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" class="social-link" aria-label="Pinterest">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.372 0 12s5.373 12 12 12c5.084 0 9.426-3.163 11.174-7.596-.09-.791-.536-3.3.127-4.71.21-.4 1.35-5.64 1.35-5.64s-.344-.69-.344-1.71c0-1.6.93-2.79 2.09-2.79.985 0 1.46.74 1.46 1.628 0 .988-.628 2.47-.95 3.84-.27 1.145.575 2.08 1.705 2.08 2.045 0 3.62-2.15 3.62-5.26 0-2.75-1.58-4.67-4.84-4.67-3.3 0-5.35 2.47-5.35 5.02 0 .988.38 2.05.85 2.61.094.113.107.212.079.327-.08.33-.26 1.04-.3 1.185-.047.184-.15.223-.348.135-1.31-.61-2.13-2.52-2.13-4.06 0-3.31 2.41-6.35 6.96-6.35 3.65 0 6.49 2.6 6.49 6.07 0 3.63-2.29 6.55-5.61 6.55-1.096 0-2.13-.57-2.48-1.29l-.67 2.55c-.24.93-.89 2.09-1.33 2.8 1 .31 2.06.48 3.16.48 6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <!-- Platform Column -->
          <div class="col-lg-2 col-md-6">
            <h4 class="footer-heading">Platform</h4>
            <ul class="footer-links">
              <li><a [routerLink]="isLoggedIn ? '/courses' : '/login'">Browse Courses</a></li>
              <li><a routerLink="/certifications">Certifications</a></li>
              <li><a routerLink="/learning-paths">Learning Paths</a></li>
              <li><a routerLink="/forum">Community Forum</a></li>
              <li><a routerLink="/enterprise">For Enterprise</a></li>
            </ul>
          </div>

          <!-- Resources Column -->
          <div class="col-lg-2 col-md-6">
            <h4 class="footer-heading">Resources</h4>
            <ul class="footer-links">
              <li><a routerLink="/help">Help Center</a></li>
              <li><a routerLink="/blog">Blog</a></li>
              <li><a routerLink="/success-stories">Success Stories</a></li>
              <li><a routerLink="/career-guide">Career Guide</a></li>
              <li><a routerLink="/api-docs">API Documentation</a></li>
            </ul>
          </div>

          <!-- Contact Column -->
          <div class="col-lg-4 col-md-6">
            <h4 class="footer-heading">Contact</h4>
            <ul class="footer-contact">
              <li>
                <svg class="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <a href="mailto:support@certifypro.com">support@certifypro.com</a>
              </li>
              <li>
                <svg class="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <a href="tel:+21612345678">+216 12 345 678</a>
              </li>
              <li>
                <svg class="contact-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>465 tunisia <br>Ariana, tunisia</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="footer-bottom">
          <div class="footer-copyright">
            © 2026 CertifyPro. All rights reserved.
          </div>
          <div class="footer-policies">
            <a routerLink="/privacy">Privacy Policy</a>
            <a routerLink="/terms">Terms of Service</a>
            <a routerLink="/cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
    `,
  styles: [`
      .certifypro-footer {
        background: hsl(222, 47%, 20%);
        color: white;
        padding: 4rem 0 2rem;
      }

      .footer-brand {
        margin-bottom: 2rem;
      }

      .footer-logo-container {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .logo-box-footer {
        width: 45px;
        height: 45px;
        background: hsl(38, 92%, 50%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
      }

      .footer-logo-icon {
        font-size: 1.5rem;
        color: white;
      }

      .footer-brand-name {
        font-size: 1.75rem;
        font-weight: 700;
        color: white;
        letter-spacing: -0.02em;
      }

      .footer-description {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
        line-height: 1.6;
        margin-bottom: 1.5rem;
      }

      .social-links {
        display: flex;
        gap: 0.75rem;
      }

      .social-link {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: all 0.3s ease;
        text-decoration: none;
      }

      .social-link:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
        color: white;
      }

      .footer-heading {
        font-size: 1.125rem;
        font-weight: 700;
        color: white;
        margin-bottom: 1.25rem;
      }

      .footer-links {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .footer-links li {
        margin-bottom: 0.75rem;
      }

      .footer-links a {
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        font-size: 0.95rem;
        transition: color 0.3s ease;
      }

      .footer-links a:hover {
        color: hsl(38, 92%, 50%);
      }

      .footer-contact {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .footer-contact li {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
        line-height: 1.6;
      }

      .contact-icon {
        color: hsl(38, 92%, 50%);
        flex-shrink: 0;
        margin-top: 0.125rem;
      }

      .footer-contact a {
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        transition: color 0.3s ease;
      }

      .footer-contact a:hover {
        color: hsl(38, 92%, 50%);
      }

      .footer-bottom {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .footer-copyright {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
      }

      .footer-policies {
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
      }

      .footer-policies a {
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: 0.9rem;
        transition: color 0.3s ease;
      }

      .footer-policies a:hover {
        color: rgba(255, 255, 255, 0.9);
      }

      @media (max-width: 768px) {
        .certifypro-footer {
          padding: 3rem 0 1.5rem;
        }

        .footer-bottom {
          flex-direction: column;
          text-align: center;
        }

        .footer-policies {
          justify-content: center;
        }
      }
    `]
})
export class FooterComponent {
  private authService = inject(AuthService);

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
