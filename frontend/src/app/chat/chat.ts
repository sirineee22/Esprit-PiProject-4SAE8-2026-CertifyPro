// ================================================================
// chat.component.ts — VERSION COMPLÈTE CORRIGÉE
// ✅ Fix upload image : remplacement correct du message local
// ================================================================

import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, TemplateRef, ElementRef,
  ChangeDetectorRef, ChangeDetectionStrategy,
  NgZone, HostListener
} from '@angular/core';
import { SimplebarAngularModule } from 'simplebar-angular';
import {
  debounceTime, distinctUntilChanged, switchMap, of,
  Subscription, interval, Subject
} from 'rxjs';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import {
  ReactiveFormsModule, FormsModule,
  UntypedFormBuilder, UntypedFormGroup,
  Validators, UntypedFormControl
} from '@angular/forms';
import { NgbModule, NgbOffcanvas, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LightboxModule, Lightbox } from 'ngx-lightbox';

import {
  ChatUser, GroupUser, ChatMessage, ContactModel, MessageRequest,
  MessageType, Reaction, FileUploadResponse, ReactionRequest, LocationRequest
} from '../core/models/chat.model';
import { ChatApiService } from '../core/services/chat-api.service';
import { ChatWsService }  from '../core/services/chat-ws.service';
import { AuthService }    from '../core/services/auth.service';
import { NotificationService }        from '../core/services/notification.service';
import { NotificationBellComponent }  from '../shared/components/notification-bell.component';
import { WebRtcService, CallType }    from '../core/services/webrtc.service';
import { CallComponent }              from '../shared/components/call.component';

interface EmojiCategory { id: string; label: string; icon: string; emojis: string[]; }

const EMOJI_CATEGORIES: EmojiCategory[] = [
  { id: 'recent', label: 'Recent', icon: '🕐', emojis: [] },
  {
    id: 'smileys', label: 'Smileys & People', icon: '😀',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍',
      '🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭',
      '🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪',
      '🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳',
      '🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧',
      '😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡',
      '😠','🤬','😈','👿','💀','☠️','💩','🤡','👻','👽','👾','🤖',
      '👍','👎','👋','✊','👏','🙌','🙏','❤️','🔥','💯',
    ]
  },
  {
    id: 'nature', label: 'Animals & Nature', icon: '🐶',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵',
      '🙈','🙉','🙊','🐒','🦆','🐧','🐦','🐤','🦅','🦉','🦇','🐺','🐗','🐴','🦄',
      '🐝','🦋','🐌','🐞','🐜','🐢','🐍','🦎','🐙','🐡','🐠','🐟','🐬','🐳','🦈',
      '🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🌺','🌻','🌹','🌷','🌼','🌸',
      '💐','🍄','🌈','⭐','🌟','💫','⚡','🔥','💧','🌊',
    ]
  },
  {
    id: 'food', label: 'Food & Drinks', icon: '🍔',
    emojis: [
      '🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍒','🍑','🥭','🍍','🥥','🥝','🍅',
      '🍆','🥑','🥦','🥒','🌶️','🌽','🍕','🍔','🍟','🌭','🥪','🥙','🌮','🌯','🍝',
      '🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍧','🍨','🍦','🧁','🍰','🎂',
      '🍭','🍬','🍫','🍿','🍩','🍪','☕','🍵','🥤','🍺','🍻','🥂','🍷','🥃','🍸',
    ]
  },
  {
    id: 'symbols', label: 'Symbols', icon: '❤️',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗',
      '💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','☯️','🛐','💯','💢','♨️',
      '❗','❕','❓','❔','‼️','⁉️','⚠️','🔱','⚜️','🔰','♻️','✅',
    ]
  },
];

const QUICK_REACTIONS = ['👍','❤️','😂','😮','😢','🔥','👏','🙏'];

@Component({
  selector: 'app-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat.html',
  styleUrls: ['./chat.css'],
  imports: [
    CommonModule, SimplebarAngularModule, TitleCasePipe,
    ReactiveFormsModule, FormsModule, NgbModule, LightboxModule,
    NotificationBellComponent, CallComponent
  ],
  providers: [DatePipe]
})
export class ChatComponent implements OnInit, AfterViewInit, OnDestroy {

  chatData:         ChatUser[]    = [];
  groupData:        GroupUser[]   = [];
  chatMessagesData: ChatMessage[] = [];
  contactData:      ContactModel[]= [];

  formData!: UntypedFormGroup;
  submitted       = false;
  isStatus        = 'online';
  isProfile       = '';
  username        = '';
  // ── Reply state ──────────────────────────────────────
  isreplyMessage  = false;
  replyToMsg: { id: string; name: string; message: string; type?: string } | null = null;
  showEmojiPicker = false;
  isFlag          = false;
  private _emojiJustOpened  = false;

  emojiCategories:    EmojiCategory[] = EMOJI_CATEGORIES;
  activeCategoryId    = 'smileys';
  activeCategoryLabel = 'Smileys & People';
  displayedEmojis:    string[] = [];
  emojiSearch         = '';
  recentEmojis:       string[] = [];

  showAttachMenu        = false;
  private _attachJustOpened = false;

  quickReactions = QUICK_REACTIONS;
  showReactionPickerForMsgId: string | null = null;

  @ViewChild('imageInput')    imageInput!:    ElementRef<HTMLInputElement>;
  @ViewChild('fileInput')     fileInput!:     ElementRef<HTMLInputElement>;
  @ViewChild('documentInput') documentInput!: ElementRef<HTMLInputElement>;
  isUploadingFile = false;
  uploadProgress  = 0;

  isRecording       = false;
  recordingDuration = 0;
  private recordingTimer$?: Subscription;
  private mediaRecorder?:   MediaRecorder;
  private audioChunks:      Blob[] = [];

  isSendingLocation = false;

  currentChatRoomId  = '';
  currentUserId      = '';
  currentUserName    = '';
  currentUserProfile = '';

  images: { src: string; thumb: string; caption: string }[] = [];

  private wsSub?:     Subscription;
  private searchSub?: Subscription;

  @ViewChild('scrollRef')        scrollRef!:        ElementRef<HTMLElement>;
  @ViewChild('addContactModal')  addContactModal!:  TemplateRef<any>;
  @ViewChild('newMessageModal')  newMessageModal!:  TemplateRef<any>;
  @ViewChild('createGroupModal') createGroupModal!: TemplateRef<any>;
  @ViewChild('userInfo')         userInfo!:         TemplateRef<any>;

  addContactForm!:  UntypedFormGroup;
  newMessageForm!:  UntypedFormGroup;
  createGroupForm!: UntypedFormGroup;

  contactSubmitted = false;
  msgSubmitted     = false;
  groupSubmitted   = false;
  selectedMembers: string[] = [];   // stocke les userId (pas les noms)
  isLoadingContact = false;
  isLoadingMsg     = false;
  isLoadingGroup   = false;
  contactError     = '';
  msgError         = '';
  groupError       = '';

  searchControl  = new UntypedFormControl('');
  searchResults: any[] = [];
  selectedUser:  any   = null;
  selectedUserId = '';
  isSearching    = false;

  // ── Read status ──
  private readSub?: Subscription;

  isMessageRead(msg: any): boolean {
    if (!msg?.readBy) return false;
    const readBy: Set<string> = msg.readBy instanceof Set ? msg.readBy : new Set(msg.readBy as string[]);
    return Array.from(readBy).some((id: string) => id !== msg.senderId);
  }

  hasCurrentUserRead(msg: any): boolean {
    if (!msg?.readBy) return false;
    const readBy: Set<string> = msg.readBy instanceof Set ? msg.readBy : new Set(msg.readBy as string[]);
    return readBy.has(this.currentUserId);
  }

  // ── Typing ──
  typingUsers: Map<string, string> = new Map();
  typingText   = '';
  private typingTimeout?: ReturnType<typeof setTimeout>;
  private typingSub?: Subscription;
  private isTyping = false;

  get someoneIsTyping(): boolean { return this.typingUsers.size > 0; }

  // ── Presence avancée ──────────────────────────────────
  /** lastSeen timestamp string for the current open conversation */
  currentUserLastSeen: string | null = null;
  private presenceSub?: Subscription;
  /** Map userId → lastSeen ISO string (for all users we've seen) */
  private presenceMap = new Map<string, { status: string; lastSeen: string | null }>();

  /** Subscribe to global presence events once */
  private subscribeToPresence(): void {
    this.presenceSub?.unsubscribe();
    this.presenceSub = this.chatWs.subscribeToPresence().subscribe(ev => {
      this.ngZone.run(() => {
        if (!ev?.userId) return;
        this.presenceMap.set(ev.userId, { status: ev.status, lastSeen: ev.lastSeen ?? null });

        // Update sidebar status in real-time
        const idx = this.chatData.findIndex(u => u.userId === ev.userId);
        if (idx !== -1) {
          this.chatData[idx] = { ...this.chatData[idx], status: ev.status };
        }

        // Update topbar if this is the open conversation
        const openUser = this.chatData.find(u => u.name === this.username);
        if (openUser?.userId === ev.userId) {
          this.isStatus = ev.status;
          this.currentUserLastSeen = ev.lastSeen ?? null;
        }
        this.cdr.markForCheck();
      });
    });
  }

