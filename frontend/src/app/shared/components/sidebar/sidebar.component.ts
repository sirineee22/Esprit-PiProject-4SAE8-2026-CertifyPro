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
          <i class="bi bi-shield-check"></i>
        </div>
        <div class="logo-text">
          <h2>Admin Panel</h2>
          <p>CertifyPro Management</p>
        </div>
      </div>

      <nav class="nav">
        <div class="nav-section">
          <span class="section-label">MAIN</span>
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">
            <i class="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </a>
        </div>

        <div class="nav-section">
          <span class="section-label">MANAGEMENT</span>
          <a routerLink="/admin/trainer-requests" routerLinkActive="active" class="nav-link">
            <i class="bi bi-person-check"></i>
            <span>Trainer Requests</span>
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-link">
            <i class="bi bi-people"></i>
            <span>Users</span>
          </a>
        </div>
        
        <div class="nav-section">
          <span class="section-label">CONTENT</span>
          <a class="nav-link disabled">
            <i class="bi bi-book"></i>
            <span>Trainings</span>
          </a>
          <a class="nav-link disabled">
            <i class="bi bi-award"></i>
            <span>Certifications</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-profile-info">
          <div class="admin-avatar">
            <i class="bi bi-person-circle"></i>
          </div>
          <div class="admin-details">
            <p class="admin-name">{{currentUser?.firstName}} {{currentUser?.lastName}}</p>
            <p class="admin-role">{{currentUser?.role?.name}}</p>
          </div>
        </div>
        <button (click)="logout()" class="logout-btn">
          <i class="bi bi-box-arrow-left"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
    <style>
      .sidebar-content { 
        padding: 2rem 1.5rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #0b1120;
        color: white;
      }

      .logo-section {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 2rem;
      }

      .logo-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
      }

      .logo-text h2 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        color: white;
      }

      .logo-text p {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
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
        font-size: 0.7rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 0.1em;   
        padding: 0 1rem;
        margin-bottom: 0.5rem;
      }

      .nav-link { 
        display: flex;
        align-items: center;     
        gap: 0.75rem;
        padding: 0.875rem 1rem;  
        text-decoration: none;   
        color: rgba(255, 255, 255, 0.7);
        border-radius: 10px;     
        transition: all 0.2s;    
        font-weight: 500;        
      }

      .nav-link i {
        font-size: 1.1rem;       
        width: 20px;
      }

      .nav-link:hover:not(.disabled) { 
        background: rgba(255, 255, 255, 0.08);
        color: white;
      }

      .nav-link.active { 
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        font-weight: 600;        
      }

      .nav-link.disabled {
        opacity: 0.4;
        cursor: not-allowed;     
      }

      .sidebar-footer {
        padding-top: 1.5rem;     
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        margin-top: 1rem;        
        display: flex;
        flex-direction: column;  
        gap: 1rem;
      }

      .admin-profile-info {
        display: flex;
        align-items: center;     
        gap: 0.75rem;
        padding: 0.75rem;        
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;     
      }

      .admin-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border-radius: 50%;      
        display: flex;
        align-items: center;     
        justify-content: center; 
        flex-shrink: 0;
      }

      .admin-avatar i {
        font-size: 1.5rem;       
        color: white;
      }

      .admin-details {
        flex: 1;
        min-width: 0;
      }

      .admin-name {
        font-size: 0.9rem;       
        font-weight: 600;        
        color: white;
        margin: 0;
        white-space: nowrap;     
        overflow: hidden;        
        text-overflow: ellipsis; 
      }

      .admin-role {
        font-size: 0.75rem;      
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;  
      }

      .logout-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;  
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #f87171;
        border-radius: 10px;     
        cursor: pointer;
        transition: all 0.2s;    
        font-weight: 600;        
      }

      .logout-btn:hover {        
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.5);
      }

      .logout-btn i {
        font-size: 1.1rem;       
      }
    </style>
  `
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
