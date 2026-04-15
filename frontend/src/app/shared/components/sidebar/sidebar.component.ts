import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="sidebar-content">
      <div class="logo-section">
        <div class="logo-icon">
          <i class="bi bi-shield-lock-fill"></i>
        </div>
        <div class="logo-text">
          <h2>CertifyPro</h2>
          <p>Admin Control Center</p>
        </div>
      </div>

      <nav class="nav">
        <div class="nav-section">
          <span class="section-label">MAIN</span>
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">
            <i class="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </a>
        </div>

        <div class="nav-section">
          <span class="section-label">MANAGEMENT</span>
          <a routerLink="/admin/trainer-requests" routerLinkActive="active" class="nav-link">
            <i class="bi bi-person-badge-fill"></i>
            <span>Trainer Requests</span>
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-link">
            <i class="bi bi-people-fill"></i>
            <span>User Management</span>
          </a>
          <a routerLink="/admin/posts" routerLinkActive="active" class="nav-link">
            <i class="bi bi-chat-left-text-fill"></i>
            <span>Forum Management</span>
          </a>
          
           <a routerLink="/admin/productss" routerLinkActive="active" class="nav-link">
            <i class="bi bi-chat-left-text-fill"></i>
            <span>Ecommerce Management</span>
          </a>
            <a routerLink="/admin/orders" routerLinkActive="active" class="nav-link">
            <i class="bi bi-chat-left-text-fill"></i>
            <span>Orders Management</span>
          </a>
          <a routerLink="/admin/events" routerLinkActive="active" class="nav-link">
            <i class="bi bi-calendar-event"></i>
            <span>Events</span>
          </a>
          <a routerLink="/admin/audit-logs" routerLinkActive="active" class="nav-link">
            <i class="bi bi-clock-history"></i>
            <span>Audit & History</span>
          </a>
        </div>
        
        <div class="nav-section">
          <span class="section-label">PLATFORM</span>
          <a class="nav-link disabled">
            <i class="bi bi-journal-check"></i>
            <span>Trainings</span>
          </a>
          <a class="nav-link disabled">
            <i class="bi bi-shield-lock-fill"></i>
            <span>Certifications</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-profile-card">
          <div class="admin-avatar-wrapper">
            <div class="admin-avatar">
              <i class="bi bi-person-workspace"></i>
            </div>
            <div class="status-indicator"></div>
          </div>
          <div class="admin-details">
            <p class="admin-name">{{currentUser?.firstName}} {{currentUser?.lastName}}</p>
            <p class="admin-role">Super {{currentUser?.role?.name}}</p>
          </div>
        </div>
        <button (click)="logout()" class="logout-btn">
          <i class="bi bi-power"></i>
          <span>System Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      --sidebar-bg: #0f172a;
      --sidebar-hover: rgba(255, 255, 255, 0.05);
      --primary: #f59e0b;
      --primary-glow: rgba(245, 158, 11, 0.15);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }

    .sidebar-content { 
      padding: 2rem 1.25rem;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--sidebar-bg);
      color: var(--text-main);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 2rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #4a3427, #8b6e4e);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
      box-shadow: 0 4px 15px rgba(74, 52, 39, 0.2);
    }

    .logo-text h2 {
      font-size: 1.2rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.02em;
      color: white;
    }

    .logo-text p {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin: 0;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .nav { 
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      overflow-y: auto;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .section-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.15em;   
      padding: 0 0.75rem;
      margin-bottom: 0.5rem;
    }

    .nav-link { 
      display: flex;
      align-items: center;     
      gap: 0.875rem;
      padding: 0.875rem 1rem;  
      text-decoration: none;   
      color: var(--text-muted);
      border-radius: 12px;     
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);    
      font-weight: 500;        
    }

    .nav-link i {
      font-size: 1.2rem;       
      transition: transform 0.2s;
    }

    .nav-link:hover:not(.disabled) { 
      background: var(--sidebar-hover);
      color: white;
      transform: translateX(4px);
    }

    .nav-link.active { 
      background: linear-gradient(135deg, var(--primary), #d97706);
      color: white;
      font-weight: 600;        
      box-shadow: 0 4px 15px var(--primary-glow);
    }

    .nav-link.active i {
      transform: scale(1.1);
    }

    .nav-link.disabled {
      opacity: 0.3;
      cursor: not-allowed;     
    }

    .sidebar-footer {
      padding-top: 1.5rem;     
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: 1rem;        
      display: flex;
      flex-direction: column;  
      gap: 1.25rem;
    }

    .admin-profile-card {
      display: flex;
      align-items: center;     
      gap: 0.875rem;
      padding: 1rem;        
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 14px;     
    }

    .admin-avatar-wrapper {
      position: relative;
    }

    .admin-avatar {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #334155, #1e293b);
      border-radius: 10px;      
      display: flex;
      align-items: center;     
      justify-content: center; 
      flex-shrink: 0;
      color: var(--primary);
      font-size: 1.25rem;
    }

    .status-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: #10b981;
      border: 2px solid var(--sidebar-bg);
      border-radius: 50%;
    }

    .admin-details {
      flex: 1;
      min-width: 0;
    }

    .admin-name {
      font-size: 0.9rem;       
      font-weight: 700;        
      color: white;
      margin: 0;
      white-space: nowrap;     
      overflow: hidden;        
      text-overflow: ellipsis; 
    }

    .admin-role {
      font-size: 0.7rem;      
      color: var(--primary);
      margin: 0;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;  
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.875rem;  
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #f87171;
      border-radius: 12px;     
      cursor: pointer;
      transition: all 0.2s;    
      font-weight: 700;        
      font-size: 0.9rem;
    }

    .logout-btn:hover {        
      background: #ef4444;
      color: white;
      border-color: #ef4444;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
    }
  `]

})
export class SidebarComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
  }

  logout() {
    this.authService.clearSession();
    this.router.navigate(['/login']);
  }
}
