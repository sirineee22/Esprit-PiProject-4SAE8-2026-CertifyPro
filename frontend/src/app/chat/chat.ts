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

interface EmojiCategory { id: string; label: string; icon: string; emojis: string[]; }

const EMOJI_CATEGORIES: EmojiCategory[] = [
  { id: 'recent', label: 'Récents', icon: '🕐', emojis: [] },
  {
    id: 'smileys', label: 'Smileys & Personnes', icon: '😀',
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
    id: 'nature', label: 'Animaux & Nature', icon: '🐶',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵',
      '🙈','🙉','🙊','🐒','🦆','🐧','🐦','🐤','🦅','🦉','🦇','🐺','🐗','🐴','🦄',
      '🐝','🦋','🐌','🐞','🐜','🐢','🐍','🦎','🐙','🐡','🐠','🐟','🐬','🐳','🦈',
      '🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🌺','🌻','🌹','🌷','🌼','🌸',
      '💐','🍄','🌈','⭐','🌟','💫','⚡','🔥','💧','🌊',
    ]
  },
  {
    id: 'food', label: 'Nourriture & Boissons', icon: '🍔',
    emojis: [
      '🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍒','🍑','🥭','🍍','🥥','🥝','🍅',
      '🍆','🥑','🥦','🥒','🌶️','🌽','🍕','🍔','🍟','🌭','🥪','🥙','🌮','🌯','🍝',
      '🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍧','🍨','🍦','🧁','🍰','🎂',
      '🍭','🍬','🍫','🍿','🍩','🍪','☕','🍵','🥤','🍺','🍻','🥂','🍷','🥃','🍸',
    ]
  },
  {
    id: 'symbols', label: 'Symboles', icon: '❤️',
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
     NotificationBellComponent
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
  isreplyMessage  = false;
  showEmojiPicker = false;
  isFlag          = false;
  private _emojiJustOpened  = false;

  emojiCategories:    EmojiCategory[] = EMOJI_CATEGORIES;
  activeCategoryId    = 'smileys';
  activeCategoryLabel = 'Smileys & Personnes';
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
  selectedMembers: string[] = [];
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
        else if (names.length === 1) this.typingText = `${names[0]} est en train d'écrire...`;
        else if (names.length === 2) this.typingText = `${names[0]} et ${names[1]} écrivent...`;
        else                         this.typingText = `${names.length} personnes écrivent...`;
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
    private notifSvc:     NotificationService,   // ← AJOUTER

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
    this.currentUserProfile = this.auth.getUserImage();

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
    this.notifSvc.init();                          // ← AJOUTER

    setTimeout(() => this.subscribeToNotifications(), 1200);
  }

  ngAfterViewInit(): void { this.onListScroll(); }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.recordingTimer$?.unsubscribe();
    this.typingSub?.unsubscribe();
    this.readSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.searchDestroy$.next();
    this.searchDestroy$.complete();
    clearTimeout(this.typingTimeout);
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
    this.isProfile = this.isValidImageUrl(user.image) ? user.image! : '';
    this._openConversation(user.roomId);
    document.querySelector('.user-chat')?.classList.add('user-chat-show');
  }

  openContact(userId: string, name: string, profile?: string): void {
    if (!userId) return;
    this.isFlag    = true;
    this.username  = name;
    this.isStatus  = 'online';
    this.isProfile = this.isValidImageUrl(profile) ? profile! : '';
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
          return {
            ...msg,
            align:     isMyMsg ? 'right' : 'left',
            profile:   this.isValidImageUrl(msg.profile) ? msg.profile : null,
            type:      msg.type ?? 'text',
            reactions: msg.reactions || [],
            readBy:    new Set<string>(msg.readBy || []),
          };
        });
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
          // ✅ FIX : align toujours recalculé APRÈS le spread pour écraser la valeur du backend
          align:     String(msg.senderId).trim() === String(this.currentUserId).trim() ? 'right' : 'left',
          profile:   this.isValidImageUrl(msg.profile) ? msg.profile : null,
          type:      msg.type ?? 'text',
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

    this.chatWs.sendMessage({
      chatRoomId: this.currentChatRoomId,
      senderId:   this.currentUserId,
      name:       this.currentUserName,
      profile:    this.currentUserProfile,
      message,
      align:      'right',
    });

    this.formData.reset();
    this.showMentionList    = false;
    this.mentionSuggestions = [];
    document.querySelector('.replyCard')?.classList.remove('show');
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════
  // CLICK OUTSIDE
  // ══════════════════════════════════════════════════════

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (this._emojiJustOpened) { this._emojiJustOpened = false; }
    else if (this.showEmojiPicker && !target.closest('#emoji-btn') && !target.closest('.custom-emoji-picker-wrapper')) {
      this.showEmojiPicker = false;
    }

    if (this._attachJustOpened) { this._attachJustOpened = false; }
    else if (this.showAttachMenu && !target.closest('#attach-btn') && !target.closest('.attach-menu')) {
      this.showAttachMenu = false;
    }

    if (this.showReactionPickerForMsgId && !target.closest('.reaction-picker') && !target.closest('.reaction-trigger')) {
      this.showReactionPickerForMsgId = null;
    }

    if (this.showMentionList && !target.closest('.mention-list') && !target.closest('#chat-input')) {
      this.showMentionList = false;
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
      this.activeCategoryLabel = 'Résultats';
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
        time:       new Date().toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }),
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
    const a = document.createElement('a');
    a.href = url; a.download = name; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
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
    } catch { alert('Microphone non accessible. Vérifiez les permissions.'); }
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
      profile: this.currentUserProfile, message: 'Message vocal',
      time: new Date().toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }),
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
    if (!navigator.geolocation) { alert('Géolocalisation non supportée.'); return; }
    this.isSendingLocation = true; this.cdr.markForCheck();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.ngZone.run(() => {
          this.isSendingLocation = false;
          const mapsUrl  = `https://www.google.com/maps?q=${latitude},${longitude}`;
          const mapThumb = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=15&size=300x150&markers=${latitude},${longitude},red`;
          const localMsg: any = {
            id: 'local_' + Date.now(), chatRoomId: this.currentChatRoomId,
            senderId: this.currentUserId, name: this.currentUserName,
            profile: this.currentUserProfile,
            message: `📍 Ma position (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            time: new Date().toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }),
            align: 'right', type: 'location', latitude, longitude,
            locationUrl: mapsUrl, mapThumb, reactions: []
          };
          this.chatMessagesData = [...this.chatMessagesData, localMsg];
          this.cdr.markForCheck(); this.onListScroll();
          this.chatApi.sendLocation({
            chatRoomId: this.currentChatRoomId, senderId: this.currentUserId,
            name: this.currentUserName, profile: this.currentUserProfile, latitude, longitude
          }).subscribe();
        });
      },
      () => this.ngZone.run(() => { this.isSendingLocation = false; this.cdr.markForCheck(); alert('Position non disponible.'); }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  openInMaps(url?: string): void { if (url) window.open(url, '_blank'); }

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

  loadUsers():    void { this.chatApi.getUsers().subscribe({ next: u => this.ngZone.run(() => { this.chatData = u; this.cdr.markForCheck(); }) }); }
  loadGroups():   void { this.chatApi.getGroups().subscribe({ next: g => this.ngZone.run(() => { this.groupData = g; this.cdr.markForCheck(); }) }); }
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
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://') ||
           url.startsWith('/assets/') || url.startsWith('assets/') ||
           url.startsWith('data:image/') || url.startsWith('blob:');
  }

  openAddContactModal(): void {
    this.contactSubmitted = false; this.contactError = ''; this.isSearching = false;
    this.searchResults = []; this.selectedUser = null; this.selectedUserId = '';
    this.searchControl.setValue('', { emitEvent: false });
    this.addContactForm = this.formBuilder.group({ targetUserId: [''] });
    this.modalService.open(this.addContactModal, { centered: true, backdrop: 'static', size: 'md' });
  }

  selectUser(user: any): void {
    const id   = (user.id || user._id || user.userId || '').toString().trim();
    const name = user.name?.trim() || user.username?.trim() || user.email || 'Utilisateur';
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
      error: (e) => { this.isLoadingContact = false; this.contactError = e?.error?.message || 'Utilisateur introuvable.'; this.cdr.markForCheck(); }
    });
  }

  get acf() { return this.addContactForm.controls; }

  openNewMessageModal(): void {
    this.msgSubmitted = false; this.msgError = ''; this.newMessageForm.reset();
    this.modalService.open(this.newMessageModal, { centered: true, backdrop: 'static', size: 'md' });
  }

  submitNewMessage(): void {
    this.msgSubmitted = true; this.msgError = '';
    if (this.newMessageForm.invalid) return;
    const recipientRoomId = this.newMessageForm.value.recipientRoomId;
    const messageText     = this.newMessageForm.value.message.trim();
    const recipient       = this.chatData.find(u => u.roomId === recipientRoomId);
    if (!recipient?.userId) { this.msgError = 'Destinataire introuvable.'; return; }
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
      error: (e) => { this.isLoadingMsg = false; this.msgError = e?.error?.message || 'Erreur.'; this.cdr.markForCheck(); }
    });
  }

  get nmf() { return this.newMessageForm.controls; }

  openCreateGroupModal(): void {
    this.groupSubmitted = false; this.groupError = ''; this.selectedMembers = [];
    this.createGroupForm.reset();
    this.modalService.open(this.createGroupModal, { centered: true, backdrop: 'static', size: 'lg' });
  }

  toggleMember(user: ChatUser): void {
    const idx = this.selectedMembers.indexOf(user.name);
    idx === -1 ? this.selectedMembers.push(user.name) : this.selectedMembers.splice(idx, 1);
  }
  isMemberSelected(user: ChatUser): boolean { return this.selectedMembers.includes(user.name); }

  submitCreateGroup(): void {
    this.groupSubmitted = true; this.groupError = '';
    if (this.createGroupForm.invalid || this.selectedMembers.length === 0) return;
    const groupName = this.createGroupForm.value.groupName.trim();
    this.isLoadingGroup = true;
    this.chatApi.createGroup(groupName, this.selectedMembers).subscribe({
      next: (room) => this.ngZone.run(() => {
        this.isLoadingGroup = false;
        const newGroup: GroupUser = { roomId: room.id, name: room.name || groupName, unread: '0' };
        this.groupData = [...this.groupData, newGroup];
        this.modalService.dismissAll(); this.selectedMembers = []; this.createGroupForm.reset();
        this.cdr.markForCheck(); this.openGroup(newGroup);
      }),
      error: (e) => this.ngZone.run(() => { this.isLoadingGroup = false; this.groupError = e?.error?.message || 'Erreur.'; this.cdr.markForCheck(); })
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
    this.isreplyMessage = true;
    document.querySelector('.replyCard')?.classList.add('show');
    const copyText = event.target.closest('.chat-list')?.querySelector('.ctext-content')?.innerHTML || '';
    const msgEl    = document.querySelector('.replyCard .replymessage-block .flex-grow-1 .mb-0') as HTMLElement;
    const nameEl   = document.querySelector('.replyCard .replymessage-block .flex-grow-1 .conversation-name') as HTMLElement;
    if (msgEl)  msgEl.innerHTML  = copyText;
    if (nameEl) nameEl.innerHTML = event.target.closest('.chat-list')?.classList.contains('right')
      ? 'You' : (document.querySelector('.username') as HTMLElement)?.innerHTML || '';
  }

  closeReplay(): void { document.querySelector('.replyCard')?.classList.remove('show'); this.isreplyMessage = false; }

  copyMessage(event: any): void {
    navigator.clipboard.writeText(event.target.closest('.chat-list')?.querySelector('.ctext-content')?.innerHTML || '');
    const alertEl = document.getElementById('copyClipBoard') as HTMLElement;
    if (alertEl) { alertEl.style.display = 'block'; setTimeout(() => alertEl.style.display = 'none', 1000); }
  }

  deleteMessage(event: any): void { event.target.closest('.chat-list')?.remove(); }
  deleteAllMessage(event: any): void {
    document.getElementById('users-conversation')?.querySelectorAll('.chat-list').forEach((el: any) => el.remove());
  }
  delete(event: any): void { event.target.closest('li')?.remove(); }
  open(index: number): void { this.lightbox.open(this.images, index, {}); }
  onFocus(): void {}
  onBlur():  void {}
}
