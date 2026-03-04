import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ForumService } from '../../../../forum/services/forum.service';
import { Post } from '../../../../forum/models/post.model';
import { Comment } from '../../../../forum/models/comment.model';
import { UserService } from '../../../users/services/users.api';
import { User } from '../../../../shared/models/user.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { API_BASE_URL } from '../../../../core/api/api.config';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="detail-container">
      <div class="back-link">
        <a routerLink="/forum"><mat-icon>arrow_back</mat-icon> Back to Forum</a>
      </div>

      <div class="loading-state" *ngIf="loadingPost">
        <div class="spinner"></div>
      </div>

      <mat-card class="post-detail-card" *ngIf="post">
        <mat-card-header>
          <div mat-card-avatar class="author-avatar">{{getUserInitials(post.userId)}}</div>
          <mat-card-title>{{post.title}}</mat-card-title>
          <mat-card-subtitle>
            Posted by <strong>{{getUserFullName(post.userId)}}</strong> on {{post.createdAt | date:'medium'}}
          </mat-card-subtitle>
        </mat-card-header>
        
        <img mat-card-image *ngIf="post.imageUrl" [src]="getImageUrl(post.imageUrl)" alt="Post image" class="post-img">
        
        <mat-card-content>
          <p class="post-content">{{post.content}}</p>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button [color]="post.isLikedByCurrentUser ? 'warn' : ''" (click)="toggleLike()">
            <mat-icon>{{post.isLikedByCurrentUser ? 'favorite' : 'favorite_border'}}</mat-icon>
            {{post.reactionCount}} Likes
          </button>
          <button mat-button color="primary">
            <mat-icon>chat_bubble_outline</mat-icon>
            {{post.commentCount}} Comments
          </button>
        </mat-card-actions>

        <mat-divider></mat-divider>

        <div class="comments-section">
          <h3>Comments</h3>
          
          <div class="add-comment">
            <mat-form-field appearance="outline" class="comment-field">
              <mat-label>Add a comment...</mat-label>
              <textarea matInput [(ngModel)]="newComment" rows="3"></textarea>
              <div class="emoji-tray">
                <button type="button" mat-icon-button (click)="addEmoji('😊')">😊</button>
                <button type="button" mat-icon-button (click)="addEmoji('😂')">😂</button>
                <button type="button" mat-icon-button (click)="addEmoji('🔥')">🔥</button>
                <button type="button" mat-icon-button (click)="addEmoji('👍')">👍</button>
                <button type="button" mat-icon-button (click)="addEmoji('❤️')">❤️</button>
              </div>
            </mat-form-field>
            <button mat-raised-button color="primary" [disabled]="!newComment.trim()" (click)="submitComment()">
              Submit Comment
            </button>
          </div>

          <div class="comments-list">
            <div class="comment-item" *ngFor="let comment of comments">
              <div class="comment-avatar">{{getUserInitials(comment.userId)}}</div>
              <div class="comment-body">
                <div class="comment-header">
                  <span class="user-name">{{getUserFullName(comment.userId)}}</span>
                  <span class="date">{{comment.commentDate | date:'short'}}</span>
                </div>
                <p class="content">{{comment.content}}</p>
              </div>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .detail-container { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    .back-link { margin-bottom: 1.5rem; }
    .back-link a { text-decoration: none; color: #64748b; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
    
    .post-detail-card { border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05) !important; overflow: hidden; }
    .author-avatar { background: #e2e8f0; color: #1e293b; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .post-img { max-height: 500px; object-fit: cover; width: 100%; }
    .post-content { font-size: 1.2rem; line-height: 1.7; color: #334155; padding: 1rem 0; }
    
    .comments-section { padding: 2rem; }
    .comments-section h3 { font-size: 1.5rem; font-weight: 800; margin-bottom: 2rem; color: #0b1f3b; }
    
    .add-comment { margin-bottom: 3rem; display: flex; flex-direction: column; align-items: flex-end; gap: 1rem; }
    .comment-field { width: 100%; }
    .emoji-tray { display: flex; gap: 0.25rem; margin-top: 0.5rem; }
    
    .comments-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .comment-item { display: flex; gap: 1rem; }
    .comment-avatar { 
      width: 40px; height: 40px; border-radius: 50%; background: #f1f5f9; 
      display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
    }
    .comment-body { flex: 1; background: #f8fafc; padding: 1rem; border-radius: 12px; }
    .comment-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; }
    .user-name { font-weight: 700; color: #1e293b; }
    .date { color: #94a3b8; }
    .content { margin: 0; color: #475569; }

    .loading-state { display: flex; justify-content: center; padding: 5rem; }
    .spinner { width: 3rem; height: 3rem; border: 4px solid #f1f5f9; border-top: 4px solid #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  comments: Comment[] = [];
  users: Map<number, User> = new Map();
  loadingPost = true;
  newComment = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPost(+id);
      this.loadComments(+id);
    }
  }

  loadPost(id: number): void {
    this.forumService.getPostById(id).subscribe({
      next: (data) => {
        this.post = data;
        this.loadingPost = false;
        this.ensureUserLoaded(data.userId);
      },
      error: () => this.router.navigate(['/forum'])
    });
  }

  loadComments(postId: number): void {
    this.forumService.getCommentsByPostId(postId).subscribe({
      next: (data) => {
        this.comments = data;
        data.forEach(c => this.ensureUserLoaded(c.userId));
      }
    });
  }

  ensureUserLoaded(userId: number): void {
    if (!this.users.has(userId)) {
      this.userService.getById(userId).subscribe({
        next: (user) => this.users.set(userId, user)
      });
    }
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

  getImageUrl(imagePath: string): string {
    return `${API_BASE_URL}/uploads/posts/${imagePath}`;
  }

  toggleLike(): void {
    if (!this.post) return;

    const wasLiked = this.post.isLikedByCurrentUser;
    this.post.isLikedByCurrentUser = !wasLiked;
    this.post.reactionCount += wasLiked ? -1 : 1;

    this.forumService.reactToPost(this.post.id).subscribe({
      error: () => {
        // Rollback on error
        this.post!.isLikedByCurrentUser = wasLiked;
        this.post!.reactionCount += wasLiked ? 1 : -1;
      }
    });
  }

  addEmoji(emoji: string) {
    this.newComment += emoji;
  }

  submitComment(): void {
    if (!this.post || !this.newComment.trim()) return;

    this.forumService.createComment(this.post.id, this.newComment).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.post!.commentCount++;
        this.newComment = '';
        this.ensureUserLoaded(comment.userId);
      }
    });
  }
}
