import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';
import { API_BASE_URL } from '../../core/api/api.config';

@Injectable({
  providedIn: 'root'
})
export class ForumService {

  private POST_API = API_BASE_URL + '/api/forum/posts';
  private COMMENT_API = API_BASE_URL + '/api/forum/comments';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: 'Bearer ' + token
    });
  }

  // ========================
  // POSTS
  // ========================

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.POST_API, { headers: this.authHeaders() });
  }

  getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.POST_API}/${id}`, { headers: this.authHeaders() });
  }

  createPost(formData: FormData): Observable<Post> {
    return this.http.post<Post>(this.POST_API, formData, { headers: this.authHeaders() });
  }

  reactToPost(postId: number): Observable<any> {
    return this.http.post(`${this.POST_API}/${postId}/react`, {}, { headers: this.authHeaders() });
  }

  deletePost(postId: number): Observable<any> {
    return this.http.delete(`${this.POST_API}/${postId}`, { headers: this.authHeaders() });
  }

  // ========================
  // COMMENTS
  // ========================

  getCommentsByPostId(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.POST_API}/${postId}/comments`, { headers: this.authHeaders() });
  }

  createComment(postId: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.POST_API}/${postId}/comments`,
      { content },
      { headers: this.authHeaders() }
    );
  }

  // 🔹 ADMIN METHODS

  getAllComments(): Observable<Comment[]> {
    return this.http.get<Comment[]>(this.COMMENT_API, { headers: this.authHeaders() });
  }

  deleteComment(id: number): Observable<any> {
    return this.http.delete(`${this.COMMENT_API}/${id}`, { headers: this.authHeaders() });
  }
}