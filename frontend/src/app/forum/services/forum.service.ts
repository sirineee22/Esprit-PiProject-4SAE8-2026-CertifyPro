import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
export interface ForumUser {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  photo?: string | null;
}

// ====================================================
// COMMENT
// ====================================================
export interface ForumComment {
  id: number;
  content: string;
  userId: number;
  date?: string;

  // user data
  user?: ForumUser;
}

// ====================================================
// POST
// ====================================================
export interface ForumPost {
  id: number;

  title: string;
  content: string;

  imageUrl?: string | null;
  createdAt?: string;

  userId: number;

  // user data
  user?: ForumUser;

  // backend stats
  reactionCount: number;
  commentCount: number;
  isLikedByCurrentUser: boolean;

  // comments
  comments: ForumComment[];

  // ====================================================
  // UI STATE
  // ====================================================
  showComments?: boolean;
  showCommentForm?: boolean;
  isEditing?: boolean;
  isLoading?: boolean;

  // translation
  isTranslating?: boolean;
  isTranslated?: boolean;
  translatedTitle?: string;
  translatedContent?: string;

  // forms
  newComment?: string;
  editTitle?: string;
  editContent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly uploadBase = 'http://localhost:8084/uploads';

  private apiUrl = 'http://localhost:8081/api/forum/posts';
 
  constructor(private http: HttpClient) {}

  // =========================
  // 🔥 GET POSTS (NORMALIZED)
  // =========================
  getPosts(): Observable<ForumPost[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(posts => posts.map(p => ({
        ...p,
        reactionCount: p.reactionCount ?? p.reactionsCount ?? 0,
        commentCount: p.commentCount ?? (Array.isArray(p.comments) ? p.comments.length : 0),
        isLikedByCurrentUser: p.isLikedByCurrentUser ?? false,
        comments: Array.isArray(p.comments) ? p.comments : [],
        user: p.user ?? null,
        imageUrl: p.imageUrl ? `${this.uploadBase}/${p.imageUrl}` : null
      })))
    );
  }

  // =========================
  // CREATE POST
  // =========================
  createPost(data: {
    userId: number;
    title: string;
    content: string;
    image?: File;
  }): Observable<ForumPost> {

    const formData = new FormData();
    formData.append('userId', data.userId.toString());
    formData.append('title', data.title);
    formData.append('content', data.content);

    if (data.image) {
      formData.append('image', data.image);
    }
    //location refresh 


    return this.http.post<ForumPost>(this.apiUrl, formData);
  }

  // =========================
  // UPDATE POST
  // =========================
  updatePost(id: number, post: { title: string; content: string }): Observable<ForumPost> {
    return this.http.put<ForumPost>(`${this.apiUrl}/${id}`, post);
  }

  // =========================
  // DELETE POST
  // =========================
  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // =========================
  // LIKE / UNLIKE
  // =========================
  toggleReaction(postId: number, userId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${postId}/react?userId=${userId}`,
      {}
    );
  }

  // =========================
  // COMMENTS
  // =========================
  addComment(postId: number, userId: number, content: string): Observable<ForumComment> {
    return this.http.post<ForumComment>(
      `${this.apiUrl}/${postId}/comments?userId=${userId}&content=${encodeURIComponent(content)}`,
      {}
    );
  }

  updateComment(commentId: number, content: string): Observable<ForumComment> {
    return this.http.put<ForumComment>(
      `${this.apiUrl}/comments/${commentId}`,
      { content }
    );
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/${commentId}`);
  }




  translatePost(
    title: string,
    content: string,
    from: string,
    to: string
  ): Observable<any> {
  
    return this.http.post<any>(
      `${this.apiUrl}/translate`,
      {
        title,
        content,
        from,
        to
      }
    );
  }



  getUploadUrl(filename?: string): string {
    return filename ? `${this.uploadBase}/${filename}` : '';
  }








  private decodeUtf(text: string): string {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  }

  generatePostWithAi(prompt: string): Observable<any> {
    return this.http.post<any>(
      'http://localhost:8081/api/forum/posts/ai-generate',
      { prompt }
    ).pipe(
      map((res) => {
  
        return {
          title: this.decodeUtf(res?.title || ''),
          content: this.decodeUtf(res?.content || '')
        };
  
      })
    );
  }
}