  /**
   * Returns a human-readable "last seen" string.
   * e.g. "Online", "Seen 5 min ago", "Seen yesterday at 14:30"
   */
  getPresenceLabel(userId?: string): string {
    if (!userId) return '';
    const p = this.presenceMap.get(userId);
    if (!p) return '';
    if (p.status === 'online') return 'Online';
    if (!p.lastSeen) return 'Offline';
    return 'Seen ' + this._timeAgo(p.lastSeen);
  }

  _timeAgo(isoString: string): string {
    const now  = Date.now();
    const then = new Date(isoString).getTime();
    const diff = Math.floor((now - then) / 1000); // seconds

    if (diff < 60)           return 'just now';
    if (diff < 3600)         return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400)        return `today at ${new Date(isoString).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
    if (diff < 172800)       return `yesterday at ${new Date(isoString).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
    return new Date(isoString).toLocaleDateString('en', { day: 'numeric', month: 'short' });
  }

  /** Fetch presence for the currently open user (REST fallback on open) */
  private fetchPresence(userId: string): void {
    this.chatApi.getPresence(userId).subscribe({
      next: p => this.ngZone.run(() => {
        this.presenceMap.set(p.userId, { status: p.status, lastSeen: p.lastSeen ?? null });
        this.currentUserLastSeen = p.lastSeen ?? null;
        if (p.status) this.isStatus = p.status;
        this.cdr.markForCheck();
      })
    });
  }

  // ── Seen By (group read receipts) ─────────────────────
  showSeenByPanel    = false;
  seenByList: any[]  = [];
  seenByMsgId: string | null = null;
  isLoadingSeenBy    = false;
  seenByPanelPos: { top: number; right: number } = { top: 0, right: 0 };

  openSeenByPanel(msg: any, event: Event): void {
    event.stopPropagation();
    if (!msg.id || msg.id.startsWith('local_') || msg.id.startsWith('call_')) return;

    // Toggle off if same message clicked again
    if (this.seenByMsgId === msg.id) {
      this.showSeenByPanel = !this.showSeenByPanel;
      this.cdr.detectChanges();
      return;
    }

    // Calculate fixed position from the click target
    const target = (event.target as HTMLElement).closest('.seen-by-trigger') as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      this.seenByPanelPos = {
        top:   rect.bottom + 8,
        right: window.innerWidth - rect.right,
      };
    }

    this.seenByMsgId     = msg.id;
    this.showSeenByPanel = true;
    this.isLoadingSeenBy = true;
    this.seenByList      = [];
    // detectChanges() force le rendu immédiat (OnPush)
    this.cdr.detectChanges();

