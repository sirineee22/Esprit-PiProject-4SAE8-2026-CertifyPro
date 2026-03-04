import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../../../forum/services/forum.service';
import { Post } from '../../../../forum/models/post.model';
import { UserService } from '../../../users/services/users.api';
import { User } from '../../../../shared/models/user.model';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PostModalComponent } from '../../components/post-modal/post-modal.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { API_BASE_URL } from '../../../../core/api/api.config';

@Component({
  selector: 'app-forum-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="forum-wrapper">
      <div class="header-banner">
        <div class="banner-content">
          <span class="badge">Community</span>
          <h1>CertifyPro Forum</h1>
          <p>Join the conversation with thousands of professionals today.</p>
          <div class="search-box">
            <mat-icon class="search-icon">search</mat-icon>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (input)="onSearchChange(searchQuery)" 
              placeholder="Search for topics, questions, or experts..."
              class="dynamic-search-input"
            >
            <button *ngIf="searchQuery" (click)="searchQuery = ''; onSearchChange('')" class="clear-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="forum-content container">
        <div class="forum-main" *ngIf="!loading">
          <div class="filters">
            <button class="filter-btn" [class.active]="currentSort === 'latest'" (click)="setSort('latest')">Latest</button>
            <button class="filter-btn" [class.active]="currentSort === 'popular'" (click)="setSort('popular')">Popular</button>
            <button class="filter-btn" [class.active]="currentSort === 'trending'" (click)="setSort('trending')">Trending</button>
            <div class="spacer"></div>
            <button mat-raised-button color="primary" class="btn-create-new" (click)="openCreateModal()">
              <mat-icon>add</mat-icon> New Post
            </button>
          </div>

          <div class="posts-grid" *ngIf="filteredPosts.length > 0">
            <div class="post-card-premium" *ngFor="let post of filteredPosts">
              <div class="post-meta">
                <div class="author-info">
                  <div class="author-avatar">{{getUserInitials(post.userId)}}</div>
                  <div class="author-details">
                    <span class="author-name">{{getUserFullName(post.userId)}}</span>
                    <span class="post-date">{{formatDate(post.createdAt)}}</span>
                  </div>
                </div>
                <div class="post-category">General</div>
              </div>
              
              <div class="post-body-container" [routerLink]="['/forum/post', post.id]">
                <h2 class="post-title">{{post.title}}</h2>
                <p class="post-excerpt">{{post.content | slice:0:150}}{{post.content.length > 150 ? '...' : ''}}</p>
              </div>
              
              <div class="post-actions-row">
                <div class="stats-interactive">
                  <button mat-icon-button [color]="post.isLikedByCurrentUser ? 'warn' : ''" (click)="toggleLike(post); $event.stopPropagation()" title="React">
                    <mat-icon>{{post.isLikedByCurrentUser ? 'favorite' : 'favorite_border'}}</mat-icon>
                    <span class="count">{{post.reactionCount}}</span>
                  </button>
                  <button mat-icon-button color="primary" [routerLink]="['/forum/post', post.id]" title="Comment">
                    <mat-icon>chat_bubble_outline</mat-icon>
                    <span class="count">{{post.commentCount}}</span>
                  </button>
                </div>
                <button class="read-more-btn" [routerLink]="['/forum/post', post.id]">
                  <span>Read More</span>
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            </div>
          </div>
          
          <div *ngIf="filteredPosts.length === 0" class="empty-state-premium">
            <div class="empty-icon">
              <mat-icon>chat_bubble</mat-icon>
            </div>
            <h3>No results found</h3>
            <p>We couldn't find any posts matching "{{searchQuery}}"</p>
            <button class="btn-create-large" (click)="searchQuery = ''; onSearchChange('')">Clear Search</button>
          </div>
        </div>

        <div class="loading-premium" *ngIf="loading">
          <div class="skeleton-card" *ngFor="let i of [1,2,3]"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forum-wrapper { min-height: 100vh; background: #f8fafc; }
    .header-banner { background: linear-gradient(135deg, #0b1f3b 0%, #1e3a5f 100%); padding: 5rem 2rem; color: white; text-align: center; position: relative; overflow: hidden; }
    .banner-content { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }
    .badge { background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; margin-bottom: 1.5rem; display: inline-block; }
    .header-banner h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -1px; }
    .header-banner p { font-size: 1.25rem; opacity: 0.8; margin-bottom: 2.5rem; }
    
    .search-box { max-width: 650px; margin: 0 auto; position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 1.5rem; color: #94a3b8; z-index: 5; }
    .dynamic-search-input { 
      width: 100%; padding: 1.25rem 3rem 1.25rem 3.5rem; border-radius: 50px; border: 2px solid transparent; 
      background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.15); font-size: 1.1rem; outline: none; 
      transition: all 0.3s ease; 
    }
    .dynamic-search-input:focus { border-color: #f59e0b; box-shadow: 0 10px 40px rgba(245, 158, 11, 0.2); }
    .clear-btn { position: absolute; right: 1rem; background: #f1f5f9; border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }

    .forum-content { max-width: 1100px; margin: -3.5rem auto 4rem; position: relative; z-index: 2; padding: 0 1.5rem; }
    .filters { display: flex; gap: 1rem; margin-bottom: 2.5rem; align-items: center; }
    .filter-btn { padding: 0.75rem 1.5rem; border-radius: 12px; border: none; background: white; color: #64748b; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .filter-btn.active { background: #0b1f3b; color: white; box-shadow: 0 10px 20px rgba(11, 31, 59, 0.2); }
    .spacer { flex: 1; }
    .btn-create-new { border-radius: 12px !important; padding: 0.5rem 1.5rem !important; font-weight: 700 !important; }

    .posts-grid { display: flex; flex-direction: column; gap: 2rem; }
    .post-card-premium { background: white; border-radius: 24px; padding: 2.5rem; border: 1px solid #edf2f7; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .post-card-premium:hover { transform: translateY(-8px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08); }
    
    .post-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .author-info { display: flex; align-items: center; gap: 1rem; }
    .author-avatar { width: 45px; height: 45px; background: #e2e8f0; color: #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .author-name { font-weight: 700; color: #1e293b; }
    .post-date { font-size: 0.8rem; color: #94a3b8; }
    .post-category { background: #f1f5f9; color: #475569; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; }

    .post-body-container { cursor: pointer; margin-bottom: 1.5rem; }
    .post-title { font-size: 1.85rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; transition: color 0.2s; }
    .post-card-premium:hover .post-title { color: #f59e0b; }
    .post-excerpt { color: #475569; line-height: 1.7; font-size: 1.1rem; }

    .post-actions-row { display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; }
    
    .stats-interactive { display: flex; gap: 1rem; align-items: center; }
    .stats-interactive button { display: flex; align-items: center; gap: 0.25rem; width: auto !important; padding: 0 12px !important; border-radius: 12px !important; }
    .count { font-weight: 700; font-size: 0.95rem; margin-left: 4px; }

    .read-more-btn { 
      background: #fff7ed; color: #ea580c; border: none; padding: 0.6rem 1.2rem; border-radius: 12px; 
      font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; transition: all 0.2s; 
    }
    .read-more-btn:hover { background: #ffedd5; gap: 0.5rem; }

    .empty-state-premium { text-align: center; padding: 6rem 2rem; background: white; border-radius: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.02); }
    .empty-icon { font-size: 5rem; color: #fed7aa; margin-bottom: 1.5rem; }
    .btn-create-large { background: #f59e0b; color: white; border: none; padding: 1rem 2rem; border-radius: 50px; font-weight: 700; cursor: pointer; margin-top: 2rem; }

    .loading-premium { display: flex; flex-direction: column; gap: 1.5rem; }
    .skeleton-card { height: 200px; background: white; border-radius: 20px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
  `]
})
export class ForumListComponent implements OnInit {
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  users: Map<number, User> = new Map();
  loading = true;
  searchQuery = '';
  currentSort: 'latest' | 'popular' | 'trending' = 'latest';
  private searchSubject = new Subject<string>();

  constructor(
    private forumService: ForumService,
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    const savedSort = localStorage.getItem('forumSort') as any;
    if (savedSort) this.currentSort = savedSort;

    this.loadPosts();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.filterAndSort());
  }

  loadPosts(): void {
    this.loading = true;
    this.forumService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.filterAndSort();
        this.loading = false;
        // Batch load users to avoid too many requests
        const uniqueUserIds = [...new Set(data.map(p => p.userId))];
        uniqueUserIds.forEach(id => this.ensureUserLoaded(id));
      },
      error: () => this.loading = false
    });
  }

  ensureUserLoaded(userId: number): void {
    if (!this.users.has(userId)) {
      this.userService.getById(userId).subscribe({
        next: (user) => {
          this.users.set(userId, user);
          this.filterAndSort();
        }
      });
    }
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  setSort(sort: 'latest' | 'popular' | 'trending') {
    this.currentSort = sort;
    localStorage.setItem('forumSort', sort);
    this.filterAndSort();
  }

  filterAndSort() {
    let result = [...this.posts];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p => {
        const titleMatch = p.title?.toLowerCase().includes(q);
        const contentMatch = p.content?.toLowerCase().includes(q);
        const authorMatch = this.getUserFullName(p.userId).toLowerCase().includes(q);
        return titleMatch || contentMatch || authorMatch;
      });
    }

    if (this.currentSort === 'latest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (this.currentSort === 'popular') {
      result.sort((a, b) => b.reactionCount - a.reactionCount);
    } else if (this.currentSort === 'trending') {
      result.sort((a, b) => (b.reactionCount + b.commentCount) - (a.reactionCount + a.commentCount));
    }

    this.filteredPosts = result;
  }

  getUserFullName(userId: number): string {
    const user = this.users.get(userId);
    return user ? `${user.firstName} ${user.lastName}` : `User ${userId}`;
  }

  getUserInitials(userId: number): string {
    const user = this.users.get(userId);
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  toggleLike(post: Post): void {
    const wasLiked = post.isLikedByCurrentUser;
    post.isLikedByCurrentUser = !wasLiked;
    post.reactionCount += wasLiked ? -1 : 1;

    this.forumService.reactToPost(post.id).subscribe({
      error: () => {
        post.isLikedByCurrentUser = wasLiked;
        post.reactionCount += wasLiked ? 1 : -1;
      }
    });
  }

  openCreateModal() {
    const dialogRef = this.dialog.open(PostModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { edit: false }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.forumService.createPost(formData).subscribe({
          next: () => this.loadPosts()
        });
      }
    });
  }
}
