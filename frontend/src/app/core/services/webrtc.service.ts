// ================================================================
// webrtc.service.ts — Appels vidéo/audio WebRTC temps réel
// ✅ FIXES:
// 1. _startTimer() → chaque tick dans ngZone.run() pour OnPush
// 2. answerCall() → tout dans ngZone.run() garanti
// 3. _cleanup() → ngZone.run() garanti
// ================================================================

import { Injectable, NgZone } from '@angular/core';
import { Subject }            from 'rxjs';
import { AuthService }        from './auth.service';
import { ChatWsService }      from './chat-ws.service';

export type CallType   = 'video' | 'audio';
export type CallState  = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface CallEvent {
  type:      'incoming' | 'answered' | 'rejected' | 'ended' | 'connected';
  from?:     string;
  fromName?: string;
  callType?: CallType;
  duration?: number;
  chatRoomId?: string;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

@Injectable({ providedIn: 'root' })
export class WebRtcService {

  // ── Streams ──────────────────────────────────────────
  localStream?:  MediaStream;
  remoteStream?: MediaStream;

  // ── State ────────────────────────────────────────────
  callState:   CallState = 'idle';
  callType:    CallType  = 'video';
  remoteId     = '';
  remoteName   = '';
  chatRoomId   = '';
  isMuted      = false;
  isCamOff     = false;
  callDuration = 0;
  private _durationTimer?: ReturnType<typeof setInterval>;

  // ── Observables ──────────────────────────────────────
  readonly callEvent$    = new Subject<CallEvent>();
  readonly remoteStream$ = new Subject<MediaStream>();
  readonly stateChange$  = new Subject<CallState>();

  private pc?: RTCPeerConnection;
  private chatWs?: ChatWsService;
  private myId = '';

  /** Deduplication: track recently-processed signal keys to avoid double-handling
   *  when the same signal arrives via both /topic/user/{id} and /topic/room/{roomId} */
  private _processedSignals = new Set<string>();

  constructor(private auth: AuthService, private ngZone: NgZone) {
    // ✅ Initialiser myId dès la création du service
    this.myId = this.auth.getUserId();
  }

  // ─────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────

  init(chatWsService: ChatWsService): void {
    this.chatWs = chatWsService;
    if (!this.myId) this.myId = this.auth.getUserId();
    console.log('[WebRTC] ✅ init avec myId =', this.myId);
    // ✅ S'abonner au canal personnel via ChatWsService (méthode fiable)
    if (this.myId) {
      this.chatWs.subscribeToTopic(`/topic/user/${this.myId}`, (frame: any) => {
        this.ngZone.run(() => this._handleSignal(JSON.parse(frame.body)));
      });
      console.log('[WebRTC] 📡 abonnement à /topic/user/', this.myId);
    }
  }

  /**
   * Appelé par chat.ts depuis subscribeToRoom() quand un signal WebRTC arrive.
   * Filtre par `to` pour ignorer les signaux destinés à l'autre participant.
   */
  handleRoomSignal(msg: any): void {
    if (!['CALL_OFFER','CALL_ANSWER','CALL_ICE','CALL_END'].includes(msg.event)) return;

    // ✅ Rafraîchir myId si vide
    if (!this.myId) this.myId = this.auth.getUserId();

    // ✅ Filtrer : ignorer les signaux pas destinés à nous
    // Mais si myId est vide, accepter quand même (évite de bloquer)
    if (this.myId && msg.to && String(msg.to) !== String(this.myId)) {
      return; // signal pour l'autre participant
    }

    console.log('[WebRTC] 📨 signal reçu via room:', msg.event, '| from=', msg.from, '| myId=', this.myId);
    this.ngZone.run(() => this._handleSignal(msg));
  }

  // ─────────────────────────────────────────────────────
  // INITIER UN APPEL
  // ─────────────────────────────────────────────────────

  async startCall(targetId: string, targetName: string, type: CallType, chatRoomId = ''): Promise<void> {
    if (!this.myId) {
      this.myId = this.auth.getUserId();
    }
    this.callType   = type;
    this.remoteId   = targetId;
    this.remoteName = targetName;
    this.chatRoomId = chatRoomId;

    this.ngZone.run(() => this._setState('calling'));

    await this._getLocalMedia(type);
    this._createPeerConnection();

    const offer = await this.pc!.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: type === 'video',
    });
    await this.pc!.setLocalDescription(offer);

    console.log('[WebRTC] 📞 startCall from=', this.myId, 'to=', targetId, 'room=', chatRoomId);
    this._send('/app/call.offer', {
      from:       this.myId,
      to:         targetId,
      type,
      sdp:        offer.sdp,
      fromName:   this.auth.getUserName(),
      chatRoomId: chatRoomId,
      roomId:     chatRoomId,   // ✅ pour le routing côté backend
    });
  }

  // ─────────────────────────────────────────────────────
  // RÉPONDRE À UN APPEL
  // ─────────────────────────────────────────────────────

  async answerCall(remoteSdp: string): Promise<void> {
    await this._getLocalMedia(this.callType);
    this._createPeerConnection();

    await this.pc!.setRemoteDescription({ type: 'offer', sdp: remoteSdp });
    const answer = await this.pc!.createAnswer();
    await this.pc!.setLocalDescription(answer);

    this._send('/app/call.answer', {
      from:       this.myId,
      to:         this.remoteId,
      sdp:        answer.sdp,
      chatRoomId: this.chatRoomId,   // ✅ nécessaire pour le routing via room
    });
    console.log('[WebRTC] ✅ answerCall sent from=', this.myId, 'to=', this.remoteId, 'room=', this.chatRoomId);

    // ✅ FIX: tout dans ngZone.run() pour que Angular OnPush détecte immédiatement
    this.ngZone.run(() => {
      this._setState('connected');
      this._startTimer();
      this.callEvent$.next({ type: 'answered' });
    });
  }

  // ─────────────────────────────────────────────────────
  // REFUSER / TERMINER
  // ─────────────────────────────────────────────────────

  rejectCall(): void {
    const dur  = this.callDuration;
    const room = this.chatRoomId;
    this._send('/app/call.end', { from: this.myId, to: this.remoteId, reason: 'rejected', chatRoomId: room });
    this._cleanup();
    this.callEvent$.next({ type: 'rejected', duration: dur, chatRoomId: room });
  }

  endCall(): void {
    const dur  = this.callDuration;
    const room = this.chatRoomId;
    this._send('/app/call.end', { from: this.myId, to: this.remoteId, reason: 'ended', duration: dur, chatRoomId: room });
    this._cleanup();
    this.callEvent$.next({ type: 'ended', duration: dur, chatRoomId: room });
  }

  // ─────────────────────────────────────────────────────
  // CONTRÔLES EN COURS D'APPEL
  // ─────────────────────────────────────────────────────

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.localStream?.getAudioTracks().forEach(t => t.enabled = !this.isMuted);
  }

  toggleCamera(): void {
    this.isCamOff = !this.isCamOff;
    this.localStream?.getVideoTracks().forEach(t => t.enabled = !this.isCamOff);
  }

  // ─────────────────────────────────────────────────────
  // GESTION DES SIGNAUX ENTRANTS
  // ─────────────────────────────────────────────────────

  private _handleSignal(msg: any): void {
    console.log('[WebRTC] 📨 signal reçu:', msg.event, '| from=', msg.from, '| to=', msg.to, '| myId=', this.myId);

    // ✅ Deduplication: ignore signals already processed (can arrive via both
    // /topic/user/{id} and /topic/room/{roomId} simultaneously)
    const sigKey = `${msg.event}:${msg.from}:${msg.to}:${msg.sdp?.slice(0, 20) ?? msg.candidate?.candidate?.slice(0, 20) ?? ''}`;
    if (this._processedSignals.has(sigKey)) {
      console.log('[WebRTC] ⏭ signal dupliqué ignoré:', msg.event);
      return;
    }
    this._processedSignals.add(sigKey);
    // Auto-clean after 10 seconds to avoid memory leak
    setTimeout(() => this._processedSignals.delete(sigKey), 10_000);

    switch (msg.event) {

      case 'CALL_OFFER':
        this.remoteId   = msg.from;
        this.remoteName = (msg.fromName && msg.fromName !== 'Utilisateur Inconnu')
                            ? msg.fromName
                            : (msg.from || '?');
        this.callType   = msg.type || 'video';
        if (msg.chatRoomId) this.chatRoomId = msg.chatRoomId;
        this._setState('ringing');
        (this as any)._pendingSdp = msg.sdp;
        this.callEvent$.next({
          type:     'incoming',
          from:     msg.from,
          fromName: this.remoteName,
          callType: this.callType,
        });
        break;

      case 'CALL_ANSWER':
        if (this.pc) {
          this.pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp })
            .then(() => {
              this.ngZone.run(() => {
                this._setState('connected');
                this._startTimer();
                this.callEvent$.next({ type: 'connected' });
              });
            })
            .catch(err => {
              console.error('setRemoteDescription error:', err);
              this.ngZone.run(() => {
                this._setState('connected');
                this._startTimer();
                this.callEvent$.next({ type: 'connected' });
              });
            });
        } else {
          this.ngZone.run(() => {
            this._setState('connected');
            this._startTimer();
            this.callEvent$.next({ type: 'connected' });
          });
        }
        break;

      case 'CALL_ICE':
        if (this.pc && msg.candidate) {
          this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
        }
        break;

      case 'CALL_END':
        {
          const dur  = (msg.duration != null && msg.duration > 0)
                         ? msg.duration
                         : this.callDuration;
          const room = this.chatRoomId;
          this._cleanup();
          this.callEvent$.next({
            type:       msg.reason === 'rejected' ? 'rejected' : 'ended',
            duration:   dur,
            chatRoomId: room,
          });
        }
        break;
    }
  }

  // ─────────────────────────────────────────────────────
  // HELPERS PRIVÉS
  // ─────────────────────────────────────────────────────

  get pendingSdp(): string { return (this as any)._pendingSdp || ''; }

  private async _getLocalMedia(type: CallType): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720 } : false,
      });
    } catch {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
  }

  private _createPeerConnection(): void {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.localStream?.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

    this.remoteStream = new MediaStream();
    this.pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach(t => this.remoteStream!.addTrack(t));
      this.remoteStream$.next(this.remoteStream!);
    };

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this._send('/app/call.ice', {
          from:       this.myId,
          to:         this.remoteId,
          candidate:  e.candidate.toJSON(),
          chatRoomId: this.chatRoomId,
        });
      }
    };

    // ✅ FIX DÉFINITIF: utiliser onconnectionstatechange pour détecter
    // la connexion réelle — indépendant du signaling CALL_ANSWER
    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      console.log('[WebRTC] 🔗 connectionState =', state);
      this.ngZone.run(() => {
        if (state === 'connected') {
          // Les deux côtés passent à 'connected' quand WebRTC est établi
          if (this.callState !== 'connected') {
            this._setState('connected');
            if (this.callDuration === 0) this._startTimer();
            this.callEvent$.next({ type: 'connected' });
          }
        } else if (state === 'disconnected' || state === 'failed') {
          this._cleanup();
          this.callEvent$.next({ type: 'ended' });
        }
      });
    };

    // ✅ Aussi écouter iceConnectionState comme fallback
    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc?.iceConnectionState;
      console.log('[WebRTC] 🧊 iceConnectionState =', state);
      if (state === 'connected' || state === 'completed') {
        this.ngZone.run(() => {
          if (this.callState !== 'connected') {
            this._setState('connected');
            if (this.callDuration === 0) this._startTimer();
            this.callEvent$.next({ type: 'connected' });
          }
        });
      }
    };
  }

  private _send(dest: string, body: object): void {
    this.chatWs?.publish(dest, body);
  }

  private _setState(s: CallState): void {
    this.callState = s;
    this.stateChange$.next(s);
  }

  // ✅ FIX PRINCIPAL : chaque tick du setInterval dans ngZone.run()
  // → Angular OnPush détecte le changement de callDuration côté appelé (karim)
  private _startTimer(): void {
    this.callDuration = 0;
    this._durationTimer = setInterval(() => {
      this.ngZone.run(() => {
        this.callDuration++;
        this.stateChange$.next(this.callState);
      });
    }, 1000);
  }

  private _cleanup(): void {
    clearInterval(this._durationTimer);
    this.pc?.close();
    this.pc = undefined;
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream  = undefined;
    this.remoteStream = undefined;
    this.callDuration = 0;
    this.isMuted      = false;
    this.isCamOff     = false;
    this._processedSignals.clear();
    this.ngZone.run(() => this._setState('idle'));
  }

  formatDuration(s: number): string {
    const m   = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }
}