    this.chatApi.getSeenBy(msg.id).subscribe({
      next: list => this.ngZone.run(() => {
        this.seenByList      = list;
        this.isLoadingSeenBy = false;
        this.cdr.detectChanges();
      }),
      error: () => this.ngZone.run(() => {
        this.isLoadingSeenBy = false;
        this.cdr.detectChanges();
      })
    });
  }

  closeSeenByPanel(): void {
    this.showSeenByPanel = false;
    this.seenByMsgId     = null;
    this.cdr.detectChanges();
  }

  // ── GIF Picker ────────────────────────────────────────
  showGifPicker      = false;
  gifSearchQuery     = '';
  gifResults: any[]  = [];
  gifTrending: any[] = [];
  isLoadingGifs      = false;
  private _gifJustOpened = false;
  private gifSearchTimeout?: ReturnType<typeof setTimeout>;

  toggleGifPicker(): void {
    this.showGifPicker = !this.showGifPicker;
    if (this.showGifPicker) {
      this._gifJustOpened = true;
      this.showEmojiPicker = false;
      this.showAttachMenu  = false;
      if (!this.gifTrending.length) this._loadTrendingGifs();
    }
    this.cdr.markForCheck();
  }

  private _loadTrendingGifs(): void {
    this.isLoadingGifs = true;
    this.chatApi.trendingGifs(20).subscribe({
      next: res => this.ngZone.run(() => {
        // Tenor v2 → res.results[]
        this.gifTrending   = res.results || [];
        this.gifResults    = this.gifTrending;
        this.isLoadingGifs = false;
        this.cdr.markForCheck();
      }),
      error: () => this.ngZone.run(() => { this.isLoadingGifs = false; this.cdr.markForCheck(); })
    });
  }

  onGifSearch(query: string): void {
    this.gifSearchQuery = query;
    clearTimeout(this.gifSearchTimeout);
    if (!query.trim()) { this.gifResults = this.gifTrending; this.cdr.markForCheck(); return; }
    this.gifSearchTimeout = setTimeout(() => {
      this.isLoadingGifs = true;
      this.chatApi.searchGifs(query).subscribe({
        next: res => this.ngZone.run(() => {
          // Tenor v2 → res.results[]
          this.gifResults    = res.results || [];
          this.isLoadingGifs = false;
          this.cdr.markForCheck();
        }),
        error: () => this.ngZone.run(() => { this.isLoadingGifs = false; this.cdr.markForCheck(); })
      });
    }, 400);
  }

  sendGif(gif: any): void {
    this.showGifPicker = false;
    if (!this.currentChatRoomId) return;
    // Tenor v2 format: gif.media_formats.gif.url  (fallback: tinygif)
    const gifUrl = gif?.media_formats?.gif?.url
                || gif?.media_formats?.tinygif?.url
                || gif?.media_formats?.nanogif?.url
                || '';
    if (!gifUrl) return;

    this.chatWs.sendMessage({
      chatRoomId:   this.currentChatRoomId,
      senderId:     this.currentUserId,
      name:         this.currentUserName,
      profile:      this.currentUserProfile,
      message:      gif.content_description || gif.title || 'GIF',
      type:         'image',
      fileUrl:      gifUrl,
      fileName:     (gif.content_description || 'gif').replace(/\s+/g, '_').slice(0, 40) + '.gif',
      align:        'right',
    });
    this.cdr.markForCheck();
  }

  getGifPreviewUrl(gif: any): string {
    // Tenor v2: prefer tinygif (small) for the grid preview, fallback to gif
    return gif?.media_formats?.tinygif?.url
        || gif?.media_formats?.nanogif?.url
        || gif?.media_formats?.gif?.url
        || '';
  }

  onMessageInput(): void {
    if (!this.currentChatRoomId) return;
    if (!this.isTyping) {
      this.isTyping = true;
      this.chatWs.sendTyping(this.currentChatRoomId, this.currentUserId, this.currentUserName, true);
    }
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      this.chatWs.sendTyping(this.currentChatRoomId, this.currentUserId, this.currentUserName, false);
    }, 2000);
  }

  private subscribeToTyping(chatRoomId: string): void {
    this.typingSub?.unsubscribe();
    this.typingUsers.clear();
    this.typingText = '';
    this.typingSub = this.chatWs.subscribeToTyping(chatRoomId).subscribe(event => {
      this.ngZone.run(() => {
        if (event.userId === this.currentUserId) return;
        if (event.isTyping) { this.typingUsers.set(event.userId, event.name); }
        else                { this.typingUsers.delete(event.userId); }
        const names = Array.from(this.typingUsers.values());
        if      (names.length === 0) this.typingText = '';
        else if (names.length === 1) this.typingText = `${names[0]} is typing...`;
        else if (names.length === 2) this.typingText = `${names[0]} and ${names[1]} are typing...`;
        else                         this.typingText = `${names.length} people are typing...`;
        this.cdr.markForCheck();
      });
    });
  }

  // ── Pinned ──
  pinnedMessages: any[] = [];
  showPinnedPanel = false;

  loadPinnedMessages(): void {
    if (!this.currentChatRoomId) return;
    this.chatApi.getPinnedMessages(this.currentChatRoomId).subscribe({
      next: msgs => this.ngZone.run(() => { this.pinnedMessages = msgs; this.cdr.markForCheck(); })
    });
  }

  togglePinMessage(msg: any): void {
    if (!msg.id || msg.id.startsWith('local_')) return;
    this.chatApi.togglePin(msg.id).subscribe({
      next: (updated: any) => this.ngZone.run(() => {
        this.chatMessagesData = this.chatMessagesData.map((m: any) =>
          m.id === msg.id ? { ...m, pinned: updated.pinned } : m
        );
        this.loadPinnedMessages();
        this.cdr.markForCheck();
      })
    });
  }

  scrollToPinnedMessage(msg: any): void {
    this.showPinnedPanel = false;
    const el = document.getElementById('msg-' + msg.id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ── Mentions ──
  showMentionList       = false;
  mentionQuery          = '';
  mentionSuggestions: any[] = [];
  mentionStartIndex     = -1;
  private notifSub?: Subscription;
  mentionNotifications: any[] = [];
  showMentionBadge      = false;

  onMessageKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Escape') { this.showMentionList = false; this.cdr.markForCheck(); return; }
    if (event.key === 'Enter' && this.showMentionList && this.mentionSuggestions.length > 0) {
      this.insertMention(this.mentionSuggestions[0]); return;
    }
    const input  = event.target as HTMLInputElement;
    const value  = input.value;
    const cursor = input.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1) {
      const query = textBeforeCursor.substring(atIndex + 1);
      if (!query.includes(' ')) {
        this.mentionQuery      = query;
        this.mentionStartIndex = atIndex;
        this.showMentionList   = true;
        this.mentionSuggestions = this.chatData
          .filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5);
        this.cdr.markForCheck();
        return;
      }
    }
    this.showMentionList    = false;
    this.mentionSuggestions = [];
    this.cdr.markForCheck();
  }

  insertMention(user: ChatUser): void {
    const currentMsg = this.formData.get('message')?.value || '';
    const before     = currentMsg.substring(0, this.mentionStartIndex);
    const after      = currentMsg.substring(this.mentionStartIndex + this.mentionQuery.length + 1);
    this.formData.patchValue({ message: `${before}@${user.name} ${after}` });
    this.showMentionList    = false;
    this.mentionSuggestions = [];
    this.cdr.markForCheck();
  }

  private subscribeToNotifications(): void {
    this.notifSub?.unsubscribe();
    this.notifSub = this.chatWs.subscribeToNotifications(this.currentUserId).subscribe(notif => {
      this.ngZone.run(() => {
        if (notif.event === 'MENTION') {
          this.mentionNotifications = [notif, ...this.mentionNotifications].slice(0, 10);
          this.showMentionBadge = true;
          if (Notification.permission === 'granted') {
            new Notification(`📢 ${notif.fromName} vous a mentionné`, { body: notif.message });
          }
        }
        this.cdr.markForCheck();
      });
    });
  }

  clearMentionBadge(): void {
    this.showMentionBadge     = false;
    this.mentionNotifications = [];
    this.cdr.markForCheck();
  }

  // ── Search ──
  showSearchPanel       = false;
  messageSearchQuery    = '';
  messageSearchResults: any[] = [];
  isSearchingMessages   = false;
  private searchDestroy$ = new Subject<void>();

  toggleSearchPanel(): void {
    this.showSearchPanel = !this.showSearchPanel;
    if (!this.showSearchPanel) { this.messageSearchQuery = ''; this.messageSearchResults = []; }
    this.cdr.markForCheck();
  }

  onMessageSearch(query: string): void {
    this.messageSearchQuery = query;
    if (query.trim().length < 2) { this.messageSearchResults = []; this.cdr.markForCheck(); return; }
    this.isSearchingMessages = true;
    this.chatApi.searchMessages(this.currentChatRoomId, query).subscribe({
      next: results => this.ngZone.run(() => {
        this.messageSearchResults = results; this.isSearchingMessages = false; this.cdr.markForCheck();
      }),
      error: () => this.ngZone.run(() => { this.isSearchingMessages = false; this.cdr.markForCheck(); })
    });
  }

  scrollToMessage(msg: any): void {
    const el = document.getElementById('msg-' + msg.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('msg-highlight');
      setTimeout(() => el.classList.remove('msg-highlight'), 2000);
    }
    this.showSearchPanel = false;
  }

  highlightText(text: string, query: string): string {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }

  // ══════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ══════════════════════════════════════════════════════

  constructor(
    public  formBuilder:  UntypedFormBuilder,
    private lightbox:     Lightbox,
    private offcanvas:    NgbOffcanvas,
    private modalService: NgbModal,
    private cdr:          ChangeDetectorRef,
    private ngZone:       NgZone,
    private datePipe:     DatePipe,
    private chatApi:      ChatApiService,
    private chatWs:       ChatWsService,
    private auth:         AuthService,
    private notifSvc:     NotificationService,
    public  webrtc:       WebRtcService,
  ) {
    for (let i = 1; i <= 24; i++) {
      this.images.push({
        src: `/assets/images/small/img-${i}.jpg`, caption: `Image ${i}`,
        thumb: `/assets/images/small/img-${i}-thumb.jpg`,
      });
    }
    this._refreshDisplayedEmojis();
  }

  // ══════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════

  ngOnInit(): void {
    this.currentUserId      = this.auth.getUserId();
    this.currentUserName    = this.auth.getUserName();
    this.currentUserProfile = this.resolveImageUrl(this.auth.getUserImage()) ?? '';

    this.formData = this.formBuilder.group({ message: ['', [Validators.required]] });
    this._initModalForms();
    this._initSearchSubscription();

    try {
      const stored = localStorage.getItem('chat_recent_emojis');
      if (stored) {
        this.recentEmojis = JSON.parse(stored).slice(0, 30);
        this.emojiCategories[0].emojis = this.recentEmojis;
      }
    } catch {}

    this.chatApi.register().subscribe({ next: () => this._boot(), error: () => this._boot() });
    if (Notification.permission === 'default') Notification.requestPermission();
  }

  private _boot(): void {
    this.chatWs.connect();
    this.loadUsers();
    this.loadGroups();
    this.loadContacts();
    this.notifSvc.init();
    // ✅ Initialiser WebRTC avec ChatWsService directement (plus fiable)
    setTimeout(() => {
      this.webrtc.init(this.chatWs);
    }, 200);
    // ✅ FIX OnPush: s'abonner aux changements d'état WebRTC — detectChanges pour forcer immédiatement
    this.webrtc.stateChange$.subscribe(() => this.ngZone.run(() => this.cdr.detectChanges()));
    // ✅ Enregistrer un message dans le chat à chaque fin/refus d'appel
    this.webrtc.callEvent$.subscribe(ev => this.ngZone.run(() => {
      this.cdr.detectChanges();
      if (ev.type === 'ended' || ev.type === 'rejected') {
        this._saveCallMessage(ev);
      }
    }));
    setTimeout(() => this.subscribeToNotifications(), 1200);
    // ✅ Présence avancée — écouter les events connect/disconnect en temps réel
    setTimeout(() => this.subscribeToPresence(), 800);
  }

  ngAfterViewInit(): void { this.onListScroll(); }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.recordingTimer$?.unsubscribe();
    this.typingSub?.unsubscribe();
    this.readSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.presenceSub?.unsubscribe();
    this.searchDestroy$.next();
    this.searchDestroy$.complete();
    clearTimeout(this.typingTimeout);
    clearTimeout(this.gifSearchTimeout);
    this.chatWs.disconnect();
    if (this.isRecording) this._stopMediaRecorder();
  }

  // ══════════════════════════════════════════════════════
  // OUVRIR CONVERSATION
  // ══════════════════════════════════════════════════════

  private _openConversation(roomId: string): void {
    this.currentChatRoomId = roomId;
    this.loadMessages(roomId);
    this.subscribeToRoom(roomId);
    this.subscribeToTyping(roomId);
    this.loadPinnedMessages();
    this.showSearchPanel      = false;
    this.messageSearchResults = [];
    setTimeout(() => this.chatWs.sendReadAll(roomId, this.currentUserId), 500);
  }

  chatUsername(user: ChatUser): void {
    if (!user.userId) return;
    this.isFlag    = true;
    this.username  = user.name;
    this.isStatus  = user.status;
    this.isProfile = this.resolveImageUrl(user.image) ?? '';
    this.currentUserLastSeen = null;
    this.showSeenByPanel = false;
    // Fetch fresh presence info
    this.fetchPresence(user.userId);
    // ✅ FIX: toujours passer par openDirectRoom pour garantir que la room
    // DIRECT existe avant d'ouvrir la conversation. user.roomId peut être
    // un userId (fallback du backend) si la room n'a pas encore été créée.
    this.chatApi.openDirectRoom(user.userId).subscribe({
      next: room => {
        // Mettre à jour le roomId dans chatData pour les prochains clics
        const idx = this.chatData.findIndex(u => u.userId === user.userId);
        if (idx !== -1) this.chatData[idx] = { ...this.chatData[idx], roomId: room.id };
        this._openConversation(room.id);
      },
      error: e => console.error('openDirectRoom error:', e)
    });
    document.querySelector('.user-chat')?.classList.add('user-chat-show');
  }

  openContact(userId: string, name: string, profile?: string): void {
    if (!userId) return;
    this.isFlag    = true;
    this.username  = name;
    this.isStatus  = 'online';
    this.isProfile = this.resolveImageUrl(profile) ?? '';
    this.currentUserLastSeen = null;
    this.showSeenByPanel = false;
    this.fetchPresence(userId);
    this.chatApi.openDirectRoom(userId).subscribe({
      next: room => this._openConversation(room.id),
      error: e   => console.error(e)
    });
    document.querySelector('.user-chat')?.classList.add('user-chat-show');
  }

  openGroup(group: GroupUser): void {
    this.isFlag    = true;
    this.username  = group.name;
    this.isStatus  = 'group';
    this.isProfile = '';
    this.currentUserLastSeen = null;
    this.showSeenByPanel = false;
    this._openConversation(group.roomId);
    document.querySelector('.user-chat')?.classList.add('user-chat-show');
  }

  // ══════════════════════════════════════════════════════
  // LOAD MESSAGES
  // ══════════════════════════════════════════════════════

  loadMessages(chatRoomId: string): void {
    // ✅ FIX align : s'assurer que currentUserId est chargé
    if (!this.currentUserId) {
      this.currentUserId      = this.auth.getUserId();
      this.currentUserName    = this.auth.getUserName();
      this.currentUserProfile = this.auth.getUserImage();
    }
    const myId = this.currentUserId;

    this.chatApi.getMessages(chatRoomId).subscribe({
      next: (msgs: any[]) => this.ngZone.run(() => {
        this.chatMessagesData = msgs.map(msg => {
          const isMyMsg = String(msg.senderId).trim() === String(myId).trim();
          let type = msg.type ?? 'text';
          if ((type === 'text' || !type) && msg.fileUrl) {
            type = this._detectTypeFromUrl(msg.fileUrl, msg.fileMimeType);
          }
          return {
            ...msg,
            // ✅ FIX: fallback sur le nom si null/vide
            name:      msg.name && msg.name.trim() && msg.name !== 'Unknown User'
                         ? msg.name
                         : (isMyMsg ? (this.currentUserName || 'Me') : (msg.senderId ? 'User-' + msg.senderId.slice(-4) : '?')),
            align:     isMyMsg ? 'right' : 'left',
            profile:   this.resolveImageUrl(msg.profile),
            type,
            reactions: msg.reactions || [],
            readBy:    new Set<string>(msg.readBy || []),
          };
        });

        // ✅ Mettre à jour le preview du dernier message dans la sidebar
        if (msgs.length > 0) {
          const last = msgs[msgs.length - 1];
          this._updateSidebarPreview(chatRoomId, last);
        }

        this.cdr.markForCheck();
        this.onListScroll();
      }),
      error: e => console.error('loadMessages error:', e)
    });
  }

  // ══════════════════════════════════════════════════════
  // WEBSOCKET
  // ══════════════════════════════════════════════════════

  private subscribeToRoom(chatRoomId: string): void {
    this.wsSub?.unsubscribe();
    this.wsSub = this.chatWs.subscribeToRoom(chatRoomId).subscribe({
      next: (msg: any) => this.ngZone.run(() => {
        if (!msg) return;

        // ✅ SIGNAUX WebRTC — interceptés depuis le canal de room
        if (['CALL_OFFER','CALL_ANSWER','CALL_ICE','CALL_END'].includes(msg.event)) {
          this.webrtc.handleRoomSignal(msg);
          return;
        }

        // READ_RECEIPT
        if (msg.event === 'READ_RECEIPT') {
          this.chatMessagesData = this.chatMessagesData.map((m: any) => {
            if (m.id !== msg.messageId) return m;
            const readBy = new Set<string>(m.readBy || []);
            readBy.add(msg.userId);
            return { ...m, readBy };
          });
          this.cdr.markForCheck();
          return;
        }

        // ALL_READ
        if (msg.event === 'ALL_READ') {
          this.chatMessagesData = this.chatMessagesData.map((m: any) => {
            const readBy = new Set<string>(m.readBy || []);
            readBy.add(msg.userId);
            return { ...m, readBy };
          });
          this.cdr.markForCheck();
          return;
        }

        // ÉPINGLÉ
        if (msg.event === 'MESSAGE_PINNED' || msg.event === 'MESSAGE_UNPINNED') {
          this.chatMessagesData = this.chatMessagesData.map((m: any) =>
            m.id === msg.messageId ? { ...m, pinned: msg.pinned } : m
          );
          this.loadPinnedMessages();
          this.cdr.markForCheck();
          return;
        }

        // SUPPRESSION
        if (msg.event === 'message_deleted') {
          this.chatMessagesData = this.chatMessagesData.filter((m: any) => m.id !== msg.messageId);
          this.cdr.markForCheck();
          return;
        }

        // SUPPRESSION TOTALE
        if (msg.event === 'ALL_MESSAGES_DELETED') {
          this.chatMessagesData = [];
          this.cdr.markForCheck();
          return;
        }

        // ÉDITION
        if (msg.event === 'MESSAGE_EDITED') {
          this.chatMessagesData = this.chatMessagesData.map((m: any) =>
            m.id === msg.messageId ? { ...m, message: msg.message, edited: true } : m
          );
          this.cdr.markForCheck();
          return;
        }

        // ✅ RÉACTION reçue d'un autre utilisateur
        if (msg.event === 'REACTION') {
          this.chatMessagesData = this.chatMessagesData.map((m: any) =>
            m.id === msg.messageId
              ? { ...m, reactions: msg.reactions || [] }
              : m
          );
          this.cdr.markForCheck();
          return;
        }

        if (!msg.senderId) return;

        const enriched: any = {
          ...msg,
          // ✅ FIX: fallback nom si null
          name:      msg.name && msg.name.trim() && msg.name !== 'Unknown User'
                       ? msg.name
                       : (String(msg.senderId).trim() === String(this.currentUserId).trim()
                           ? (this.currentUserName || 'Me')
                           : (msg.senderId ? 'User-' + msg.senderId.slice(-4) : '?')),
          align:     String(msg.senderId).trim() === String(this.currentUserId).trim() ? 'right' : 'left',
          profile:   this.resolveImageUrl(msg.profile),
          type:      (() => {
            let t = msg.type ?? 'text';
            if ((t === 'text' || !t) && msg.fileUrl) t = this._detectTypeFromUrl(msg.fileUrl, msg.fileMimeType);
            return t;
          })(),
          reactions: msg.reactions || [],
          readBy:    new Set<string>(msg.readBy || []),
        };

        // ✅ FIX : remplacer le message local _isLocal par la version serveur
        if (String(msg.senderId).trim() === String(this.currentUserId).trim()) {
          const localIndex = this.chatMessagesData.findIndex(
            (m: any) => m._isLocal === true
                     && m.type === enriched.type
                     && m.chatRoomId === enriched.chatRoomId
          );
          if (localIndex !== -1) {
            const updated = [...this.chatMessagesData];
            updated[localIndex] = { ...enriched, _isLocal: false };
            this.chatMessagesData = updated;
            this.cdr.markForCheck();
            this.onListScroll();
            return;
          }
        }

        // Éviter les doublons par ID
        if (this.chatMessagesData.some((m: any) => m.id === enriched.id)) {
          this.chatMessagesData = this.chatMessagesData.map((m: any) =>
            m.id === enriched.id ? { ...m, ...enriched } : m
          );
          this.cdr.markForCheck();
          return;
        }

        // Nouveau message d'un autre utilisateur
        this.chatMessagesData = [...this.chatMessagesData, enriched];
        this.cdr.markForCheck();
        this.onListScroll();

        // ✅ Mettre à jour le preview sidebar en temps réel
        this._updateSidebarPreview(chatRoomId, enriched);

        // Accuser réception
        if (msg.senderId !== this.currentUserId && msg.id) {
          setTimeout(() => this.chatWs.sendReadReceipt(msg.id, this.currentUserId, chatRoomId), 300);
        }
      })
    });
  }

  // ══════════════════════════════════════════════════════
  // ENVOYER MESSAGE
  // ══════════════════════════════════════════════════════

  messageSave(): void {
    const message = this.formData.get('message')?.value?.trim();
    if (!message || !this.currentChatRoomId || !this.currentUserId) return;

    if (this.isTyping) {
      this.isTyping = false;
      clearTimeout(this.typingTimeout);
      this.chatWs.sendTyping(this.currentChatRoomId, this.currentUserId, this.currentUserName, false);
    }

    const payload: any = {
      chatRoomId: this.currentChatRoomId,
      senderId:   this.currentUserId,
      name:       this.currentUserName,
      profile:    this.currentUserProfile,
      message,
      align:      'right',
    };

    // ✅ Attach reply info if replying
    if (this.isreplyMessage && this.replyToMsg) {
      payload.replyToId   = this.replyToMsg.id;
      payload.replayName  = this.replyToMsg.name;
      payload.replaymsg   = this.replyToMsg.message;
    }

    this.chatWs.sendMessage(payload);

    this.formData.reset();
    this.showMentionList    = false;
    this.mentionSuggestions = [];
    this.closeReplay();
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════
  // CLICK OUTSIDE
  // ══════════════════════════════════════════════════════

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // ✅ Skip the first click after startEdit (the dropdown item click itself)
    if (this._editJustOpened) {
      this._editJustOpened = false;
      this.cdr.markForCheck();
      return;
    }

    // ✅ Don't close anything if user is clicking inside the edit inline block
    if (this.editingMsgId && target.closest('.edit-inline')) {
      return;
    }

    // Cancel edit if clicking outside the edit inline block
    if (this.editingMsgId && !target.closest('.edit-inline')) {
      this.cancelEdit();
    }

    if (this._emojiJustOpened) { this._emojiJustOpened = false; }
    else if (this.showEmojiPicker && !target.closest('#emoji-btn') && !target.closest('.custom-emoji-picker-wrapper')) {
      this.showEmojiPicker = false;
    }

    if (this._attachJustOpened) { this._attachJustOpened = false; }
    else if (this.showAttachMenu && !target.closest('#attach-btn') && !target.closest('.attach-menu')) {
      this.showAttachMenu = false;
    }

    if (this._gifJustOpened) { this._gifJustOpened = false; }
    else if (this.showGifPicker && !target.closest('#gif-btn') && !target.closest('.gif-picker-wrapper')) {
      this.showGifPicker = false;
    }

    if (this.showReactionPickerForMsgId && !target.closest('.reaction-picker') && !target.closest('.reaction-trigger')) {
      this.showReactionPickerForMsgId = null;
    }

    if (this.showMentionList && !target.closest('.mention-list') && !target.closest('#chat-input')) {
      this.showMentionList = false;
    }

    if (this.showSeenByPanel && !target.closest('.seen-by-panel') && !target.closest('.seen-by-trigger')) {
      this.showSeenByPanel = false;
    }

    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════
  // EMOJI
  // ══════════════════════════════════════════════════════

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (this.showEmojiPicker) { this._emojiJustOpened = true; this._refreshDisplayedEmojis(); }
    this.cdr.markForCheck();
  }

  setEmojiCategory(id: string): void {
    this.activeCategoryId = id;
    const cat = this.emojiCategories.find(c => c.id === id);
    this.activeCategoryLabel = cat?.label || '';
    this.emojiSearch = '';
    this._refreshDisplayedEmojis();
    this.cdr.markForCheck();
  }

  onEmojiSearch(query: string): void { this.emojiSearch = query; this._refreshDisplayedEmojis(); this.cdr.markForCheck(); }

  insertEmoji(emoji: string): void {
    const current = this.formData.get('message')?.value || '';
    this.formData.patchValue({ message: current + emoji });
    this.recentEmojis = [emoji, ...this.recentEmojis.filter(e => e !== emoji)].slice(0, 30);
    this.emojiCategories[0].emojis = this.recentEmojis;
    try { localStorage.setItem('chat_recent_emojis', JSON.stringify(this.recentEmojis)); } catch {}
    this.cdr.markForCheck();
  }

  private _refreshDisplayedEmojis(): void {
    const q = this.emojiSearch.trim().toLowerCase();
    if (q.length > 0) {
      const all: string[] = [];
      EMOJI_CATEGORIES.slice(1).forEach(c => all.push(...c.emojis));
      this.displayedEmojis     = all.filter(e => e.includes(q)).slice(0, 100);
      this.activeCategoryLabel = 'Results';
    } else {
      const cat = this.emojiCategories.find(c => c.id === this.activeCategoryId);
      this.displayedEmojis     = cat?.emojis ?? [];
      this.activeCategoryLabel = cat?.label  ?? '';
    }
  }

  // ══════════════════════════════════════════════════════
  // ATTACH MENU
  // ══════════════════════════════════════════════════════

  toggleAttachMenu(): void {
    this.showAttachMenu = !this.showAttachMenu;
    if (this.showAttachMenu) this._attachJustOpened = true;
    this.showEmojiPicker = false;
    this.cdr.markForCheck();
  }

  openImagePicker():    void { this.showAttachMenu = false; this.imageInput?.nativeElement.click(); }
  openFilePicker():     void { this.showAttachMenu = false; this.fileInput?.nativeElement.click(); }
  openDocumentPicker(): void { this.showAttachMenu = false; this.documentInput?.nativeElement.click(); }

  // ══════════════════════════════════════════════════════
  // FILE UPLOAD — ✅ CORRIGÉ
  // ══════════════════════════════════════════════════════

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files?.length) return;
    Array.from(files).forEach(f => this._uploadFile(f, this._detectType(f)));
    (event.target as HTMLInputElement).value = '';
  }

  private _detectType(file: File): MessageType {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
  }

  /** Détecte le type depuis l'URL ou le MIME type (pour les anciens messages en base) */
  private _detectTypeFromUrl(url: string, mime?: string): string {
    if (mime) {
      if (mime.startsWith('image/')) return 'image';
      if (mime.startsWith('video/')) return 'video';
      if (mime.startsWith('audio/')) return 'audio';
      return 'file';
    }
    const lower = url.toLowerCase().split('?')[0];
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(lower)) return 'image';
    if (/\.(mp4|mov|avi|mkv|webm|ogv)$/.test(lower))           return 'video';
    if (/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/.test(lower))      return 'audio';
    if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|txt|csv)$/.test(lower)) return 'file';
    return 'file';
  }

  private _uploadFile(file: File, type: MessageType): void {
    if (!this.currentChatRoomId) return;

    const localId    = 'local_' + Date.now();
    const localSnap  = this.currentChatRoomId; // snapshot pour éviter closure stale

    const reader = new FileReader();
    reader.onload = (e) => {
      const localMsg: any = {
        id:         localId,
        chatRoomId: localSnap,
        senderId:   this.currentUserId,
        name:       this.currentUserName,
        profile:    this.currentUserProfile,
        message:    file.name,
        time:       new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        align:      'right',
        type,
        fileUrl:    e.target?.result as string,  // ✅ base64 pour preview immédiate
        fileName:   file.name,
        fileSize:   this._formatSize(file.size), // ✅ file.size (pas getSize)
        reactions:  [],
        readBy:     new Set<string>(),
        _isLocal:   true,
      };

      this.ngZone.run(() => {
        this.chatMessagesData = [...this.chatMessagesData, localMsg];
        this.isUploadingFile  = true;
        this.uploadProgress   = 0;
        this.cdr.markForCheck();
        this.onListScroll();
      });

      const fd = new FormData();
      fd.append('file',       file);
      fd.append('chatRoomId', localSnap);
      fd.append('senderId',   this.currentUserId);
      fd.append('name',       this.currentUserName);
      fd.append('profile',    this.currentUserProfile);

      this.chatApi.uploadFile(fd).subscribe({
        next: (ev) => this.ngZone.run(() => {
          // Progression upload
          if (ev.progress !== undefined) {
            this.uploadProgress = ev.progress!;
            this.cdr.markForCheck();
            return;
          }

          // ✅ Upload terminé — la réponse est un ChatMessageResponse (id, fileUrl, type...)
          if (ev.result) {
            this.isUploadingFile = false;
            const serverMsg = ev.result as any;

            // ✅ Remplacer le message local par la vraie version serveur
            this.chatMessagesData = this.chatMessagesData.map((m: any) => {
              if (m.id !== localId) return m;
              return {
                ...m,
                id:       serverMsg.id       || localId,
                fileUrl:  serverMsg.url      || serverMsg.fileUrl || m.fileUrl,
                type:     serverMsg.type     || type,
                fileName: serverMsg.fileName || file.name,
                fileSize: serverMsg.fileSize || m.fileSize,
                _isLocal: false,
              };
            });

            this.cdr.markForCheck();
            this.onListScroll();
          }
        }),
        error: () => this.ngZone.run(() => {
          // Retirer le message local en cas d'erreur
          this.chatMessagesData = this.chatMessagesData.filter((m: any) => m.id !== localId);
          this.isUploadingFile  = false;
          this.cdr.markForCheck();
        })
      });
    };
    reader.readAsDataURL(file);
  }

  private _formatSize(bytes: number): string {
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFileIcon(fileName?: string): string {
    const ext = (fileName?.split('.').pop() || '').toLowerCase();
    if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'ri-image-line';
    if (['mp4','mov','avi','mkv','webm'].includes(ext))        return 'ri-video-line';
    if (['mp3','wav','ogg','m4a'].includes(ext))               return 'ri-music-line';
    if (ext === 'pdf')                                          return 'ri-file-pdf-line';
    if (['doc','docx'].includes(ext))                          return 'ri-file-word-line';
    if (['xls','xlsx'].includes(ext))                          return 'ri-file-excel-line';
    if (['zip','rar','7z'].includes(ext))                      return 'ri-folder-zip-line';
    return 'ri-file-line';
  }

  downloadFile(url: string, name: string): void {
    // ✅ FIX: fetch + blob pour forcer le téléchargement même cross-origin
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      })
      .catch(() => {
        // Fallback : ouvrir dans un nouvel onglet
        window.open(url, '_blank');
      });
  }

  // ══════════════════════════════════════════════════════
  // VOICE RECORDING
  // ══════════════════════════════════════════════════════

  async startRecording(): Promise<void> {
    if (this.isRecording) { this._stopMediaRecorder(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks   = [];
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.audioChunks.push(e.data); };
      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        this._sendVoiceMessage(new Blob(this.audioChunks, { type: 'audio/webm' }));
      };
      this.mediaRecorder.start(200);
      this.isRecording       = true;
      this.recordingDuration = 0;
      this.recordingTimer$ = interval(1000).subscribe(() => {
        this.recordingDuration++;
        if (this.recordingDuration >= 120) this._stopMediaRecorder();
        this.cdr.markForCheck();
      });
      this.cdr.markForCheck();
    } catch { alert('Microphone not accessible. Please check permissions.'); }
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
      this.mediaRecorder.stream?.getTracks().forEach(t => t.stop());
    }
    this.isRecording = false; this.recordingDuration = 0; this.audioChunks = [];
    this.recordingTimer$?.unsubscribe(); this.cdr.markForCheck();
  }

  private _stopMediaRecorder(): void {
    if (this.mediaRecorder && this.isRecording) this.mediaRecorder.stop();
    this.isRecording = false; this.recordingTimer$?.unsubscribe(); this.cdr.markForCheck();
  }

  private _sendVoiceMessage(blob: Blob): void {
    if (!this.currentChatRoomId) return;
    this.recordingDuration = 0;
    const localId = 'local_' + Date.now();
    const localMsg: any = {
      id: localId, chatRoomId: this.currentChatRoomId,
      senderId: this.currentUserId, name: this.currentUserName,
      profile: this.currentUserProfile, message: 'Voice message',
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      align: 'right', type: 'audio',
      fileUrl: URL.createObjectURL(blob), fileName: 'voice_message.webm', reactions: [],
      _isLocal: true,
    };
    this.ngZone.run(() => {
      this.chatMessagesData = [...this.chatMessagesData, localMsg];
      this.cdr.markForCheck();
      this.onListScroll();
    });
    const fd = new FormData();
    fd.append('file', blob, 'voice_message.webm');
    fd.append('chatRoomId', this.currentChatRoomId);
    fd.append('senderId',   this.currentUserId);
    fd.append('name',       this.currentUserName);
    fd.append('profile',    this.currentUserProfile);
    this.chatApi.uploadFile(fd).subscribe({
      next: ev => {
        if (ev.result) this.ngZone.run(() => {
          const serverMsg = ev.result as any;
          this.chatMessagesData = this.chatMessagesData.map((m: any) =>
            m.id === localId
              ? { ...m, fileUrl: serverMsg.url || serverMsg.fileUrl || m.fileUrl, id: serverMsg.id || localId, _isLocal: false }
              : m
          );
          this.cdr.markForCheck();
        });
      }
    });
  }

  formatRecordingTime(s: number): string {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }

  // ══════════════════════════════════════════════════════
  // MEDIA FILTER
  // ══════════════════════════════════════════════════════

  get imagesList() { return this.chatMessagesData.filter((m: any) => m.type === 'image'); }
  get videosList() { return this.chatMessagesData.filter((m: any) => m.type === 'video'); }
  get filesList()  { return this.chatMessagesData.filter((m: any) => m.type === 'file');  }
  get audioList()  { return this.chatMessagesData.filter((m: any) => m.type === 'audio'); }

  // ══════════════════════════════════════════════════════
  // LOCALISATION
  // ══════════════════════════════════════════════════════

  sendLocation(): void {
    this.showAttachMenu = false;
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    this.isSendingLocation = true; this.cdr.markForCheck();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.ngZone.run(() => {
          this.isSendingLocation = false;
          const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          // ✅ FIX: suppression de staticmap.openstreetmap.de (domaine hors service → ERR_NAME_NOT_RESOLVED)
          // La carte est maintenant affichée via une iframe OpenStreetMap côté HTML, sans image externe
          const localMsg: any = {
            id: 'local_' + Date.now(), chatRoomId: this.currentChatRoomId,
            senderId: this.currentUserId, name: this.currentUserName,
            profile: this.currentUserProfile,
            message: `📍 My location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
            align: 'right', type: 'location', latitude, longitude,
            locationUrl: mapsUrl, reactions: []
          };
          this.chatMessagesData = [...this.chatMessagesData, localMsg];
          this.cdr.markForCheck(); this.onListScroll();
          this.chatApi.sendLocation({
            chatRoomId: this.currentChatRoomId, senderId: this.currentUserId,
            name: this.currentUserName, profile: this.currentUserProfile, latitude, longitude
          }).subscribe();
        });
      },
      () => this.ngZone.run(() => { this.isSendingLocation = false; this.cdr.markForCheck(); alert('Location not available.'); }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ══════════════════════════════════════════════════════
  // APPELS VIDÉO / AUDIO WebRTC
  // ══════════════════════════════════════════════════════

  startVideoCall(): void {
    if (!this.username || !this.currentChatRoomId) return;
    const peer   = this.chatData.find(u => u.name === this.username);
    const peerId = peer?.userId || this.username;
    // ✅ passer chatRoomId pour que le message soit enregistré dans la bonne room
    this.webrtc.startCall(peerId, this.username, 'video', this.currentChatRoomId).catch(err => {
      console.error('startVideoCall error:', err);
      alert('Unable to start video call. Please check camera/microphone permissions.');
    });
    this.cdr.markForCheck();
  }

  startAudioCall(): void {
    if (!this.username || !this.currentChatRoomId) return;
    const peer   = this.chatData.find(u => u.name === this.username);
    const peerId = peer?.userId || this.username;
    // ✅ passer chatRoomId pour que le message soit enregistré dans la bonne room
    this.webrtc.startCall(peerId, this.username, 'audio', this.currentChatRoomId).catch(err => {
      console.error('startAudioCall error:', err);
      alert('Unable to start audio call. Please check microphone permissions.');
    });
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════
  // ENREGISTRER UN MESSAGE D'APPEL DANS LE CHAT
  // ══════════════════════════════════════════════════════

  private _saveCallMessage(ev: import('../core/services/webrtc.service').CallEvent): void {
    const roomId = ev.chatRoomId || this.currentChatRoomId;
    if (!roomId || !this.currentUserId) return;

    // ✅ FIX: s'assurer que currentUserName est bien chargé
    const senderName = this.currentUserName
      || this.auth.getUserName()
      || 'Moi';

    const isVideo     = this.webrtc.callType === 'video';
    const rejected    = ev.type === 'rejected';
    const duration    = ev.duration ?? 0;
    const durationTxt = duration > 0 ? ` · ${this.webrtc.formatDuration(duration)}` : '';

    let msgText: string;
    if (rejected) {
      msgText = isVideo ? '📹 Missed video call' : '📞 Missed audio call';
    } else if (duration === 0) {
      msgText = isVideo ? '📹 Video call (no answer)' : '📞 Audio call (no answer)';
    } else {
      msgText = isVideo
        ? `📹 Video call${durationTxt}`
        : `📞 Audio call${durationTxt}`;
    }

    // ✅ FIX: message local avec tous les champs requis pour l'affichage
    const localMsg: any = {
      id:           'call_' + Date.now(),
      chatRoomId:   roomId,
      senderId:     this.currentUserId,
      name:         senderName,          // ← nom correct
      profile:      this.currentUserProfile || null,
      message:      msgText,
      type:         'call',
      callType:     this.webrtc.callType,
      callStatus:   rejected ? 'missed' : (duration > 0 ? 'ended' : 'no-answer'),
      callDuration: duration,
      align:        'right',
      time:         new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      reactions:    [],
      readBy:       new Set<string>(),
    };

    if (roomId === this.currentChatRoomId) {
      this.chatMessagesData = [...this.chatMessagesData, localMsg];
      this.cdr.markForCheck();
      this.onListScroll();
    }
    // ✅ PAS d'envoi WebSocket — le message d'appel est local uniquement
    // (le backend ne gère pas type="call", ça créerait une bulle vide corrompue)
  }

  openInMaps(url?: string, lat?: number, lng?: number): void {
    // ✅ FIX: créer un vrai <a> et le cliquer — window.open peut être bloqué
    // par le navigateur si appelé depuis un handler sur une div non-interactive
    const href = url
      ? url
      : (lat != null && lng != null)
        ? `https://www.google.com/maps?q=${lat},${lng}`
        : null;
    if (!href) return;
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ══════════════════════════════════════════════════════
  // RÉACTIONS
  // ══════════════════════════════════════════════════════

  toggleReactionPicker(msgId: string, event: Event): void {
    event.stopPropagation();
    this.showReactionPickerForMsgId = this.showReactionPickerForMsgId === msgId ? null : msgId;
    this.cdr.markForCheck();
  }

  addReaction(msg: any, emoji: string): void {
    this.showReactionPickerForMsgId = null;
    if (!msg.id || msg.id.startsWith('local_')) return;

    // ✅ Optimistic update local immédiat
    if (!msg.reactions) msg.reactions = [];
    const existing = msg.reactions.find((r: Reaction) => r.emoji === emoji);
    if (existing) {
      const idx = existing.userIds.indexOf(this.currentUserId);
      if (idx > -1) {
        existing.userIds.splice(idx, 1); existing.count--;
        if (!existing.count) msg.reactions = msg.reactions.filter((r: Reaction) => r.emoji !== emoji);
      } else { existing.userIds.push(this.currentUserId); existing.count++; }
    } else {
      msg.reactions.push({ emoji, count: 1, userIds: [this.currentUserId] });
    }
    this.chatMessagesData = [...this.chatMessagesData];
    this.cdr.markForCheck();

    // ✅ Envoyer via WebSocket → broadcast à tous les participants
    this.chatWs.sendReaction(msg.id, emoji, this.currentUserId, this.currentChatRoomId);
  }

  hasReacted(msg: any, emoji: string): boolean {
    return msg.reactions?.find((r: Reaction) => r.emoji === emoji)?.userIds?.includes(this.currentUserId) || false;
  }

  // ══════════════════════════════════════════════════════
  // DONNÉES
  // ══════════════════════════════════════════════════════

  loadUsers():    void {
    this.chatApi.getUsers().subscribe({
      next: u => this.ngZone.run(() => {
        this.chatData = u.map((user: any) => ({
          ...user,
          image: this.resolveImageUrl(user.image) ?? undefined,
        }));
        this.cdr.markForCheck();
      })
    });
  }

  /** Updates the last message preview in the sidebar */
  private _updateSidebarPreview(chatRoomId: string, msg: any): void {
    const idx = this.chatData.findIndex(u => u.roomId === chatRoomId);
    if (idx !== -1) {
      this.chatData[idx] = {
        ...this.chatData[idx],
        lastMessage: this._getPreviewText(msg),
        lastTime:    msg.time || '',
        lastType:    msg.type || 'text',
      };
      this.cdr.markForCheck();
    }
    // Aussi pour les groupes
    const gIdx = this.groupData.findIndex(g => g.roomId === chatRoomId);
    if (gIdx !== -1) {
      (this.groupData[gIdx] as any).lastMessage = this._getPreviewText(msg);
      (this.groupData[gIdx] as any).lastTime    = msg.time || '';
      this.cdr.markForCheck();
    }
  }

  /** Generates preview text based on message type */
  private _getPreviewText(msg: any): string {
    const isMe = String(msg.senderId).trim() === String(this.currentUserId).trim();
    const prefix = isMe ? 'You: ' : '';
    switch (msg.type) {
      case 'image':    return prefix + '📷 Photo';
      case 'video':    return prefix + '🎥 Video';
      case 'audio':    return prefix + '🎤 Voice message';
      case 'file':     return prefix + '📎 ' + (msg.fileName || 'File');
      case 'location': return prefix + '📍 Location';
      case 'call':     return msg.callStatus === 'missed' || msg.callStatus === 'no-answer'
                              ? '📵 Missed call'
                              : '📞 ' + (msg.callType === 'video' ? 'Video' : 'Audio') + ' call';
      default:         return prefix + (msg.message || '');
    }
  }
  loadGroups():   void {
    this.chatApi.getGroups().subscribe({
      next: (raw: any[]) => this.ngZone.run(() => {
        // ✅ FIX: le backend retourne ChatRoom {id, name, type, memberIds}
        // mais GroupUser attend {roomId, name, unread}
        this.groupData = raw.map((r: any) => ({
          roomId: r.roomId || r.id || r._id || '',
          name:   r.name  || 'Group',
          unread: r.unread || '0',
        }));
        this.cdr.markForCheck();
      })
    });
  }
  loadContacts(): void { this.chatApi.getContacts().subscribe({ next: c => this.ngZone.run(() => { this.contactData = c; this.cdr.markForCheck(); }) }); }

  // ══════════════════════════════════════════════════════
  // MODALES
  // ══════════════════════════════════════════════════════

  private _initModalForms(): void {
    this.addContactForm  = this.formBuilder.group({ targetUserId: [''] });
    this.newMessageForm  = this.formBuilder.group({ recipientRoomId: ['', [Validators.required]], message: ['', [Validators.required]] });
    this.createGroupForm = this.formBuilder.group({ groupName: ['', [Validators.required, Validators.minLength(2)]], description: [''] });
  }

  private _initSearchSubscription(): void {
    this.searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(300), distinctUntilChanged(),
      switchMap((query: string) => {
        if (!query || query.length < 2) {
          this.ngZone.run(() => { this.searchResults = []; this.isSearching = false; this.cdr.markForCheck(); });
          return of([]);
        }
        this.ngZone.run(() => { this.isSearching = true; this.cdr.markForCheck(); });
        return this.chatApi.searchUsers(query);
      })
    ).subscribe({
      next:  (r: any[]) => this.ngZone.run(() => { this.searchResults = r; this.isSearching = false; this.cdr.markForCheck(); }),
      error: ()         => this.ngZone.run(() => { this.isSearching = false; this.cdr.markForCheck(); })
    });
  }

  isValidImageUrl(url?: string | null): boolean {
    if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null') return false;
    const u = url.trim();
    return u.startsWith('http://') || u.startsWith('https://') ||
           u.startsWith('/assets/') || u.startsWith('assets/') ||
           u.startsWith('/uploads/') || u.startsWith('uploads/') ||
           u.startsWith('data:image/') || u.startsWith('blob:') ||
           u.startsWith('/api/') || u.startsWith('/');
  }

  /** Résout une URL d'image — préfixe les URLs relatives du backend, rejette les fallbacks vides */
  resolveImageUrl(url?: string | null): string | null {
    if (!url || typeof url !== 'string') return null;
    const u = url.trim();
    if (!u || u === 'null' || u === 'undefined' || u === '') return null;
    // Rejeter le dummy placeholder — pas de vraie image
    if (u.includes('user-dummy-img') || u.includes('dummy')) return null;
    // Déjà absolue
    if (u.startsWith('http://') || u.startsWith('https://') ||
        u.startsWith('data:image/') || u.startsWith('blob:')) return u;
    // URL relative du backend → préfixer avec le gateway
    if (u.startsWith('/uploads/') || u.startsWith('uploads/')) {
      return 'http://localhost:8080' + (u.startsWith('/') ? u : '/' + u);
    }
    // Assets Angular locaux (seulement si le fichier existe vraiment)
    if (u.startsWith('/assets/') || u.startsWith('assets/')) return u;
    // Autre URL relative backend
    if (u.startsWith('/api/')) {
      return 'http://localhost:8080' + u;
    }
    return null;
  }

  /**
   * Gère l'erreur de chargement d'un avatar de message.
   * L'initiale est déjà visible en dessous (z-index 1) — on cache juste l'img.
   */
  onAvatarError(event: Event, data: any): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.setAttribute('data-error', 'true');
      img.style.display = 'none';
    }
    data.profile = null;
  }

  openAddContactModal(): void {
    this.contactSubmitted = false; this.contactError = ''; this.isSearching = false;
    this.searchResults = []; this.selectedUser = null; this.selectedUserId = '';
    this.searchControl.setValue('', { emitEvent: false });
    this.addContactForm = this.formBuilder.group({ targetUserId: [''] });
    // ✅ FIX aria-hidden: container:'body' rend la modale hors de <app-root>
    this.modalService.open(this.addContactModal, { centered: true, backdrop: 'static', size: 'md', container: 'body', windowClass: 'modal-fit-content' });
  }

  selectUser(user: any): void {
    const id   = (user.id || user._id || user.userId || '').toString().trim();
    const name = user.name?.trim() || user.username?.trim() || user.email || 'User';
    if (!id) return;
    this.selectedUser = {
      id, name, email: user.email || '',
      profile: this.isValidImageUrl(user.profile || user.avatar || user.image)
        ? (user.profile || user.avatar || user.image) : null
    };
    this.selectedUserId = id;
    this.addContactForm.get('targetUserId')!.setValue(id);
    this.searchResults = []; this.searchControl.setValue('', { emitEvent: false }); this.cdr.markForCheck();
  }

  clearSelectedUser(): void {
    this.selectedUser = null; this.selectedUserId = '';
    this.addContactForm.get('targetUserId')!.setValue('');
    this.cdr.markForCheck();
  }

  submitAddContact(): void {
    this.contactSubmitted = true; this.contactError = '';
    if (!this.selectedUser || !this.selectedUserId) return;
    this.isLoadingContact = true;
    this.chatApi.addContactByUserId(this.selectedUserId).subscribe({
      next: (room) => {
        this.isLoadingContact = false; this.loadUsers(); this.loadContacts(); this.modalService.dismissAll();
        this.isFlag = true; this.username = room.name || this.selectedUserId;
        this.isStatus = 'online'; this.isProfile = '';
        this._openConversation(room.id);
        document.querySelector('.user-chat')?.classList.add('user-chat-show');
        this.cdr.markForCheck();
      },
      error: (e) => { this.isLoadingContact = false; this.contactError = e?.error?.message || 'User not found.'; this.cdr.markForCheck(); }
    });
  }

  get acf() { return this.addContactForm.controls; }

  openNewMessageModal(): void {
    this.msgSubmitted = false; this.msgError = ''; this.newMessageForm.reset();
    // ✅ FIX aria-hidden: container:'body'
    this.modalService.open(this.newMessageModal, { centered: true, backdrop: 'static', size: 'md', container: 'body', windowClass: 'modal-fit-content' });
  }

  submitNewMessage(): void {
    this.msgSubmitted = true; this.msgError = '';
    if (this.newMessageForm.invalid) return;
    const recipientRoomId = this.newMessageForm.value.recipientRoomId;
    const messageText     = this.newMessageForm.value.message.trim();
    const recipient       = this.chatData.find(u => u.roomId === recipientRoomId);
    if (!recipient?.userId) { this.msgError = 'Recipient not found.'; return; }
    this.isLoadingMsg = true;
    this.chatApi.openDirectRoomById(recipient.userId).subscribe({
      next: (room) => {
        this.isLoadingMsg = false; this.modalService.dismissAll();
        this.isFlag = true; this.username = recipient.name; this.isStatus = recipient.status;
        this.isProfile = this.isValidImageUrl(recipient.image) ? recipient.image! : '';
        this._openConversation(room.id);
        document.querySelector('.user-chat')?.classList.add('user-chat-show');
        this.chatWs.sendMessage({
          chatRoomId: room.id, senderId: this.currentUserId,
          name: this.currentUserName, profile: this.currentUserProfile,
          message: messageText, align: 'right'
        });
        this.newMessageForm.reset();
      },
      error: (e) => { this.isLoadingMsg = false; this.msgError = e?.error?.message || 'Error.'; this.cdr.markForCheck(); }
    });
  }

  get nmf() { return this.newMessageForm.controls; }

  openCreateGroupModal(): void {
    this.groupSubmitted = false; this.groupError = ''; this.selectedMembers = [];
    this.createGroupForm.reset();
    // ✅ FIX aria-hidden: container:'body'
    this.modalService.open(this.createGroupModal, { centered: true, backdrop: 'static', size: 'md', container: 'body', windowClass: 'modal-fit-content' });
  }

  toggleMember(user: ChatUser): void {
    // ✅ FIX: stocker userId (pas user.name) — le backend attend des IDs
    const idx = this.selectedMembers.indexOf(user.userId);
    idx === -1 ? this.selectedMembers.push(user.userId) : this.selectedMembers.splice(idx, 1);
  }
  isMemberSelected(user: ChatUser): boolean { return this.selectedMembers.includes(user.userId); }

  submitCreateGroup(): void {
    this.groupSubmitted = true; this.groupError = '';
    if (this.createGroupForm.invalid || this.selectedMembers.length === 0) return;
    const groupName = this.createGroupForm.value.groupName.trim();
    this.isLoadingGroup = true;
    this.chatApi.createGroup(groupName, this.selectedMembers).subscribe({
      next: (room: any) => this.ngZone.run(() => {
        this.isLoadingGroup = false;
        const roomId = room.id || room.roomId || room._id || '';
        const newGroup: GroupUser = { roomId, name: room.name || groupName, unread: '0' };
        this.groupData = [...this.groupData, newGroup];
        this.modalService.dismissAll();
        this.selectedMembers = []; this.createGroupForm.reset();
        // ✅ FIX aria-hidden: remettre le focus sur le body après fermeture modale
        // pour éviter que le focus reste sur un élément dans aria-hidden
        setTimeout(() => (document.activeElement as HTMLElement)?.blur(), 50);
        this.cdr.markForCheck();
        this.openGroup(newGroup);
      }),
      error: (e) => this.ngZone.run(() => { this.isLoadingGroup = false; this.groupError = e?.error?.message || 'Error.'; this.cdr.markForCheck(); })
    });
  }

  get cgf() { return this.createGroupForm.controls; }

  // ══════════════════════════════════════════════════════
  // UTILITAIRES
  // ══════════════════════════════════════════════════════

  onListScroll(): void {
    this.ngZone.runOutsideAngular(() => setTimeout(() => {
      const el = this.scrollRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 300));
  }

  SidebarHide(): void { document.querySelector('.user-chat')?.classList.remove('user-chat-show'); }
  onChatInfoClicked(content: TemplateRef<any>): void { this.offcanvas.open(content, { position: 'end' }); }

  ContactSearch(): void {
    const filter = (document.getElementById('searchContact') as HTMLInputElement)?.value.toUpperCase() || '';
    document.querySelectorAll('.chat-user-list').forEach((ul: any) => {
      Array.from(ul.getElementsByTagName('li')).forEach((li: any) => {
        li.style.display = (li.getElementsByTagName('p')[0]?.innerText || '').toUpperCase().includes(filter) ? '' : 'none';
      });
    });
  }

  MessageSearch(): void {
    const filter = (document.getElementById('searchMessage') as HTMLInputElement)?.value.toUpperCase() || '';
    Array.from(document.getElementById('users-conversation')?.getElementsByTagName('li') || []).forEach((li: any) => {
      li.style.display = (li.getElementsByTagName('p')[0]?.innerText || '').toUpperCase().includes(filter) ? '' : 'none';
    });
  }

  replyMessage(event: any, align: any): void {
    const li = (event.target as HTMLElement).closest('.chat-list');
    if (!li) return;

    const msgId   = li.id?.replace('msg-', '') || '';
    const msgData = this.chatMessagesData.find((m: any) => m.id === msgId);
    if (!msgData) return;

    this.isreplyMessage = true;
    this.replyToMsg = {
      id:      msgData.id!,
      name:    msgData.name || (msgData.align === 'right' ? 'You' : this.username),
      message: msgData.type === 'image'    ? '📷 Photo'
             : msgData.type === 'audio'    ? '🎤 Voice message'
             : msgData.type === 'video'    ? '🎥 Video'
             : msgData.type === 'file'     ? '📎 ' + (msgData.fileName || 'File')
             : msgData.type === 'location' ? '📍 Location'
             : (msgData.message || ''),
      type: msgData.type,
    };
    this.cdr.markForCheck();

    setTimeout(() => {
      document.querySelector<HTMLInputElement>('#chat-input')?.focus();
    }, 50);
  }

  closeReplay(): void {
    this.isreplyMessage = false;
    this.replyToMsg     = null;
    this.cdr.markForCheck();
  }

  copyMessage(event: any): void {
    navigator.clipboard.writeText(event.target.closest('.chat-list')?.querySelector('.ctext-content')?.innerHTML || '');
    const alertEl = document.getElementById('copyClipBoard') as HTMLElement;
    if (alertEl) { alertEl.style.display = 'block'; setTimeout(() => alertEl.style.display = 'none', 1000); }
  }

  // ── Supprimer UN message (appel API + broadcast WS) ──
  deleteMessage(event: any): void {
    const li = event.target.closest('.chat-list');
    const msgId = li?.id?.replace('msg-', '');
    if (!msgId || msgId.startsWith('local_')) { li?.remove(); return; }

    this.chatApi.deleteMessage(msgId).subscribe({
      next: () => this.ngZone.run(() => {
        this.chatMessagesData = this.chatMessagesData.filter((m: any) => m.id !== msgId);
        this.cdr.markForCheck();
      }),
      error: e => console.error('deleteMessage error:', e)
    });
  }

  // ── Supprimer TOUS les messages de la room ──
  deleteAllMessage(event: any): void {
    if (!this.currentChatRoomId) return;
    if (!confirm('Supprimer tous les messages de cette conversation ?')) return;

    this.chatApi.deleteAllMessages(this.currentChatRoomId).subscribe({
      next: () => this.ngZone.run(() => {
        this.chatMessagesData = [];
        this.cdr.markForCheck();
      }),
      error: e => console.error('deleteAllMessages error:', e)
    });
  }

  // ── État d'édition ──
  editingMsgId: string | null = null;
  editingText   = '';
  private _editJustOpened = false;

  startEdit(msg: any): void {
    if (!msg.id || msg.id.startsWith('local_') || msg.id.startsWith('call_')) return;
    if (String(msg.senderId).trim() !== String(this.currentUserId).trim()) return;
    this.editingMsgId = msg.id;
    this.editingText  = msg.message || '';
    this._editJustOpened = true; // prevent immediate cancelEdit from onDocumentClick
    this.cdr.markForCheck();
    // Focus after render — use requestAnimationFrame for reliability with OnPush
    requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>('.edit-input');
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    });
  }

  cancelEdit(): void {
    this.editingMsgId = null;
    this.editingText  = '';
    this.cdr.markForCheck();
  }

  saveEdit(msg: any): void {
    const newText = this.editingText.trim();
    // Nothing changed or empty → just cancel
    if (!newText || newText === (msg.message || '').trim()) {
      this.cancelEdit();
      return;
    }

    const msgId = msg.id;

    // ✅ Optimistic update — update UI immediately before API call
    this.chatMessagesData = this.chatMessagesData.map((m: any) =>
      m.id === msgId ? { ...m, message: newText, edited: true } : m
    );
    this.editingMsgId = null;
    this.editingText  = '';
    this.cdr.markForCheck();

    // Persist to backend
    this.chatApi.editMessage(msgId, newText).subscribe({
      next: (updated: any) => this.ngZone.run(() => {
        // Confirm with server response (in case backend transforms the text)
        if (updated?.message) {
          this.chatMessagesData = this.chatMessagesData.map((m: any) =>
            m.id === msgId ? { ...m, message: updated.message, edited: true } : m
          );
          this.cdr.markForCheck();
        }
      }),
      error: (e: any) => {
        console.error('editMessage error:', e);
        // Rollback on error
        this.ngZone.run(() => {
          this.chatMessagesData = this.chatMessagesData.map((m: any) =>
            m.id === msgId ? { ...m, message: msg.message, edited: msg.edited ?? false } : m
          );
          this.cdr.markForCheck();
        });
      }
    });
  }

  delete(event: any): void { event.target.closest('li')?.remove(); }
  open(index: number): void { this.lightbox.open(this.images, index, {}); }
  onFocus(): void {}
  onBlur():  void {}
}
