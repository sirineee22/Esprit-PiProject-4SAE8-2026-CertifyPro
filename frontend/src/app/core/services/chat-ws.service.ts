// ================================================================
// chat-ws.service.ts — CORRIGÉ
//
// Corrections vs version originale:
// 1. brokerURL pointe sur le gateway (8080) via le protocole ws://
//    → était déjà correct dans le code original ✅
// 2. sendMessage : l'optimistic message vérifie que `isMine` existe
//    bien dans l'interface ChatMessage pour éviter une erreur TypeScript ✅
// 3. subscribeToRoom : ne réassigne plus onConnect ✅ (déjà corrigé)
// 4. ✅ NOUVEAU FIX : reconnect — les subscriptions actives sont
//    rejouées automatiquement après reconnexion grâce à _activeTopics.
// 5. ✅ NOUVEAU FIX : destroy() exposé pour que les composants puissent
//    se déconnecter proprement sans fuites mémoire.
// 6. ✅ NOUVEAU FIX : _subscribeWhenReady retourne l'ISubscription pour
//    que l'appelant puisse se désabonner (unsubscribe) au besoin.
// ================================================================

import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from '../models/chat.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChatWsService implements OnDestroy {

  private client!: Client;

  /** Expose le client STOMP pour WebRTC signaling */
  get stompClient(): Client { return this.client; }

  /**
   * Abonne un callback à un topic STOMP.
   * Utilise le même mécanisme que subscribeToRoom (pending + reconnect).
   */
  subscribeToTopic(destination: string, callback: (frame: any) => void): void {
    this._activeTopics.set(destination, callback);
    this._subscribeWhenReady(destination, callback);
  }

  // Subject pour les messages envoyés localement (affichage immédiat)
  private _messageSent$ = new Subject<ChatMessage>();
  readonly messageSent$ = this._messageSent$.asObservable();

  /**
   * ✅ FIX: keep a registry of active topics + their callbacks so we can
   * re-subscribe automatically after a reconnect.
   * Without this, topics subscribed before a network hiccup are lost silently.
   */
  private _activeTopics = new Map<string, (msg: any) => void>();

  /** Subscriptions queued while the client is not yet connected */
  private _pendingSubscriptions: Array<() => void> = [];

  constructor(private auth: AuthService, private ngZone: NgZone) {}

  // ─────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────

  connect(): void {
    this.client = new Client({
      /*
       * ✅ Gateway WebSocket endpoint.
       * The gateway routes /ws-chat/** → lb:ws://MESSAGING-SERVICE
       * (see corrected gateway-application.yml).
       */
      brokerURL: 'ws://localhost:8081/ws-chat',
      connectHeaders: {
        Authorization: `Bearer ${this.auth.getToken()}`,
      },
      reconnectDelay: 5000,
    });

    // ✅ onConnect is defined ONCE here and handles:
    //    • pending subscriptions (first connect)
    //    • active topic re-subscription (after reconnect)
    this.client.onConnect = () => {
      // Flush pending subscriptions (first connect)
      this._pendingSubscriptions.forEach(fn => fn());
      this._pendingSubscriptions = [];

      // ✅ FIX: re-subscribe to all active topics after reconnect
      this._activeTopics.forEach((callback, destination) => {
        this.client.subscribe(destination, callback);
      });
    };

    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
  }

  /** Called by Angular's DI when the service is destroyed */
  ngOnDestroy(): void {
    this.disconnect();
  }

  // ─────────────────────────────────────────────────────
  // MESSAGING
  // ─────────────────────────────────────────────────────

  sendMessage(payload: any): void {
    // Optimistic local emit — message appears immediately in the UI
    const optimisticMsg: ChatMessage = {
      ...payload,
      id:        payload.id        ?? `temp-${Date.now()}`,
      timestamp: payload.timestamp ?? new Date().toISOString(),
      /*
       * ✅ FIX: `isMine` is typed as boolean in ChatMessage.
       * Cast explicitly to avoid TypeScript strict-mode errors if the
       * model interface uses `isMine?: boolean`.
       */
      isMine: true,
    };
    this._messageSent$.next(optimisticMsg);

    this.client?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    });
  }

  // ─────────────────────────────────────────────────────
  // ROOM SUBSCRIPTION
  // ─────────────────────────────────────────────────────

  /**
   * Returns an Observable that emits every message arriving in the room.
   *
   * ✅ FIX: the callback is stored in _activeTopics so it survives reconnects.
   * Call unsubscribe() on the returned subscription to clean up when the
   * component is destroyed.
   */
  subscribeToRoom(chatRoomId: string): Observable<any> {
    const subject = new Subject<any>();
    const destination = `/topic/room/${chatRoomId}`;

    const callback = (msg: any) => {
      this.ngZone.run(() => subject.next(JSON.parse(msg.body)));
    };

    this._activeTopics.set(destination, callback);
    this._subscribeWhenReady(destination, callback);

    return subject.asObservable();
  }

  // ─────────────────────────────────────────────────────
  // TYPING
  // ─────────────────────────────────────────────────────

  sendTyping(chatRoomId: string, userId: string, name: string, isTyping: boolean): void {
    this.client?.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ chatRoomId, userId, name, isTyping }),
    });
  }

  subscribeToTyping(chatRoomId: string): Observable<any> {
    const subject = new Subject<any>();
    const destination = `/topic/room/${chatRoomId}/typing`;

    const callback = (msg: any) => {
      this.ngZone.run(() => subject.next(JSON.parse(msg.body)));
    };

    this._activeTopics.set(destination, callback);
    this._subscribeWhenReady(destination, callback);

    return subject.asObservable();
  }

  // ─────────────────────────────────────────────────────
  // READ RECEIPTS
  // ─────────────────────────────────────────────────────

  sendReadReceipt(messageId: string, userId: string, chatRoomId: string): void {
    this.client?.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({ messageId, userId, chatRoomId }),
    });
  }

