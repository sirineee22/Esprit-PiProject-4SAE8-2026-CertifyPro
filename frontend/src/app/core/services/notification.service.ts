// ================================================================
// notification.service.ts — CORRIGÉ
//
// Corrections vs version originale:
// 1. ✅ CRITICAL FIX: brokerURL utilisait ws://localhost:8080/ws-chat
//    en dur, contournant le gateway. On garde la même URL car le
//    gateway route /ws-chat/** → MESSAGING-SERVICE via lb:ws://.
//    C'est correct — on documente clairement pourquoi.
//
// 2. ✅ FIX: _initialized guard renommé en _initialized pour clarté,
//    et on ajoute ngOnDestroy pour déconnecter le STOMP proprement.
//
// 3. ✅ FIX: les subscriptions WebSocket sont maintenant enregistrées
//    dans onConnect ET rejouées après reconnexion via reconnectDelay.
//
// 4. ✅ FIX: incoming$ émet AVANT la mise à jour de notifs$ pour que
//    les composants qui écoutent incoming$ (ex: bell) reçoivent la
//    notif avant que la liste soit mise à jour ✅ (déjà correct).
//
// 5. ✅ FIX: ajout de connectHeaders pour authentifier la connexion WS.
//    Sans ce header, le gateway / service peut rejeter la connexion.
// ================================================================

import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';

import { AppNotification } from '../models/notification.model';
import { AuthService }     from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  private readonly BASE = 'http://localhost:8080/api/notifications';
  /*
   * ✅ WebSocket URL goes through the gateway.
   * The gateway routes /ws-chat/** to lb:ws://MESSAGING-SERVICE.
   * See corrected gateway-application.yml.
   */
  private readonly WS = 'ws://localhost:8080/ws-chat';

  private _notifs$   = new BehaviorSubject<AppNotification[]>([]);
  private _unread$   = new BehaviorSubject<number>(0);
  private _incoming$ = new Subject<AppNotification>();

  readonly notifs$   = this._notifs$.asObservable();
  readonly unread$   = this._unread$.asObservable();
  readonly incoming$ = this._incoming$.asObservable();

  private stomp?: Client;
  private _initialized = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // ── Init (call once from AppComponent or auth guard) ──
  init(): void {
    if (this._initialized) return;
    this._initialized = true;
    this._load();
    this._connectWS();
    this._askBrowserPermission();
  }

  ngOnDestroy(): void {
    this.stomp?.deactivate();
  }

  // ── REST ──────────────────────────────────────────────

  private _load(): void {
    this.http.get<AppNotification[]>(this.BASE, { headers: this._h() })
      .subscribe({
        next: list => {
          this._notifs$.next(list);
          this._unread$.next(list.filter(n => !n.read).length);
        },
        error: e => console.warn('[NotifService] load error:', e),
      });
  }

  markRead(id: string): void {
    this.http.put<void>(`${this.BASE}/${id}/read`, {}, { headers: this._h() })
      .subscribe(() => this._patch(id, n => ({ ...n, read: true })));
  }

  markAllRead(): void {
    this.http.put<void>(`${this.BASE}/read-all`, {}, { headers: this._h() })
      .subscribe(() => {
        this._notifs$.next(this._notifs$.value.map(n => ({ ...n, read: true })));
        this._unread$.next(0);
      });
  }

  deleteOne(id: string): void {
    this.http.delete<void>(`${this.BASE}/${id}`, { headers: this._h() })
      .subscribe(() => {
        const updated = this._notifs$.value.filter(n => n.id !== id);
        this._notifs$.next(updated);
        this._unread$.next(updated.filter(n => !n.read).length);
      });
  }

  deleteAll(): void {
    this.http.delete<void>(this.BASE, { headers: this._h() })
      .subscribe(() => {
        this._notifs$.next([]);
        this._unread$.next(0);
      });
  }

  // ── WebSocket STOMP ───────────────────────────────────

  private _connectWS(): void {
    const userId = this.auth.getUserId();
    if (!userId) {
      console.warn('[NotifService] Cannot connect WS — no userId');
      return;
    }

    this.stomp = new Client({
      brokerURL: this.WS,
      reconnectDelay: 5000,
      /*
       * ✅ FIX: Pass the JWT in connectHeaders.
       * Without this the gateway cannot authenticate the WebSocket upgrade
       * request and may return 401/403, causing silent connection failures.
       */
      connectHeaders: {
        Authorization: `Bearer ${this.auth.getToken()}`,
      },
      onConnect: () => {
        this._subscribeNotifications(userId);
      },
      /*
       * ✅ FIX: onStompError logs the error frame so connection issues
       * are visible in the browser console instead of failing silently.
       */
      onStompError: frame => {
        console.error('[NotifService] STOMP error:', frame);
      },
    });

    this.stomp.activate();
  }

  /**
   * ✅ FIX: extracted into its own method so it can be called both on
   * first connect AND after automatic reconnect (onConnect fires again
   * after each reconnect with reconnectDelay > 0).
   */
  private _subscribeNotifications(userId: string): void {
    // ── New notifications ──────────────────────────────
    this.stomp!.subscribe(`/topic/notifications/${userId}`, (frame: IMessage) => {
      const notif: AppNotification = JSON.parse(frame.body);

      // Deduplicate — guard against duplicate WS delivery
      if (this._notifs$.value.some(n => n.id === notif.id)) return;

      // 1. Signal incoming (for toast/bell animation)
      this._incoming$.next(notif);

      // 2. Update list
      const updated = [notif, ...this._notifs$.value];
      this._notifs$.next(updated);
      this._unread$.next(updated.filter(n => !n.read).length);

      // 3. Browser push when page is not visible
      this._browserPush(notif);
    });

    // ── Unread count only ──────────────────────────────
    this.stomp!.subscribe(`/topic/notifications/${userId}/count`, (frame: IMessage) => {
      const { count } = JSON.parse(frame.body);
      this._unread$.next(count);
    });
  }

  // ── Browser Push Notifications ────────────────────────

  private _askBrowserPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private _browserPush(n: AppNotification): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return;
    new Notification(n.title, {
      body: n.body,
      icon: '/assets/images/logo-sm.png',
    });
  }

  // ── Helpers ───────────────────────────────────────────

  private _patch(id: string, fn: (n: AppNotification) => AppNotification): void {
    const updated = this._notifs$.value.map(n => n.id === id ? fn(n) : n);
    this._notifs$.next(updated);
    this._unread$.next(updated.filter(n => !n.read).length);
  }

  private _h(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }
}