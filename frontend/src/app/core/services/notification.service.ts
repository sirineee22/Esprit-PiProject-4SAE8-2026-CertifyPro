// ================================================================
// notification.service.ts — CORRIGÉ
// ================================================================
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';

import { AppNotification } from '../models/notification.model';
import { AuthService }     from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  private readonly BASE = 'http://localhost:8085/api/notifications';
  private readonly WS   = 'ws://localhost:8085/ws-chat';

  private _notifs$  = new BehaviorSubject<AppNotification[]>([]);
  private _unread$  = new BehaviorSubject<number>(0);

  // ✅ FIX 1 : Subject séparé uniquement pour les NOUVELLES notifs entrantes
  // Le bell.component s'y abonne pour déclencher les toasts
  private _incoming$ = new Subject<AppNotification>();

  readonly notifs$   = this._notifs$.asObservable();
  readonly unread$   = this._unread$.asObservable();
  readonly incoming$ = this._incoming$.asObservable();  // ← NOUVEAU

  private stomp?: Client;
  private _initialized = false;  // ✅ FIX 2 : renommé pour clarté

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // ── Init ──────────────────────────────────────────────
  init(): void {
    if (this._initialized) return;
    this._initialized = true;
    this._load();
    this._connectWS();
    this._askBrowserPermission();
  }

  ngOnDestroy(): void { this.stomp?.deactivate(); }

  // ── REST ──────────────────────────────────────────────
  private _load(): void {
    this.http.get<AppNotification[]>(this.BASE, { headers: this._h() })
      .subscribe({
        next: list => {
          this._notifs$.next(list);
          this._unread$.next(list.filter(n => !n.read).length);
        },
        error: e => console.warn('[NotifService] load:', e)
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
      .subscribe(() => { this._notifs$.next([]); this._unread$.next(0); });
  }

  // ── WebSocket STOMP ───────────────────────────────────
  private _connectWS(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;

    this.stomp = new Client({
      brokerURL:      this.WS,
      reconnectDelay: 5000,
      onConnect: () => {

        // ✅ FIX 3 : Nouvelle notif → émettre sur incoming$ AVANT de mettre à jour notifs$
        // Ainsi le bell.component reçoit l'événement et peut afficher le toast
        this.stomp!.subscribe(`/topic/notifications/${userId}`, (frame: IMessage) => {
          const notif: AppNotification = JSON.parse(frame.body);

          // ✅ Éviter les doublons (si le message arrive deux fois)
          const alreadyExists = this._notifs$.value.some(n => n.id === notif.id);
          if (alreadyExists) return;

          // 1. Signaler la nouvelle notif au bell (pour le toast)
          this._incoming$.next(notif);

          // 2. Mettre à jour la liste
          const updated = [notif, ...this._notifs$.value];
          this._notifs$.next(updated);
          this._unread$.next(updated.filter(n => !n.read).length);

          // 3. Push navigateur si la page n'est pas visible
          this._browserPush(notif);
        });

        // Mise à jour du compteur uniquement (depuis le backend)
        this.stomp!.subscribe(`/topic/notifications/${userId}/count`, (frame: IMessage) => {
          const { count } = JSON.parse(frame.body);
          this._unread$.next(count);
        });
      }
    });

    this.stomp.activate();
  }

  // ── Push navigateur ───────────────────────────────────
  private _askBrowserPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private _browserPush(n: AppNotification): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return;
    new Notification(n.title, { body: n.body, icon: '/assets/images/logo-sm.png' });
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
