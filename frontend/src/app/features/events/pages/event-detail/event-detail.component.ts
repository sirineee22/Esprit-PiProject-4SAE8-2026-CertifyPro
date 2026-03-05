import { Component, Inject, PLATFORM_ID, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsApiService } from '../../services/events.api';
import { AuthService } from '../../../../core/auth/auth.service';
import { UserService } from '../../../users/services/users.api';
import { Event, Review } from '../../../../shared/models/event.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
})
export class EventDetailComponent implements AfterViewInit, OnDestroy {
  event: Event | null = null;
  registrationStatus: string = 'NONE'; // 'NONE' | 'REGISTERED' | 'WAITLISTED' | 'ATTENDED'
  loading = true;
  error: string | null = null;
  registering = false;
  unregistering = false;
  reviews: Review[] = [];
  userReview = { rating: 5, comment: '' };
  isSubmittingReview = false;
  loadingReviews = false;

  private map: L.Map | null = null;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: EventsApiService,
    private auth: AuthService,
    private userService: UserService,
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
    this.loadingReviews = true;
    this.api.getById(id).subscribe({
      next: (e) => {
        this.event = e;
        this.loading = false;

        // Load user-specific registration status
        if (this.isLearner) {
          this.api.myRegistrations().subscribe(list => {
            const myReg = list.find(r => r.event.id === e.id);
            this.registrationStatus = myReg ? myReg.status : 'NONE';
          });
        }

        // Always load reviews
        this.loadReviews(id);

        if (this.event?.mode === 'ONSITE') {
          setTimeout(() => this.initMap(), 200);
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'Événement introuvable';
        this.loading = false;
        this.loadingReviews = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.event?.mode === 'ONSITE') {
      this.initMap();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.event || this.event.mode !== 'ONSITE') return;

    const mapContainer = document.getElementById('map');
    if (!mapContainer || this.map) return;

    const locString = this.event.location || 'Tunis, Lac 2';

    // Geocoding via Nominatim
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locString)}`)
      .then(res => res.json())
      .then(data => {
        let lat = 36.837;
        let lon = 10.235;

        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }

        if (this.map) return; // Guard against double init during fetch

        this.map = L.map('map').setView([lat, lon], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(this.map);

        const icon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        L.marker([lat, lon], { icon }).addTo(this.map)
          .bindPopup(`<b>${this.event?.title}</b><br>${locString}`)
          .openPopup();
      })
      .catch((err) => {
        console.warn('Geocoding failed, using fallback', err);
        if (this.map) return;
        this.map = L.map('map').setView([36.837, 10.235], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
      });
  }

  get user() {
    return this.auth.getCurrentUser();
  }

  get isLearner(): boolean {
    return this.user?.role?.name === 'LEARNER';
  }

  get isPastEvent(): boolean {
    if (!this.event?.dateEnd) return false;
    return new Date(this.event.dateEnd).getTime() < new Date().getTime();
  }

  joinMeeting(): void {
    if (this.event?.meetingLink) {
      window.open(this.event.meetingLink, '_blank');
    } else {
      alert("Le lien n'est pas encore disponible.");
    }
  }


  register(): void {
    if (!this.event || !this.user) return;
    this.registering = true;
    this.api.register(this.event.id, { firstName: this.user.firstName, lastName: this.user.lastName }).subscribe({
      next: (res: any) => {
        if (res?.status === 'WAITLISTED') {
          this.registrationStatus = 'WAITLISTED';
        } else {
          this.registrationStatus = 'REGISTERED';
        }
        this.registering = false;
        this.load(this.event!.id);
      },
      error: (err) => {
        this.registering = false;
        const errMsg = err?.error?.message || err?.error || "Erreur d'inscription";
        alert(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
      }
    });
  }

  unregister(): void {
    if (!this.event) return;
    this.unregistering = true;
    this.api.unregister(this.event.id).subscribe({
      next: () => {
        this.registrationStatus = 'NONE';
        this.unregistering = false;
        this.load(this.event!.id);
      },
      error: (err) => {
        alert(err?.error?.message || "Erreur de désinscription");
        this.unregistering = false;
      }
    });
  }

  formatDateShort(d: string): string {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short'
    });
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      WEBINAR: 'Webinaire', WORKSHOP: 'Workshop', QNA: 'Q&A',
      MEETUP: 'Meetup', BOOTCAMP: 'Bootcamp',
    };
    return map[type] ?? type;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  shareOnWhatsApp(): void {
    if (!this.event) return;
    const text = `Salut ! Regarde cet événement sur CertifyPro : ${this.event.title}. \n\n ${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  get verificationCode(): string {
    const e = this.event;
    const u = this.user;
    if (!e || !u || u.id === undefined) return 'CP-PENDING';
    const eventPart = e.id.toString().padStart(3, '0');
    const userPart = u.id.toString().padStart(3, '0');
    return `CP-${eventPart}-${userPart}-${new Date(e.dateStart).getFullYear()}`;
  }

  get qrCodeUrl(): string {
    const e = this.event;
    const u = this.user;
    if (!e || !u || u.id === undefined) return '';
    // Personalizing the message shown when the code is scanned by a phone
    const message = `✅ CertifyPro : Pass d'entrée valide pour ${u.firstName} ${u.lastName}.\n\nÉvénement: ${e.title}\nID: ${this.verificationCode}`;
    // ecLevel=L (Low error correction) makes the QR code less dense and much clearer
    return `https://quickchart.io/qr?text=${encodeURIComponent(message)}&size=300&ecLevel=L&light=ffffff&dark=1e3a5f&margin=1`;
  }


  get reviewsCount(): number {
    return this.reviews.length;
  }

  get averageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc: number, r: Review) => acc + (r.rating || 0), 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  loadReviews(eventId: number): void {
    this.loadingReviews = true;
    this.api.getReviews(eventId).subscribe({
      next: (list) => {
        this.reviews = list;
        this.loadingReviews = false;
      },
      error: () => {
        console.error('Failed to load reviews');
        this.loadingReviews = false;
      }
    });
  }

  setRating(r: number): void {
    this.userReview.rating = r;
  }

  submitReview(): void {
    if (!this.event || !this.userReview.comment.trim() || !this.user) return;
    this.isSubmittingReview = true;
    const payload = {
      ...this.userReview,
      learnerFirstName: this.user.firstName,
      learnerLastName: this.user.lastName
    };
    this.api.postReview(this.event.id, payload).subscribe({
      next: (res) => {
        this.reviews.unshift(res);
        this.userReview = { rating: 5, comment: '' };
        this.isSubmittingReview = false;
        alert('Merci pour votre avis !');
      },
      error: (err) => {
        this.isSubmittingReview = false;
        alert(err?.error?.message || 'Erreur lors de l\'envoi de l\'avis');
      }
    });
  }


  get canReview(): boolean {
    if (!this.event || !this.isPastEvent) return false;
    // Check if user is registered/attended
    if (this.registrationStatus === 'NONE' || this.registrationStatus === 'CANCELLED') return false;
    // Check if already reviewed
    const alreadyReviewed = this.reviews.some(r => r.learnerId === this.auth.getCurrentUser()?.id);
    return !alreadyReviewed;
  }
}
