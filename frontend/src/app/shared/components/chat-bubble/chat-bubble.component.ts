import {
  Component, OnInit, OnDestroy, NgZone,
  ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ChatApiService }      from '../../../core/services/chat-api.service';
import { ChatWsService }       from '../../../core/services/chat-ws.service';
import { AuthService }         from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ChatUser }            from '../../../core/models/chat.model';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-bubble.component.html',
  styleUrls:   ['./chat-bubble.component.css']
})
export class ChatBubbleComponent implements OnInit, OnDestroy {

  /* ── état widget ── */
  isOnChatPage  = false;
  isOpen        = false;
  isMinimized   = false;
  isLoading     = false;

  /* ── contacts ── */
  contacts: ChatUser[] = [];
  selectedContact: ChatUser | null = null;

  /* ── messages ── */
  messages: any[] = [];
  newMessage = '';
  isSending  = false;

  /* ── notifications non-lues ── */
  unreadCount = 0;

  /* ── user courant ── */
  currentUserId   = '';
  currentUserName = '';

  /* ── subs ── */
  private wsSub?:      Subscription;
  private routerSub?:  Subscription;
  private unreadSub?:  Subscription;

  constructor(
    private router:  Router,
    private api:     ChatApiService,
    private ws:      ChatWsService,
    private auth:    AuthService,
    private notif:   NotificationService,
    private ngZone:  NgZone,
    private cdr:     ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId   = this.auth.getUserId();
    this.currentUserName = this.auth.getUserName();

    /* ── Initialiser le service de notifications (si pas déjà fait) ── */
    this.notif.init();

    /* ── Vrai compteur notifications ── */
    this.unreadSub = this.notif.unread$.subscribe(n => {
      this.ngZone.run(() => {
        this.unreadCount = n;
        this.cdr.markForCheck();
      });
    });

    /* ── Masquer sur /chat ── */
    this._checkRoute(this.router.url);
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this._checkRoute(e.url);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.routerSub?.unsubscribe();
    this.unreadSub?.unsubscribe();
  }

  private _checkRoute(url: string): void {
    const clean = url.split('?')[0].replace(/\/$/, '');
    this.isOnChatPage = clean.startsWith('/chat');
  }

  /* ══ Ouvrir / fermer ══ */
  toggleWidget(): void {
    if (!this.isOpen) {
      this.isOpen      = true;
      this.isMinimized = false;
      this._ensureWsConnected();
      this._loadContacts();
    } else {
      this.isOpen          = false;
      this.selectedContact = null;
      this.messages        = [];
      this.wsSub?.unsubscribe();
    }
    this.cdr.markForCheck();
  }

  minimize(): void {
    this.isMinimized = !this.isMinimized;
    this.cdr.markForCheck();
  }

  /* ══ WebSocket ══ */
  private _ensureWsConnected(): void {
    try { this.ws.connect(); } catch { /* déjà connecté */ }
  }

  /* ══ Charger contacts ══ */
  private _loadContacts(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.api.getUsers().subscribe({
      next: users => this.ngZone.run(() => {
        this.contacts  = users;
        this.isLoading = false;
        this.cdr.markForCheck();
      }),
      error: () => this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    });
  }

  /* ══ Ouvrir conversation ══ */
  openConversation(contact: ChatUser): void {
    this.wsSub?.unsubscribe();
    this.selectedContact = contact;
    this.messages        = [];
    this.isLoading       = true;
    this.cdr.markForCheck();

    if (contact.roomId) {
      this._loadMessages(contact.roomId);
    } else {
      this.api.openDirectRoom(contact.userId).subscribe({
        next: room => this.ngZone.run(() => {
          const idx = this.contacts.findIndex(c => c.userId === contact.userId);
          if (idx !== -1) this.contacts[idx] = { ...this.contacts[idx], roomId: room.id };
          this.selectedContact = { ...contact, roomId: room.id };
          this._loadMessages(room.id);
        }),
        error: () => this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      });
    }
  }

  private _loadMessages(roomId: string): void {
    this.api.getMessages(roomId).subscribe({
      next: msgs => this.ngZone.run(() => {
        this.messages = msgs.map(m => ({
          ...m,
          align: String((m as any).senderId).trim() === String(this.currentUserId).trim()
                 ? 'right' : 'left'
        }));
        this.isLoading = false;
        this.cdr.markForCheck();
        setTimeout(() => this._scrollToBottom(), 60);
      }),
      error: () => this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    });

    /* WebSocket temps réel */
    this.wsSub = this.ws.subscribeToRoom(roomId).subscribe({
      next: msg => this.ngZone.run(() => {
        if (!msg?.senderId) return;
        const enriched = {
          ...msg,
          align: String(msg.senderId).trim() === String(this.currentUserId).trim()
                 ? 'right' : 'left'
        };
        if (!this.messages.some((m: any) => m.id === enriched.id)) {
          this.messages = [...this.messages, enriched];
          this.cdr.markForCheck();
          setTimeout(() => this._scrollToBottom(), 60);
        }
      })
    });
  }

  /* ══ Envoyer ══ */
  sendMessage(): void {
    const text = this.newMessage.trim();
    if (!text || !this.selectedContact?.roomId || this.isSending) return;

    const payload = {
      chatRoomId: this.selectedContact.roomId,
      senderId:   this.currentUserId,
      name:       this.currentUserName,
      profile:    this.auth.getUserImage() || '',
      message:    text,
      type:       'text'
    };

    /* Optimiste */
    this.messages = [...this.messages, {
      ...payload,
      id:    'local-' + Date.now(),
      time:  new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      align: 'right'
    }];
    this.newMessage = '';
    this.cdr.markForCheck();
    setTimeout(() => this._scrollToBottom(), 60);

    this.ws.sendMessage(payload);
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  back(): void {
    this.selectedContact = null;
    this.messages        = [];
    this.wsSub?.unsubscribe();
    this.cdr.markForCheck();
  }

  private _scrollToBottom(): void {
    const el = document.getElementById('mini-chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
