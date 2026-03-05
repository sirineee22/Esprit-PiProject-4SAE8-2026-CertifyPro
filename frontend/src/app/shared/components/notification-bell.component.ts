// ================================================================
// notification-bell.component.ts
// UI moderne — glassmorphism, toasts animés, filtres par type,
// timestamps relatifs, avatar initiales, design premium
// Ajouter dans votre Navbar : <app-notification-bell>
// Ajouter dans imports[] du composant parent
// ================================================================
import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef, NgZone,
  HostListener, Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router }       from '@angular/router';
import { Subscription } from 'rxjs';

import { NotificationService } from '../../core/services/notification.service';
import { AppNotification }     from '../../core/models/notification.model';

// ── Mini-toast interne ────────────────────────────────────────
interface Toast {
  id:    string;
  notif: AppNotification;
  alive: boolean;
}

@Component({
  selector:    'app-notification-bell',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  styles: [`
    /* ════════════════════════════════════════════════
       TOKENS
    ════════════════════════════════════════════════ */
    :host {
      --clr-accent:   #0ab39c;
      --clr-accent2:  #05836e;
      --clr-danger:   #f06548;
      --clr-warn:     #f7b731;
      --clr-surface:  rgba(255,255,255,0.97);
      --clr-border:   rgba(0,0,0,0.07);
      --shadow-panel: 0 32px 80px rgba(0,0,0,.15), 0 8px 24px rgba(0,0,0,.07);
      --radius-panel: 22px;
      display: inline-block;
      position: relative;
      font-family: 'Nunito', -apple-system, sans-serif;
    }

    /* ════════════════════════════════════════════════
       BOUTON CLOCHE
    ════════════════════════════════════════════════ */
    .nb-trigger {
      position: relative;
      width: 42px; height: 42px;
      border: none; border-radius: 13px;
      background: transparent;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #6c757d;
      transition: background .18s, color .18s, transform .15s;
    }
    .nb-trigger:hover  { background: rgba(10,179,156,.1); color: var(--clr-accent); transform: scale(1.08); }
    .nb-trigger.active { background: rgba(10,179,156,.14); color: var(--clr-accent); }
    .nb-trigger i      { font-size: 22px; transition: transform .35s cubic-bezier(.34,1.56,.64,1); }
    .nb-trigger:hover i, .nb-trigger.active i { transform: rotate(-18deg) scale(1.1); }

    /* ── Badge compteur ── */
    .nb-badge {
      position: absolute; top: 1px; right: 1px;
      min-width: 19px; height: 19px; padding: 0 5px;
      background: linear-gradient(135deg, var(--clr-danger), #ff8c69);
      color: #fff; font-size: 10px; font-weight: 800; line-height: 19px;
      border-radius: 99px; text-align: center;
      box-shadow: 0 2px 10px rgba(240,101,72,.5);
      animation: badge-pop .35s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes badge-pop { from { transform:scale(0) rotate(-20deg); } to { transform:scale(1) rotate(0); } }

    /* ── Point pulsant quand panel fermé + non lues ── */
    .nb-pulse {
      position: absolute; top: 4px; right: 4px;
      width: 8px; height: 8px;
      border-radius: 50%; background: var(--clr-accent);
      box-shadow: 0 0 0 0 rgba(10,179,156,.5);
      animation: pulse-ring 2s ease-out infinite;
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(10,179,156,.5); }
      70%  { box-shadow: 0 0 0 8px rgba(10,179,156,.0); }
      100% { box-shadow: 0 0 0 0 rgba(10,179,156,.0); }
    }

    /* ════════════════════════════════════════════════
       PANNEAU PRINCIPAL
    ════════════════════════════════════════════════ */
    .nb-panel {
      position: absolute; top: calc(100% + 12px); right: 0;
      width: 370px; max-height: 580px;
      background: var(--clr-surface);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius-panel);
      box-shadow: var(--shadow-panel);
      overflow: hidden; z-index: 9999;
      display: flex; flex-direction: column;
      animation: panel-in .25s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes panel-in {
      from { opacity:0; transform: translateY(-16px) scale(.96); }
      to   { opacity:1; transform: translateY(0)     scale(1);   }
    }

    /* ── Bande décorative top ── */
    .nb-panel::before {
      content:''; display:block; height:3px;
      background: linear-gradient(90deg, var(--clr-accent), #38d9a9, var(--clr-warn));
    }

    /* ════════════════════════════════════════════════
       HEADER
    ════════════════════════════════════════════════ */
    .nb-header {
      padding: 14px 18px 10px;
      display: flex; align-items: center; gap: 10px;
    }
    .nb-header-title {
      flex: 1; font-size: 15px; font-weight: 800; color: #1a1f36;
      display: flex; align-items: center; gap: 8px;
    }
    .nb-chip {
      font-size: 10px; font-weight: 800; padding: 2px 8px;
      background: linear-gradient(135deg, var(--clr-accent), #38d9a9);
      color: #fff; border-radius: 99px;
      box-shadow: 0 2px 8px rgba(10,179,156,.35);
    }
    .nb-hbtn {
      border: none; border-radius: 8px; padding: 4px 10px;
      font-size: 11px; font-weight: 700; cursor: pointer;
      transition: background .15s, color .15s; background: transparent;
    }
    .nb-hbtn.read  { color: var(--clr-accent); }
    .nb-hbtn.read:hover  { background: rgba(10,179,156,.1); }
    .nb-hbtn.clear { color: var(--clr-danger); }
    .nb-hbtn.clear:hover { background: rgba(240,101,72,.1); }

    /* ════════════════════════════════════════════════
       FILTRE TABS
    ════════════════════════════════════════════════ */
    .nb-tabs {
      display: flex; gap: 4px; padding: 0 16px 10px;
      overflow-x: auto; flex-shrink: 0;
    }
    .nb-tabs::-webkit-scrollbar { display: none; }
    .nb-tab {
      border: none; border-radius: 99px; padding: 4px 12px;
      font-size: 11px; font-weight: 700; cursor: pointer;
      white-space: nowrap; color: #9e9e9e; background: #f4f5f7;
      transition: all .15s;
    }
    .nb-tab.on  { background: #e6faf6; color: var(--clr-accent); }
    .nb-tab:hover:not(.on) { background: #eee; color: #555; }

    /* ════════════════════════════════════════════════
       LISTE
    ════════════════════════════════════════════════ */
    .nb-list { overflow-y: auto; flex: 1; }
    .nb-list::-webkit-scrollbar { width: 3px; }
    .nb-list::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }

    /* ── Item ── */
    .nb-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 18px; cursor: pointer;
      transition: background .13s; position: relative;
      border-bottom: 1px solid rgba(0,0,0,.03);
      animation: item-in .2s ease;
    }
    @keyframes item-in {
      from { opacity:0; transform: translateX(12px); }
      to   { opacity:1; transform: translateX(0); }
    }
    .nb-item:hover { background: rgba(10,179,156,.04); }
    .nb-item.unread { background: linear-gradient(90deg,rgba(10,179,156,.06) 0%,transparent 55%); }

    /* Trait de non-lu */
    .nb-item.unread::after {
      content:''; position: absolute;
      left: 0; top: 16px; bottom: 16px; width: 3px;
      background: var(--clr-accent); border-radius: 0 3px 3px 0;
    }

    /* ── Avatar ── */
    .nb-avatar {
      flex-shrink: 0; width: 44px; height: 44px;
      border-radius: 14px; overflow: hidden; position: relative;
      display: flex; align-items: center; justify-content: center;
      font-size: 19px;
    }
    .nb-avatar img { width:100%; height:100%; object-fit:cover; }

    /* Couleurs par type */
    .av-message  { background: linear-gradient(135deg,#e0f7f0,#b2ebde); }
    .av-reaction { background: linear-gradient(135deg,#fff8e1,#ffe082); }
    .av-file     { background: linear-gradient(135deg,#e3f2fd,#90caf9); }
    .av-location { background: linear-gradient(135deg,#fce4ec,#f48fb1); }
    .av-mention  { background: linear-gradient(135deg,#ede7f6,#b39ddb); }
    .av-system   { background: linear-gradient(135deg,#f5f5f5,#e0e0e0); }

    /* Mini-badge sur l'avatar */
    .nb-av-type {
      position: absolute; bottom: -2px; right: -2px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 9px; box-shadow: 0 1px 5px rgba(0,0,0,.18);
    }

    /* ── Contenu texte ── */
    .nb-content { flex: 1; min-width: 0; }
    .nb-title {
      font-size: 13px; font-weight: 700; color: #1a1f36;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 2px;
    }
    .nb-body {
      font-size: 11.5px; color: #6c757d; line-height: 1.45;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .nb-time { font-size: 10px; color: #b0bec5; margin-top: 5px; font-weight: 600; }

    /* ── Bouton close ── */
    .nb-close {
      flex-shrink: 0; width: 22px; height: 22px;
      border: none; background: transparent; border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      color: #ccc; cursor: pointer; font-size: 15px;
      opacity: 0; transition: opacity .13s, background .13s, color .13s;
    }
    .nb-item:hover .nb-close { opacity: 1; }
    .nb-close:hover { background: rgba(240,101,72,.12); color: var(--clr-danger); }

    /* ════════════════════════════════════════════════
       VIDE
    ════════════════════════════════════════════════ */
    .nb-empty {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 52px 24px; color: #cfd8dc;
    }
    .nb-empty-icon {
      font-size: 52px; margin-bottom: 12px; opacity: .35;
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%,100% { transform: translateY(0);    }
      50%      { transform: translateY(-6px); }
    }
    .nb-empty p { font-size: 13px; margin: 0; font-weight: 600; color: #b0bec5; }

    /* ════════════════════════════════════════════════
       FOOTER
    ════════════════════════════════════════════════ */
    .nb-footer {
      padding: 10px 18px;
      border-top: 1px solid var(--clr-border);
      display: flex; align-items: center; justify-content: center;
    }
    .nb-footer a {
      font-size: 12px; font-weight: 700; color: var(--clr-accent);
      text-decoration: none; transition: color .13s;
    }
    .nb-footer a:hover { color: var(--clr-accent2); }

    /* ════════════════════════════════════════════════
       TOASTS (notification en haut à droite)
    ════════════════════════════════════════════════ */
    .nb-toasts {
      position: fixed; top: 70px; right: 20px;
      display: flex; flex-direction: column; gap: 10px;
      z-index: 99999; pointer-events: none;
    }
    .nb-toast {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px;
      background: rgba(255,255,255,.97);
      backdrop-filter: blur(20px);
      border: 1px solid var(--clr-border);
      border-left: 3px solid var(--clr-accent);
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.06);
      min-width: 300px; max-width: 360px;
      pointer-events: all; cursor: pointer;
      animation: toast-in .35s cubic-bezier(.34,1.56,.64,1);
      transition: opacity .4s, transform .4s;
    }
    .nb-toast.dying { opacity: 0; transform: translateX(40px); }
    @keyframes toast-in {
      from { opacity:0; transform: translateX(60px) scale(.92); }
      to   { opacity:1; transform: translateX(0)    scale(1);   }
    }
    .nb-toast-icon { font-size: 26px; flex-shrink: 0; }
    .nb-toast-body { flex: 1; min-width: 0; }
    .nb-toast-title {
      font-size: 13px; font-weight: 700; color: #1a1f36; margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .nb-toast-text { font-size: 11.5px; color: #6c757d; }
    .nb-toast-close {
      flex-shrink: 0; border: none; background: transparent;
      color: #ccc; cursor: pointer; font-size: 16px;
      border-radius: 6px; padding: 2px 4px;
      transition: color .13s, background .13s;
    }
    .nb-toast-close:hover { color: var(--clr-danger); background: rgba(240,101,72,.1); }
    .nb-toast-bar {
      height: 2px; background: var(--clr-accent);
      border-radius: 2px; margin-top: 8px;
      animation: toast-bar 4s linear forwards;
    }
    @keyframes toast-bar { from { width:100%; } to { width:0%; } }
  `],
  template: `
    <!-- ══════════ TOASTS (hors panel) ══════════ -->
    <div class="nb-toasts">
      @for(t of toasts; track t.id){
        @if(t.alive){
          <div class="nb-toast" [class.dying]="!t.alive" (click)="onToastClick(t)">
            <div class="nb-toast-icon">{{ iconFor(t.notif.type) }}</div>
            <div class="nb-toast-body">
              <div class="nb-toast-title">{{ t.notif.title }}</div>
              <div class="nb-toast-text">{{ t.notif.body }}</div>
              <div class="nb-toast-bar"></div>
            </div>
            <button class="nb-toast-close" (click)="killToast(t, $event)">
              <i class="ri-close-line"></i>
            </button>
          </div>
        }
      }
    </div>

    <!-- ══════════ CLOCHE ══════════ -->
    <button class="nb-trigger" [class.active]="open"
            (click)="toggle($event)">
      <i class="bx bx-bell"></i>
      @if(unread > 0 && !open){
        <span class="nb-badge">{{ unread > 99 ? '99+' : unread }}</span>
      }
    </button>

    <!-- ══════════ PANEL ══════════ -->
    @if(open){
      <div class="nb-panel" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="nb-header">
          <div class="nb-header-title">
            Notifications
            @if(unread > 0){ <span class="nb-chip">{{ unread }}</span> }
          </div>
          @if(unread > 0){
            <button class="nb-hbtn read" (click)="markAll()">
              <i class="ri-check-double-line me-1"></i>Tout lire
            </button>
          }
          @if(notifs.length > 0){
            <button class="nb-hbtn clear" (click)="clearAll()">
              <i class="ri-delete-bin-line"></i>
            </button>
          }
        </div>

        <!-- Tabs filtres -->
        <div class="nb-tabs">
          @for(t of tabs; track t.key){
            <button class="nb-tab" [class.on]="filter === t.key"
                    (click)="filter = t.key; cdr.markForCheck()">
              {{ t.icon }} {{ t.label }}
              @if(t.key !== 'all' && unreadOf(t.key) > 0){
                <span style="margin-left:3px;opacity:.65;">({{ unreadOf(t.key) }})</span>
              }
            </button>
          }
        </div>

        <!-- Liste -->
        <div class="nb-list">
          @if(filtered.length === 0){
            <div class="nb-empty">
              <div class="nb-empty-icon">🔕</div>
              <p>Aucune notification</p>
            </div>
          }
          @for(n of filtered; track n.id){
            <div class="nb-item" [class.unread]="!n.read" (click)="onClick(n)">

              <!-- Avatar -->
              <div class="nb-avatar" [ngClass]="'av-' + n.type">
                @if(n.senderAvatar?.startsWith('http')){
                  <img [src]="n.senderAvatar" [alt]="n.senderName">
                }@else if(n.senderName){
                  <span style="font-size:17px;font-weight:800;color:#555;">
                    {{ n.senderName.charAt(0).toUpperCase() }}
                  </span>
                }@else{
                  <span>{{ iconFor(n.type) }}</span>
                }
                <span class="nb-av-type">{{ badgeFor(n.type) }}</span>
              </div>

              <!-- Texte -->
              <div class="nb-content">
                <div class="nb-title">{{ n.title }}</div>
                <div class="nb-body">{{ n.body }}</div>
                <div class="nb-time">{{ ago(n.createdAt) }}</div>
              </div>

              <!-- Fermer -->
              <button class="nb-close" (click)="del(n.id, $event)">
                <i class="ri-close-line"></i>
              </button>
            </div>
          }
        </div>

        <!-- Footer -->
        @if(notifs.length > 0){
          <div class="nb-footer">
            <a href="javascript:void(0);" (click)="open = false; cdr.markForCheck()">
              Fermer · {{ notifs.length }} notification{{ notifs.length > 1 ? 's' : '' }}
            </a>
          </div>
        }

      </div>
    }
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {

  open   = false;
  filter = 'all';
  notifs: AppNotification[] = [];
  unread = 0;
  toasts: Toast[] = [];

  tabs = [
    { key: 'all',      icon: '🔔', label: 'Tout'      },
    { key: 'message',  icon: '💬', label: 'Messages'  },
    { key: 'reaction', icon: '😀', label: 'Réactions' },
    { key: 'file',     icon: '📎', label: 'Fichiers'  },
    { key: 'location', icon: '📍', label: 'Position'  },
  ];

  private subs: Subscription[] = [];
  private prevCount = 0;

  constructor(
    public  cdr:      ChangeDetectorRef,
    private ngZone:   NgZone,
    private router:   Router,
    private svc:      NotificationService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.svc.notifs$.subscribe(list => this.ngZone.run(() => {
        const isNew = list.length > this.notifs.length && this.notifs.length > 0;
        if (isNew) {
          // Afficher un toast pour chaque nouvelle notif
          const newOnes = list.slice(0, list.length - this.notifs.length);
          newOnes.forEach(n => this._toast(n));
        }
        this.notifs = list;
        this.cdr.markForCheck();
      })),
      this.svc.unread$.subscribe(c => this.ngZone.run(() => {
        this.unread = c;
        this.cdr.markForCheck();
      }))
    );
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  // ── Click extérieur ───────────────────────────────
  @HostListener('document:click')
  outside(): void {
    if (this.open) { this.open = false; this.cdr.markForCheck(); }
  }

  toggle(e: Event): void {
    e.stopPropagation();
    this.open = !this.open;
    this.cdr.markForCheck();
  }

  // ── Filtrage ──────────────────────────────────────
  get filtered(): AppNotification[] {
    return this.filter === 'all'
      ? this.notifs
      : this.notifs.filter(n => n.type === this.filter);
  }

  unreadOf(type: string): number {
    return this.notifs.filter(n => n.type === type && !n.read).length;
  }

  // ── Actions ───────────────────────────────────────
  onClick(n: AppNotification): void {
    if (!n.read) this.svc.markRead(n.id);
    if (n.routerLink) this.router.navigate([n.routerLink]);
    this.open = false;
    this.cdr.markForCheck();
  }

  markAll(): void { this.svc.markAllRead(); }
  clearAll(): void { this.svc.deleteAll(); }
  del(id: string, e: Event): void { e.stopPropagation(); this.svc.deleteOne(id); }

  // ── Toasts ────────────────────────────────────────
  private _toast(n: AppNotification): void {
    const id = 'toast_' + Date.now() + Math.random();
    const t: Toast = { id, notif: n, alive: true };
    this.toasts = [t, ...this.toasts].slice(0, 4);
    this.cdr.markForCheck();
    // Auto-dismiss après 4.5s
    setTimeout(() => {
      t.alive = false;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.toasts = this.toasts.filter(x => x.id !== id);
        this.cdr.markForCheck();
      }, 450);
    }, 4500);
  }

  onToastClick(t: Toast): void {
    this.onClick(t.notif);
    this.killToast(t, new Event('click'));
  }

  killToast(t: Toast, e: Event): void {
    e.stopPropagation();
    t.alive = false;
    this.cdr.markForCheck();
    setTimeout(() => { this.toasts = this.toasts.filter(x => x.id !== t.id); this.cdr.markForCheck(); }, 450);
  }

  // ── Helpers visuels ───────────────────────────────
  iconFor(type: string): string {
    return ({ message:'💬', reaction:'😀', file:'📎', location:'📍', mention:'@️', system:'⚙️' } as any)[type] ?? '🔔';
  }
  badgeFor(type: string): string {
    return ({ message:'💬', reaction:'🔥', file:'📁', location:'📍', mention:'@', system:'⚙' } as any)[type] ?? '🔔';
  }

  ago(d: string): string {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60)     return 'À l\'instant';
    if (s < 3600)   return `Il y a ${Math.floor(s/60)} min`;
    if (s < 86400)  return `Il y a ${Math.floor(s/3600)}h`;
    if (s < 604800) return `Il y a ${Math.floor(s/86400)}j`;
    return new Date(d).toLocaleDateString('fr', { day:'numeric', month:'short' });
  }
}
