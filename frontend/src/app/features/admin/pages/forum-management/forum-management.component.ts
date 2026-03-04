import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../../../forum/services/forum.service';
import { Post } from '../../../../forum/models/post.model';
import { Comment } from '../../../../forum/models/comment.model';
import { UserService } from '../../../users/services/users.api';
import { User } from '../../../../shared/models/user.model';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-forum-management',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './forum-management.component.html',
    styleUrl: './forum-management.component.css'
})
export class ForumManagementComponent implements OnInit {
    posts: Post[] = [];
    users: Map<number, User> = new Map();
    loading = true;
    errorMessage = '';
    activeTab: 'posts' | 'comments' = 'posts';
    allComments: Comment[] = [];

    constructor(
        private forumService: ForumService,
        private userService: UserService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.errorMessage = '';

        this.userService.getAll().subscribe({
            next: (users: User[]) => {
                users.forEach(user => {
                    if (user.id !== undefined) {
                        this.users.set(user.id, user);
                    }
                });
            },
            error: (err: any) => console.error('Error loading users', err)
        });

        this.forumService.getAllPosts().subscribe({
            next: (posts: Post[]) => {
                this.posts = posts;
                this.postsLoaded = true;
                this.checkLoadingState();
            },
            error: (err: any) => {
                console.error('Error loading posts', err);
                this.postsLoaded = true;
                this.checkLoadingState();
            }
        });

        this.forumService.getAllComments().subscribe({
            next: (comments: Comment[]) => {
                this.allComments = comments;
                this.commentsLoaded = true;
                this.checkLoadingState();
            },
            error: (err: any) => {
                console.error('Error loading comments', err);
                this.commentsLoaded = true;
                this.checkLoadingState();
            }
        });
    }

    private postsLoaded = false;
    private commentsLoaded = false;

    private checkLoadingState(): void {
        if (this.postsLoaded) {
            this.loading = false;
        }
    }

    getUserName(userId: number): string {
        const user = this.users.get(userId);
        return user ? `${user.firstName} ${user.lastName}` : `User ${userId}`;
    }

    deletePost(id: number): void {
        if (confirm('Are you sure you want to delete this post? All associated comments will also be deleted.')) {
            this.forumService.deletePost(id).subscribe({
                next: () => {
                    this.posts = this.posts.filter(p => p.id !== id);
                    this.allComments = this.allComments.filter((c: Comment) => c.postId !== id);
                },
                error: (err: any) => console.error('Error deleting post', err)
            });
        }
    }

    deleteComment(id: number): void {
        if (confirm('Are you sure you want to delete this comment?')) {
            this.forumService.deleteComment(id).subscribe({
                next: () => {
                    this.allComments = this.allComments.filter((c: Comment) => c.id !== id);
                },
                error: (err: any) => console.error('Error deleting comment', err)
            });
        }
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString();
    }
}
