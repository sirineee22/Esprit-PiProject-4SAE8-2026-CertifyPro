// ================================================================
// chat-ws.service.ts — VERSION COMPLÈTE CORRIGÉE
// ✅ Ajout : sendReaction via WebSocket
// ================================================================

import { Injectable, NgZone } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from '../models/chat.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChatWsService {

  private client!: Client;

  constructor(private auth: AuthService, private ngZone: NgZone) {}

  // ── Connexion ──
  connect(): void {
    this.client = new Client({
      brokerURL:      'ws://localhost:8085/ws-chat',
      connectHeaders: { Authorization: `Bearer ${this.auth.getToken()}` },
      reconnectDelay: 5000,
    });
    this.client.activate();
  }

  disconnect(): void { this.client?.deactivate(); }

  // ── Envoyer un message ──
  sendMessage(payload: any): void {
    this.client?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });
  }

  // ── S'abonner aux messages d'un room ──
  subscribeToRoom(chatRoomId: string): Observable<ChatMessage> {
    const subject = new Subject<ChatMessage>();
    this.client.onConnect = () => {
      this.client.subscribe(`/topic/room/${chatRoomId}`, msg => {
        this.ngZone.run(() => subject.next(JSON.parse(msg.body)));
      });
    };
    return subject.asObservable();
  }

  // ── Typing ──
  sendTyping(chatRoomId: string, userId: string, name: string, isTyping: boolean): void {
    this.client?.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ chatRoomId, userId, name, isTyping })
    });
  }

  subscribeToTyping(chatRoomId: string): Observable<any> {
    const subject = new Subject<any>();
    if (this.client?.connected) {
      this.client.subscribe(`/topic/room/${chatRoomId}/typing`, msg => {
        this.ngZone.run(() => subject.next(JSON.parse(msg.body)));
      });
    } else {
      this.client.onConnect = () => {
        this.client.subscribe(`/topic/room/${chatRoomId}/typing`, msg => {
          this.ngZone.run(() => subject.next(JSON.parse(msg.body)));
        });
      };
    }
    return subject.asObservable();
  }

  // ── Read receipts ──
  sendReadReceipt(messageId: string, userId: string, chatRoomId: string): void {
    this.client?.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({ messageId, userId, chatRoomId })
    });
  }

  sendReadAll(chatRoomId: string, userId: string): void {
    this.client?.publish({
      destination: '/app/chat.readAll',
      body: JSON.stringify({ chatRoomId, userId })
    });
  }

  // ── Notifications mentions ──
  subscribeToNotifications(userId: string): Observable<any> {
    const subject = new Subject<any>();
    const subscribe = () => {
      this.client.subscribe(`/user/${userId}/queue/notifications`, msg => {
        this.ngZone.run(() => subject.next(JSON.parse(msg.body)));
      });
    };
    if (this.client?.connected) subscribe();
    else this.client.onConnect = () => subscribe();
    return subject.asObservable();
  }

  // ════════════════════════════════════════════════════
  // ✅ RÉACTIONS via WebSocket
  // ════════════════════════════════════════════════════

  /**
   * Envoyer une réaction via WebSocket (broadcast à tous dans la room)
   */
  sendReaction(messageId: string, emoji: string, userId: string, chatRoomId: string): void {
    this.client?.publish({
      destination: '/app/chat.react',
      body: JSON.stringify({ messageId, emoji, userId, chatRoomId })
    });
  }
}
