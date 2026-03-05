// ================================================================
// chat-api.service.ts
// ✅ Ajout des méthodes pour les 5 nouvelles fonctionnalités
// ================================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  ChatUser, GroupUser, ChatMessage, ContactModel,
  FileUploadResponse, ReactionRequest, LocationRequest
} from '../models/chat.model';
import { AuthService } from './auth.service';

export interface UploadResponse {
  progress?: number;
  result?: FileUploadResponse;
}

@Injectable({ providedIn: 'root' })
export class ChatApiService {

  private readonly BASE = 'http://localhost:8085/api/chat';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  // ── Headers avec userId pour statut de lecture ────────────
  private headersWithUser(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
      'X-User-Id':   this.auth.getUserId()
    });
  }

  // ══════════════════════════════════════════════════════
  // MÉTHODES EXISTANTES — inchangées
  // ══════════════════════════════════════════════════════

  register():                           Observable<any>           { return this.http.post(`${this.BASE}/users/register`, {}, { headers: this.headers() }); }
  getUsers():                           Observable<ChatUser[]>    { return this.http.get<ChatUser[]>(`${this.BASE}/chatdata`, { headers: this.headers() }); }
  getGroups():                          Observable<GroupUser[]>   { return this.http.get<GroupUser[]>(`${this.BASE}/groupdata`, { headers: this.headers() }); }
  getContacts():                        Observable<ContactModel[]>{ return this.http.get<ContactModel[]>(`${this.BASE}/contacts`, { headers: this.headers() }); }
  openDirectRoom(targetUserId: string): Observable<any>           { return this.http.post(`${this.BASE}/rooms/direct/${targetUserId}`, {}, { headers: this.headers() }); }
  openDirectRoomById(id: string):       Observable<any>           { return this.http.post(`${this.BASE}/rooms/direct/${id}`, {}, { headers: this.headers() }); }
  addContactByUserId(id: string):       Observable<any>           { return this.http.post(`${this.BASE}/rooms/direct/${id}`, {}, { headers: this.headers() }); }
  createGroup(name: string, memberIds: string[]): Observable<any> { return this.http.post(`${this.BASE}/rooms/group?name=${encodeURIComponent(name)}`, memberIds, { headers: this.headers() }); }
  searchUsers(query: string):           Observable<any[]>         { return this.http.get<any[]>(`${this.BASE}/users/search?query=${encodeURIComponent(query)}`, { headers: this.headers() }); }
  deleteMessage(messageId: string):     Observable<void>          { return this.http.delete<void>(`${this.BASE}/messages/${messageId}`, { headers: this.headers() }); }
  sendLocation(payload: LocationRequest): Observable<ChatMessage> { return this.http.post<ChatMessage>(`${this.BASE}/location`, payload, { headers: this.headers() }); }
  sendReaction(messageId: string, req: ReactionRequest): Observable<ChatMessage> { return this.http.post<ChatMessage>(`${this.BASE}/messages/${messageId}/reactions`, req, { headers: this.headers() }); }

  uploadFile(fd: FormData): Observable<UploadResponse> {
    return this.http.post<FileUploadResponse>(`${this.BASE}/upload`, fd, {
      headers: this.headers(), observe: 'events', reportProgress: true
    }).pipe(map(event => {
      if (event.type === HttpEventType.UploadProgress) return { progress: Math.round(100 * event.loaded / (event.total ?? 1)) };
      if (event.type === HttpEventType.Response)       return { result: event.body as FileUploadResponse };
      return {};
    }));
  }

  // ✅ getMessages avec userId pour statut de lecture
  getMessages(chatRoomId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.BASE}/messages/${chatRoomId}`,
      { headers: this.headersWithUser() }  // ✅ envoie X-User-Id
    );
  }

  // ══════════════════════════════════════════════════════
  // ✅ 1. STATUT DE LECTURE
  // ══════════════════════════════════════════════════════

  markMessageRead(messageId: string): Observable<void> {
    return this.http.post<void>(
      `${this.BASE}/messages/${messageId}/read`, {},
      { headers: this.headersWithUser() }
    );
  }

  markAllRead(chatRoomId: string): Observable<void> {
    return this.http.post<void>(
      `${this.BASE}/rooms/${chatRoomId}/read-all`, {},
      { headers: this.headersWithUser() }
    );
  }

  // ══════════════════════════════════════════════════════
  // ✅ 3. MESSAGES ÉPINGLÉS
  // ══════════════════════════════════════════════════════

  togglePin(messageId: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(
      `${this.BASE}/messages/${messageId}/pin`, {},
      { headers: this.headersWithUser() }
    );
  }

  getPinnedMessages(chatRoomId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.BASE}/rooms/${chatRoomId}/pinned`,
      { headers: this.headersWithUser() }
    );
  }

  // ══════════════════════════════════════════════════════
  // ✅ 5. RECHERCHE DANS LES MESSAGES
  // ══════════════════════════════════════════════════════

  searchMessages(chatRoomId: string, keyword: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.BASE}/rooms/${chatRoomId}/search?keyword=${encodeURIComponent(keyword)}`,
      { headers: this.headersWithUser() }
    );
  }
}
