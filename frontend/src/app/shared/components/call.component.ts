// ================================================================
// call.component.ts — Overlay appel vidéo/audio WebRTC
// ✅ FIXES:
// 1. stateChange$.subscribe → cdr.markForCheck() à chaque émission
// 2. callEvent$.subscribe   → cdr.markForCheck() à chaque émission
// 3. Les deux fixes garantissent que le template OnPush se met à jour
//    côté appelé (karim) : timer visible + état 'connected' affiché
// ================================================================

import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef, NgZone, ElementRef, ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WebRtcService, CallType } from '../../core/services/webrtc.service';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    /* ── Overlay appel entrant ── */
    .incoming-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.65);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .25s ease;
    }
    .incoming-card {
      background: #1a1f36;
      border-radius: 24px;
      padding: 36px 40px;
      text-align: center;
      min-width: 300px;
      box-shadow: 0 32px 80px rgba(0,0,0,.5);
      animation: slideUp .3s cubic-bezier(.34,1.56,.64,1);
    }
    .caller-avatar {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg,#405189,#0ab39c);
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; font-weight: 700; color: #fff;
      margin: 0 auto 16px;
      box-shadow: 0 0 0 6px rgba(10,179,156,.25);
      animation: ring-pulse 1.5s infinite;
    }
    @keyframes ring-pulse {
      0%,100% { box-shadow: 0 0 0 6px rgba(10,179,156,.25); }
      50%      { box-shadow: 0 0 0 14px rgba(10,179,156,.05); }
    }
    .caller-name { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .call-type-label { font-size: 14px; color: #94a3b8; margin-bottom: 32px; }
    .call-actions { display: flex; justify-content: center; gap: 32px; }
    .btn-reject, .btn-accept {
      width: 64px; height: 64px; border-radius: 50%; border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; cursor: pointer; transition: transform .15s, opacity .15s;
    }
    .btn-reject  { background: #f06548; color: #fff; }
    .btn-accept  { background: #0ab39c; color: #fff; }
    .btn-reject:hover, .btn-accept:hover { transform: scale(1.1); opacity: .9; }

    /* ── Fenêtre appel en cours ── */
    .call-window {
      position: fixed; inset: 0; z-index: 9998;
      background: #0d1117;
      display: flex; flex-direction: column;
      animation: fadeIn .2s ease;
    }
    .call-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; flex-shrink: 0;
    }
    .call-peer-info { display: flex; align-items: center; gap: 12px; }
    .call-peer-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg,#405189,#0ab39c);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; color: #fff;
    }
    .call-peer-name { font-size: 16px; font-weight: 600; color: #fff; }
    .call-duration  { font-size: 13px; color: #94a3b8; font-variant-numeric: tabular-nums; }
    .call-status-badge {
      font-size: 12px; padding: 4px 12px; border-radius: 20px;
      background: rgba(10,179,156,.15); color: #0ab39c; font-weight: 600;
    }

    /* ── Vidéos ── */
    .videos-area {
      flex: 1; position: relative; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }
    .remote-video {
      width: 100%; height: 100%; object-fit: cover;
      background: #1a1f36;
    }
    .local-video {
      position: absolute; bottom: 16px; right: 16px;
      width: 160px; height: 100px; border-radius: 12px;
      object-fit: cover; border: 2px solid rgba(255,255,255,.2);
      background: #0d1117; cursor: move;
      box-shadow: 0 4px 16px rgba(0,0,0,.4);
    }
    .audio-only-bg {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: linear-gradient(135deg,#1a1f36,#0d1117);
      gap: 16px;
    }
    .audio-avatar {
      width: 120px; height: 120px; border-radius: 50%;
      background: linear-gradient(135deg,#405189,#0ab39c);
      display: flex; align-items: center; justify-content: center;
      font-size: 48px; font-weight: 700; color: #fff;
      animation: audio-pulse 2s infinite;
    }
    @keyframes audio-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(10,179,156,.4); }
      50%      { box-shadow: 0 0 0 24px rgba(10,179,156,.0); }
    }
    .audio-name { font-size: 24px; font-weight: 700; color: #fff; }
    .audio-status { font-size: 14px; color: #94a3b8; }

    /* ── Contrôles ── */
    .call-controls {
      display: flex; justify-content: center; align-items: center;
      gap: 20px; padding: 24px; flex-shrink: 0;
      background: linear-gradient(transparent, rgba(0,0,0,.6));
    }
    .ctrl-btn {
      width: 56px; height: 56px; border-radius: 50%; border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; cursor: pointer;
      transition: transform .15s, background .15s;
      background: rgba(255,255,255,.12); color: #fff;
    }
    .ctrl-btn:hover { transform: scale(1.1); background: rgba(255,255,255,.2); }
    .ctrl-btn.active { background: rgba(255,255,255,.9); color: #1a1f36; }
    .ctrl-btn.danger { background: #f06548; }
    .ctrl-btn.danger:hover { background: #e53e3e; }

    /* ── Calling screen ── */
    .calling-screen {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 20px;
    }
    .calling-avatar {
      width: 100px; height: 100px; border-radius: 50%;
      background: linear-gradient(135deg,#405189,#0ab39c);
      display: flex; align-items: center; justify-content: center;
      font-size: 40px; font-weight: 700; color: #fff;
      animation: ring-pulse 1.5s infinite;
    }
    .calling-name   { font-size: 26px; font-weight: 700; color: #fff; }
    .calling-status { font-size: 15px; color: #94a3b8; }
    .calling-dots span {
      display: inline-block; width: 6px; height: 6px;
      border-radius: 50%; background: #94a3b8; margin: 0 2px;
      animation: typing-bounce 1.4s infinite ease-in-out;
    }
    .calling-dots span:nth-child(2) { animation-delay: .2s; }
    .calling-dots span:nth-child(3) { animation-delay: .4s; }
    @keyframes typing-bounce {
      0%,80%,100% { transform: translateY(0); }
      40%          { transform: translateY(-8px); }
    }

    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
  `],
  template: `
    <!-- ══ APPEL ENTRANT ══ -->
    @if(svc.callState === 'ringing'){
      <div class="incoming-overlay">
        <div class="incoming-card">
          <div class="caller-avatar">{{ initial }}</div>
          <div class="caller-name">{{ svc.remoteName }}</div>
          <div class="call-type-label">
            {{ svc.callType === 'video' ? '📹 Appel vidéo entrant' : '📞 Appel audio entrant' }}
          </div>
          <div class="call-actions">
            <button class="btn-reject" (click)="reject()" title="Refuser">
              <i class="ri-phone-off-fill"></i>
            </button>
            <button class="btn-accept" (click)="answer()" title="Répondre">
              <i class="ri-phone-fill"></i>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══ FENÊTRE D'APPEL ══ -->
    @if(svc.callState === 'calling' || svc.callState === 'connected'){
      <div class="call-window">

        <!-- Header -->
        <div class="call-header">
          <div class="call-peer-info">
            <div class="call-peer-avatar">{{ initial }}</div>
            <div>
              <div class="call-peer-name">{{ svc.remoteName }}</div>
              @if(svc.callState === 'connected'){
                <div class="call-duration">{{ svc.formatDuration(svc.callDuration) }}</div>
              }
            </div>
          </div>
          <span class="call-status-badge">
            {{ svc.callState === 'connected' ? '🟢 En cours' : '⏳ Appel en cours...' }}
          </span>
        </div>

        <!-- Zone vidéo / audio -->
        <div class="videos-area">
          @if(svc.callState === 'calling'){
            <div class="calling-screen">
              <div class="calling-avatar">{{ initial }}</div>
              <div class="calling-name">{{ svc.remoteName }}</div>
              <div class="calling-status">
                Appel {{ svc.callType === 'video' ? 'vidéo' : 'audio' }}
                <span class="calling-dots">
                  <span></span><span></span><span></span>
                </span>
              </div>
            </div>
          }

          @if(svc.callState === 'connected'){
            @if(svc.callType === 'video'){
              <video #remoteVideo class="remote-video" autoplay playsinline></video>
              <video #localVideo  class="local-video"  autoplay playsinline muted></video>
            }@else{
              <div class="audio-only-bg">
                <div class="audio-avatar">{{ initial }}</div>
                <div class="audio-name">{{ svc.remoteName }}</div>
                <div class="audio-status">{{ svc.formatDuration(svc.callDuration) }}</div>
                <audio #remoteAudio autoplay></audio>
              </div>
            }
          }
        </div>

        <!-- Contrôles -->
        <div class="call-controls">
          <!-- Micro -->
          <button class="ctrl-btn" [class.active]="svc.isMuted"
                  (click)="toggleMute()" [title]="svc.isMuted ? 'Activer micro' : 'Couper micro'">
            <i [class]="svc.isMuted ? 'ri-mic-off-line' : 'ri-mic-line'"></i>
          </button>

          <!-- Caméra (vidéo seulement) -->
          @if(svc.callType === 'video'){
            <button class="ctrl-btn" [class.active]="svc.isCamOff"
                    (click)="toggleCam()" [title]="svc.isCamOff ? 'Activer caméra' : 'Couper caméra'">
              <i [class]="svc.isCamOff ? 'ri-camera-off-line' : 'ri-camera-line'"></i>
            </button>
          }

          <!-- Raccrocher -->
          <button class="ctrl-btn danger" (click)="end()" title="Raccrocher">
            <i class="ri-phone-off-fill"></i>
          </button>
        </div>

      </div>
    }
  `
})
export class CallComponent implements OnInit, OnDestroy {

  @ViewChild('remoteVideo') remoteVideoEl?: ElementRef<HTMLVideoElement>;
  @ViewChild('localVideo')  localVideoEl?:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteAudio') remoteAudioEl?: ElementRef<HTMLAudioElement>;

  private subs: Subscription[] = [];

  constructor(
    public  svc: WebRtcService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  get initial(): string {
    return (this.svc.remoteName || '?').charAt(0).toUpperCase();
  }

  ngOnInit(): void {
    this.subs.push(

      // ✅ FIX PRINCIPAL : markForCheck() à chaque changement d'état
      // → côté karim (appelé, OnPush), le template se met à jour immédiatement
      // → le timer s'affiche dès que callState passe à 'connected'
      this.svc.stateChange$.subscribe(state => {
        this.cdr.markForCheck(); // ← FIX : était absent, causait le freeze côté appelé

        if (state === 'connected') {
          setTimeout(() => {
            if (this.svc.remoteStream) this._attachStreams(this.svc.remoteStream);
          }, 100);
        }
      }),

      // ✅ FIX : markForCheck() aussi sur les événements d'appel
      this.svc.callEvent$.subscribe(() => {
        this.cdr.markForCheck(); // ← FIX : était un no-op, maintenant force le rendu
      }),

      this.svc.remoteStream$.subscribe(stream => {
        setTimeout(() => this._attachStreams(stream), 50);
      })
    );
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  answer(): void     { this.svc.answerCall(this.svc.pendingSdp); }
  reject(): void     { this.svc.rejectCall(); }
  end(): void        { this.svc.endCall(); }
  toggleMute(): void { this.svc.toggleMute();   this.cdr.markForCheck(); }
  toggleCam():  void { this.svc.toggleCamera(); this.cdr.markForCheck(); }

  private _attachStreams(remote: MediaStream): void {
    if (this.remoteVideoEl?.nativeElement) {
      this.remoteVideoEl.nativeElement.srcObject = remote;
    }
    if (this.remoteAudioEl?.nativeElement) {
      this.remoteAudioEl.nativeElement.srcObject = remote;
    }
    if (this.localVideoEl?.nativeElement && this.svc.localStream) {
      this.localVideoEl.nativeElement.srcObject = this.svc.localStream;
    }
  }
}