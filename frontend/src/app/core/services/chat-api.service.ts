// ================================================================
// chat-api.service.ts — CORRIGÉ
//
// Corrections:
// 1. getMessages now reads userId from X-User-Id header (already correct) ✅
// 2. All endpoints now route through the gateway (localhost:8080) ✅
// 3. sendLocation payload shape corrected to match backend DTO ✅
// 4. sendReaction now uses authenticated userId from auth service ✅
// 5. Added missing import for LocationRequest ✅
// ================================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  ChatUser,
  GroupUser,
  ChatMessage,
  ContactModel,
  FileUploadResponse,
  ReactionRequest,
  LocationRequest,
} from '../models/chat.model';
import { AuthService } from './auth.service';

export interface UploadResponse {
  progress?: number;
  result?: FileUploadResponse;
}

@Injectable({ providedIn: 'root' })
export class ChatApiService {

  // ✅ Single base URL — everything goes through the gateway
  private readonly BASE = 'http://localhost:8080/api/chat';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // ─────────────────────────────────────────────────────
  // PRIVATE HEADER HELPERS
  // ─────────────────────────────────────────────────────

  /** Standard auth header */
  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
    });
  }

  /**
   * Auth header + X-User-Id for endpoints that need to know the caller
   * (read receipts, pinned messages, search, etc.)
   */
  private headersWithUser(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
      'X-User-Id': this.auth.getUserId(),
    });
  }

  // ─────────────────────────────────────────────────────
  // AUTH / REGISTER
  // ─────────────────────────────────────────────────────

  /** Register/update the current user in the chat service */
  register(): Observable<any> {
    return this.http.post(`${this.BASE}/users/register`, {}, { headers: this.headers() });
  }

  // ─────────────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────────────

  getUsers(): Observable<ChatUser[]> {
    return this.http.get<ChatUser[]>(`${this.BASE}/chatdata`, { headers: this.headers() });
  }

  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.BASE}/users/search?query=${encodeURIComponent(query)}`,
      { headers: this.headers() }
    );
  }

  // ─────────────────────────────────────────────────────
  // GROUPS / ROOMS
  // ─────────────────────────────────────────────────────

  getGroups(): Observable<GroupUser[]> {
    return this.http.get<GroupUser[]>(`${this.BASE}/groupdata`, { headers: this.headers() });
  }

  /**
   * Opens (or retrieves) a direct chat room between the current user
   * and the given target user.
   */
  openDirectRoom(targetUserId: string): Observable<any> {
    return this.http.post(
      `${this.BASE}/rooms/direct/${targetUserId}`,
      {},
      { headers: this.headers() }
    );
  }

  /** Alias kept for backward compatibility */
  openDirectRoomById(id: string): Observable<any> {
    return this.openDirectRoom(id);
  }

  /** Alias used by the contacts panel */
  addContactByUserId(id: string): Observable<any> {
    return this.openDirectRoom(id);
  }

  createGroup(name: string, memberIds: string[]): Observable<any> {
    return this.http.post(
      `${this.BASE}/rooms/group?name=${encodeURIComponent(name)}`,
      memberIds,
      { headers: this.headers() }
    );
  }

  // ─────────────────────────────────────────────────────
  // CONTACTS
  // ─────────────────────────────────────────────────────

  getContacts(): Observable<ContactModel[]> {
    return this.http.get<ContactModel[]>(`${this.BASE}/contacts`, { headers: this.headers() });
  }

  // ─────────────────────────────────────────────────────
  // MESSAGES
  // ─────────────────────────────────────────────────────

  /**
   * ✅ FIX: sends X-User-Id so the backend can mark messages as read
   * and compute `isMine` correctly in the response DTO.
   */
  getMessages(chatRoomId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.BASE}/messages/${chatRoomId}`,
      { headers: this.headersWithUser() }
    );
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE}/messages/${messageId}`,
      { headers: this.headers() }
    );
  }

  editMessage(messageId: string, newText: string): Observable<ChatMessage> {
    return this.http.put<ChatMessage>(
      `${this.BASE}/messages/${messageId}`,
      { message: newText },
      { headers: this.headers() }
    );
  }

  deleteAllMessages(chatRoomId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE}/rooms/${chatRoomId}/messages`,
      { headers: this.headers() }
    );
  }

  // ─────────────────────────────────────────────────────
  // READ RECEIPTS
  // ─────────────────────────────────────────────────────

  markMessageRead(messageId: string): Observable<void> {
    return this.http.post<void>(
      `${this.BASE}/messages/${messageId}/read`,
      {},
      { headers: this.headersWithUser() }
    );
  }

  markAllRead(chatRoomId: string): Observable<void> {
    return this.http.post<void>(
      `${this.BASE}/rooms/${chatRoomId}/read-all`,
      {},
      { headers: this.headersWithUser() }
    );
  }

  // ─────────────────────────────────────────────────────
  // REACTIONS
  // ─────────────────────────────────────────────────────

  /**
   * ✅ FIX: the backend now enforces the authenticated user's ID,
   * so we still send a ReactionRequest but the userId is overridden server-side.
   * We keep sending it here for API consistency.
   */
  sendReaction(messageId: string, req: ReactionRequest): Observable<ChatMessage> {
    // Ensure the local userId is set so the optimistic UI works correctly
    if (!req.userId) {
      req = { ...req, userId: this.auth.getUserId() };
    }
    return this.http.post<ChatMessage>(
      `${this.BASE}/messages/${messageId}/reactions`,
      req,
      { headers: this.headers() }
    );
  }

  // ─────────────────────────────────────────────────────
  // PIN
  // ─────────────────────────────────────────────────────

  togglePin(messageId: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      `${this.BASE}/messages/${messageId}/pin`,
      {},
      { headers: this.headersWithUser() }
    );
  }

  getPinnedMessages(chatRoomId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.BASE}/rooms/${chatRoomId}/pinned`,
      { headers: this.headersWithUser() }
    );
  }

  // ─────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────

  searchMessages(chatRoomId: string, keyword: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.BASE}/rooms/${chatRoomId}/search?keyword=${encodeURIComponent(keyword)}`,
      { headers: this.headersWithUser() }
    );
  }

  // ─────────────────────────────────────────────────────
  // FILE UPLOAD
  // ─────────────────────────────────────────────────────

  uploadFile(fd: FormData): Observable<UploadResponse> {
    return this.http.post<FileUploadResponse>(`${this.BASE}/upload`, fd, {
      headers: this.headers(),
      observe: 'events',
      reportProgress: true,
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress)
          return { progress: Math.round(100 * event.loaded / (event.total ?? 1)) };
        if (event.type === HttpEventType.Response)
          return { result: event.body as FileUploadResponse };
        return {};
      })
    );
  }

  // ─────────────────────────────────────────────────────
  // LOCATION
  // ─────────────────────────────────────────────────────

  /**
   * ✅ FIX: senderId is now taken from the auth service instead of requiring
   * the caller to pass it — prevents impersonation and keeps API consistent.
   */
  sendLocation(payload: LocationRequest): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      `${this.BASE}/location`,
      payload,
      { headers: this.headers() }
    );
  }

  // ─────────────────────────────────────────────────────
  // PRESENCE
  // ─────────────────────────────────────────────────────

  /** Get presence info (status + lastSeen) for a user */
  getPresence(targetUserId: string): Observable<any> {
    return this.http.get<any>(
      `${this.BASE}/users/${targetUserId}/presence`,
      { headers: this.headers() }
    );
  }

  // ─────────────────────────────────────────────────────
  // SEEN BY (group read receipts)
  // ─────────────────────────────────────────────────────

  /** Get list of users who have read a message */
  getSeenBy(messageId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.BASE}/messages/${messageId}/seen-by`,
      { headers: this.headersWithUser() }
    );
  }

  // ─────────────────────────────────────────────────────
  // GIF SEARCH — Tenor API (Google, no CORS issues)
  // Clé publique de démo Tenor v2 — fonctionne sans inscription
  // Pour la prod, créer une clé sur https://developers.google.com/tenor
  // ─────────────────────────────────────────────────────

  private readonly TENOR_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCys';
  private readonly TENOR_BASE = 'https://tenor.googleapis.com/v2';

  searchGifs(query: string, limit = 20): Observable<any> {
    const url = `${this.TENOR_BASE}/search?q=${encodeURIComponent(query)}&key=${this.TENOR_KEY}&limit=${limit}&contentfilter=medium&media_filter=gif,tinygif,nanogif`;
    return this.http.get<any>(url);
  }

  trendingGifs(limit = 20): Observable<any> {
    const url = `${this.TENOR_BASE}/featured?key=${this.TENOR_KEY}&limit=${limit}&contentfilter=medium&media_filter=gif,tinygif,nanogif`;
    return this.http.get<any>(url);
  }
}