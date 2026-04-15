import { Component, Inject, PLATFORM_ID, AfterViewInit, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsApiService } from '../../services/events.api';
import { AuthService } from '../../../../core/auth/auth.service';
import { UserService } from '../../../users/services/users.api';
import { Event, FeedbackSuggestionResponse } from '../../../../shared/models/event.model';
import * as L from 'leaflet';
import jsPDF from 'jspdf';
import { EventChatbotComponent } from '../../components/event-chatbot/event-chatbot.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, EventChatbotComponent],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
})
export class EventDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  event: Event | null = null;
  registrationStatus: string = 'NONE';
  loading = true;
  error: string | null = null;
  registering = false;
  unregistering = false;
  deleting = false;
  feedbackSubmitting = false;
  feedbackError: string | null = null;
  feedbackDone = false;
  feedback = {
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    understood: true,
    rating: 4,
    whatNext: ''
  };
  nextSuggestion: FeedbackSuggestionResponse | null = null;

  private map: L.Map | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: EventsApiService,
    private auth: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  private getRouteParam(name: string): string | null {
    let r: ActivatedRoute | null = this.route;
    while (r) {
      const v = r.snapshot.paramMap.get(name);
      if (v) return v;
      r = r.parent;
    }
    return null;
  }

  ngOnInit(): void {
    const idRaw = this.getRouteParam('id');
    const id = idRaw ? +idRaw : NaN;
    if (!idRaw || Number.isNaN(id)) {
      this.router.navigate(['/events']);
      return;
    }
    this.load(id);
  }

  load(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.api.getById(id).subscribe({
      next: (e) => {
        this.event = e;
        this.loading = false;
        
        if (this.isLearner) {
          this.api.myRegistrations(true).subscribe({
            next: (list) => {
              const myReg = list.find(r => r.event.id === e.id);
              this.registrationStatus = this.normalizeRegistrationStatus(myReg?.status);
              this.cdr.detectChanges();
            },
            error: () => {
              this.registrationStatus = 'NONE';
              this.cdr.detectChanges();
            }
          });
        }
        
        if (this.event?.mode === 'ONSITE') {
          setTimeout(() => this.initMap(), 200);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Could not load event.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.event?.mode === 'ONSITE') this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(): void {
    if (!isPlatformBrowser(this.platformId) || !this.event || this.event.mode !== 'ONSITE') return;
    const mapContainer = document.getElementById('map');
    if (!mapContainer || this.map) return;
    const locString = this.event.location || 'Tunis, Lac 2';
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locString)}`)
      .then(res => res.json())
      .then(data => {
        let lat = 36.837, lon = 10.235;
        if (data?.[0]) { lat = parseFloat(data[0].lat); lon = parseFloat(data[0].lon); }
        if (this.map) return;
        this.map = L.map('map').setView([lat, lon], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        const icon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41]
        });
        L.marker([lat, lon], { icon }).addTo(this.map).bindPopup(`<b>${this.event?.title}</b>`).openPopup();
        this.cdr.detectChanges();
      })
      .catch(() => {
        if (!this.map) {
          this.map = L.map('map').setView([36.837, 10.235], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        }
        this.cdr.detectChanges();
      });
  }

  get user() { return this.auth.getCurrentUser(); }
  get roleName(): string { return (this.user?.role?.name || '').toUpperCase(); }
  get isLearner(): boolean { return this.roleName.includes('LEARNER'); }
  get isTrainer(): boolean { return this.roleName.includes('TRAINER'); }
  get isAdmin(): boolean { return this.roleName.includes('ADMIN'); }
  get canManageEvent(): boolean {
    if (!this.event || !this.user) return false;
    return this.isAdmin || (this.isTrainer && this.user.id === this.event.trainerId);
  }
  get isPastEvent(): boolean {
    return this.event?.dateEnd ? new Date(this.event.dateEnd).getTime() < Date.now() : false;
  }
  get canSubmitFeedback(): boolean {
    return this.isLearner && this.isPastEvent && (this.registrationStatus === 'ATTENDED' || this.registrationStatus === 'REGISTERED');
  }

  editEvent(): void {
    if (!this.event || !this.canManageEvent) return;
    this.router.navigate(['/events/create'], { queryParams: { edit: this.event.id } });
  }

  deleteEvent(): void {
    if (!this.event || !this.canManageEvent) return;
    if (!confirm('Supprimer définitivement cet événement ? Cette action est irréversible.')) return;
    this.deleting = true;
    this.cdr.detectChanges();
    this.api.delete(this.event.id).subscribe({
      next: () => {
        this.deleting = false;
        this.router.navigate(['/events'], { queryParams: { tab: 'my-events' } });
      },
      error: () => {
        this.deleting = false;
        this.cdr.detectChanges();
      }
    });
  }

  joinMeeting(): void {
    if (this.event?.meetingLink) window.open(this.event.meetingLink, '_blank');
  }

  register(): void {
    if (!this.event || !this.user) return;
    this.registering = true;
    this.cdr.detectChanges();

    this.api.register(this.event.id, { firstName: this.user.firstName, lastName: this.user.lastName }).subscribe({
      next: (res: any) => {
        // Handle PENDING as well as REGISTERED/WAITLISTED
        if (res?.status === 'WAITLISTED') {
          this.registrationStatus = 'WAITLISTED';
        } else if (res?.status === 'PENDING') {
          this.registrationStatus = 'PENDING';
        } else {
          this.registrationStatus = 'REGISTERED';
        }
        this.registering = false;
        this.load(this.event!.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.registering = false;
        this.cdr.detectChanges();
      }
    });
  }

  unregister(): void {
    if (!this.event) return;
    this.unregistering = true;
    this.cdr.detectChanges();

    this.api.unregister(this.event.id).subscribe({
      next: () => {
        this.registrationStatus = 'NONE';
        this.unregistering = false;
        this.load(this.event!.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.unregistering = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitFeedback(): void {
    if (!this.event || !this.canSubmitFeedback) return;
    this.feedbackError = null;
    this.feedbackSubmitting = true;
    this.cdr.detectChanges();

    this.api.submitFeedback(this.event.id, {
      difficulty: this.feedback.difficulty,
      understood: this.feedback.understood,
      rating: this.feedback.rating,
      whatNext: this.feedback.whatNext || undefined
    }).subscribe({
      next: (res) => {
        this.nextSuggestion = res;
        this.feedbackDone = true;
        this.feedbackSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.feedbackError = err?.error?.message || 'Could not save feedback.';
        this.feedbackSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  private normalizeRegistrationStatus(status: string | undefined): string {
    if (!status) return 'NONE';
    // Backend uses APPROVED; UI treats it as actively registered.
    if (status === 'APPROVED') return 'REGISTERED';
    return status;
  }

  typeLabel(type: string): string {
    const map: any = { WEBINAR: 'Webinaire', WORKSHOP: 'Workshop', QNA: 'Q&A', MEETUP: 'Meetup', BOOTCAMP: 'Bootcamp' };
    return map[type] ?? type;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  shareOnWhatsApp(): void {
    if (!this.event) return;
    const text = `Regarde cet événement : ${this.event.title}. \n ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  downloadEventPdf(): void {
    if (!this.event) return;

    const e = this.event;
    const doc = new jsPDF();
    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentX = 16;
    const contentWidth = pageWidth - (contentX * 2);

    const ensureSpace = (needed: number) => {
      if (y + needed <= 280) return;
      doc.addPage();
      y = 20;
    };

    const drawSectionTitle = (title: string) => {
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 95);
      doc.text(title, contentX, y);
      y += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(contentX, y, contentX + contentWidth, y);
      y += 7;
    };

    const writeLabelValue = (label: string, value: string) => {
      ensureSpace(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${label}:`, contentX, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const labelWidth = doc.getTextWidth(`${label}: `);
      const lines = doc.splitTextToSize(value || '-', contentWidth - labelWidth - 2);
      doc.text(lines, contentX + labelWidth + 2, y);
      y += Math.max(6, lines.length * 5) + 2;
    };

    const writeParagraph = (text: string) => {
      ensureSpace(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(text || '-', contentWidth);
      doc.text(lines, contentX, y);
      y += (lines.length * 5) + 2;
    };

    // Header
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CERTIFYPRO - Event Information Sheet', contentX, 16);
    y = 36;

    drawSectionTitle('Overview');
    writeLabelValue('Title', e.title || '-');
    writeLabelValue('Type', e.type || '-');
    writeLabelValue('Learning level', e.learningLevel || 'BEGINNER');
    writeLabelValue('Status', e.status || '-');
    writeLabelValue('Category', e.category || 'General');

    drawSectionTitle('Schedule & Logistics');
    writeLabelValue('Starts at', this.formatDate(e.dateStart));
    writeLabelValue('Ends at', this.formatDate(e.dateEnd));
    writeLabelValue('Mode', e.mode === 'ONLINE' ? 'Online' : (e.mode === 'HYBRID' ? 'Hybrid' : 'Onsite'));
    writeLabelValue('Location', e.location || 'N/A');
    writeLabelValue('Meeting link', e.meetingLink || 'N/A');
    writeLabelValue('Capacity', `${e.participantCount || 0} / ${e.maxParticipants} participants`);

    drawSectionTitle('Trainer');
    writeLabelValue('Name', `${e.trainerFirstName || ''} ${e.trainerLastName || ''}`.trim() || '-');

    drawSectionTitle('Description');
    writeParagraph(e.description || 'No description provided.');

    drawSectionTitle('Required Skills');
    writeParagraph(
      (e.requiredSkills && e.requiredSkills.length > 0)
        ? e.requiredSkills.map(skill => `- ${skill}`).join('\n')
        : 'No specific skills required.'
    );

    if (e.program && e.program.length > 0) {
      drawSectionTitle('Program');
      for (const item of e.program) {
        ensureSpace(10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 58, 95);
        doc.text(item.time || '--:--', contentX, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const activityLines = doc.splitTextToSize(item.activity || '-', contentWidth - 28);
        doc.text(activityLines, contentX + 28, y);
        y += Math.max(6, activityLines.length * 5) + 1;
      }
    }

    ensureSpace(14);
    doc.setDrawColor(226, 232, 240);
    doc.line(contentX, 280, contentX + contentWidth, 280);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleString('fr-FR')}`, contentX, 286);

    const fileSafeTitle = (e.title || 'event').replace(/[^\w\-]+/g, '_').slice(0, 40);
    doc.save(`event_${fileSafeTitle}.pdf`);
  }

  get verificationCode(): string {
    if (!this.event || !this.user?.id) return 'CP-PENDING';
    return `CP-${this.event.id}-${this.user.id}-${new Date(this.event.dateStart).getFullYear()}`;
  }

  get qrCodeUrl(): string {
    if (!this.event || !this.user?.id) return '';
    const msg = `✅ CertifyPro Pass: ${this.user.firstName} ${this.user.lastName}\nEvent: ${this.event.title}`;
    return `https://quickchart.io/qr?text=${encodeURIComponent(msg)}&size=300&ecLevel=L&light=ffffff&dark=1e3a5f`;
  }
}