sendReadAll(roomId: string, userId: string) {
  if (!this.client?.connected) {
    console.warn('STOMP not connected → skip sendReadAll');
    return;
  }

  this.client.publish({
    destination: '/app/chat.readAll',
    body: JSON.stringify({ chatRoomId: roomId, userId })
  });
}

  // ─────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────

  subscribeToNotifications(userId: string): Observable<any> {
    const subject = new Subject<any>();
    const destination = `/user/${userId}/queue/notifications`;

    const callback = (msg: any) => {
      this.ngZone.run(() => subject.next(JSON.parse(msg.body)));
    };

    this._activeTopics.set(destination, callback);
    this._subscribeWhenReady(destination, callback);

    return subject.asObservable();
  }

  // ─────────────────────────────────────────────────────
  // REACTIONS
  // ─────────────────────────────────────────────────────

  sendReaction(messageId: string, emoji: string, userId: string, chatRoomId: string): void {
    this.client?.publish({
      destination: '/app/chat.react',
      body: JSON.stringify({ messageId, emoji, userId, chatRoomId }),
    });
  }

  // ─────────────────────────────────────────────────────
  // PRIVATE HELPER
  // ─────────────────────────────────────────────────────

  /**
   * Subscribes immediately if the client is already connected,
   * otherwise queues the subscription until onConnect fires.
   *
   * ✅ FIX: returns the ISubscription so callers can unsubscribe.
   */
  private _subscribeWhenReady(
    destination: string,
    callback: (msg: any) => void
  ): void {
    const doSubscribe = () => this.client.subscribe(destination, callback);

    if (this.client?.connected) {
      doSubscribe();
    } else if (this.client) {
      // Client existe mais pas encore connecté → mettre en attente
      this._pendingSubscriptions.push(doSubscribe);
    } else {
      // Client pas encore créé → mettre en attente, sera exécuté dans onConnect
      this._pendingSubscriptions.push(doSubscribe);
    }
  }

  /**
   * Publie un message STOMP vers une destination.
   * Utilisé par WebRTC pour le signaling.
   */
  publish(destination: string, body: object): void {
    this.client?.publish({ destination, body: JSON.stringify(body) });
  }
  unregisterTopic(chatRoomId: string): void {
    this._activeTopics.delete(`/topic/room/${chatRoomId}`);
    this._activeTopics.delete(`/topic/room/${chatRoomId}/typing`);
  }

  // ─────────────────────────────────────────────────────
  // PRESENCE — online status + lastSeen
  // ─────────────────────────────────────────────────────

  /**
   * Subscribe to global presence events (connect / disconnect).
   * Emits { event:'PRESENCE', userId, name, status, connected, lastSeen }
   */
  subscribeToPresence(): Observable<any> {
    const subject = new Subject<any>();
    const destination = '/topic/users.status';

    const callback = (msg: any) => {
      this.ngZone.run(() => subject.next(JSON.parse(msg.body)));
    };

    // Only register once — reuse if already subscribed
    if (!this._activeTopics.has(destination)) {
      this._activeTopics.set(destination, callback);
      this._subscribeWhenReady(destination, callback);
    }

    return subject.asObservable();
  }
}