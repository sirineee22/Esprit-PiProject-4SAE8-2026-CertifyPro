import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';

@Injectable({
    providedIn: 'root'
})
export class ForumService {
    private postsUrl = API_ENDPOINTS.forum.posts;
    private commentsUrl = API_ENDPOINTS.forum.comments;

    constructor(private http: HttpClient) { }

    // Posts
    getAllPosts(): Observable<Post[]> {
        return this.http.get<Post[]>(this.postsUrl);
    }

    getPostById(id: number): Observable<Post> {
        return this.http.get<Post>(`${this.postsUrl}/${id}`);
    }

    createPost(formData: FormData): Observable<Post> {
        return this.http.post<Post>(this.postsUrl, formData);
    }

    deletePost(id: number): Observable<void> {
        return this.http.delete<void>(`${this.postsUrl}/${id}`);
    }

    reactToPost(id: number): Observable<any> {
        return this.http.post(`${this.postsUrl}/${id}/react`, {});
    }

    // Comments
    getAllComments(): Observable<Comment[]> {
        return this.http.get<Comment[]>(this.commentsUrl);
    }

    getCommentsByPostId(postId: number): Observable<Comment[]> {
        return this.http.get<Comment[]>(`${this.postsUrl}/${postId}/comments`);
    }

    createComment(postId: number, content: string): Observable<Comment> {
        return this.http.post<Comment>(`${this.postsUrl}/${postId}/comments`, { content });
    }

    deleteComment(commentId: number): Observable<void> {
        return this.http.delete<void>(`${this.commentsUrl}/${commentId}`);
    }

    deleteCommentByPost(postId: number, commentId: number): Observable<void> {
        return this.http.delete<void>(`${this.postsUrl}/${postId}/comments/${commentId}`);
    }
}
