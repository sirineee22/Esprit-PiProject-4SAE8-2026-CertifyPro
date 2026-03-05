import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsApiService, EventsPage } from '../../services/events.api';
import { EventRefreshService } from '../../services/event-refresh.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Event, EventType, MyRegistration } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-events-explorer-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events-explorer-tab.component.html',
  styleUrl: './events-explorer-tab.component.css',
})
export class EventsExplorerTabComponent {
  @Input() isLearner = false;

  page: EventsPage | null = null;
  allEvents: Event[] = [];
  loading = true;
  error: string | null = null;
  myRegistrations: MyRegistration[] = [];
  registeredEventIds: number[] = [];

  // Filters
  typeFilter = '';
  modeFilter = '';
  upcomingOnly = false;
  searchQuery = '';
  trainerFilter = '';
  dateStartFilter = '';
  dateEndFilter = '';
  durationFilter = ''; // 'short' (<1h), 'medium' (1-3h), 'long' (>3h)
  sortBy = 'date'; // 'date', 'popularity'

  currentPage = 0;
  pageSize = 10;
  registeringId: number | null = null;

  constructor(
    public api: EventsApiService,
    private refreshService: EventRefreshService,
    private router: Router,
    private auth: AuthService
  ) { }

  goToEvent(e: Event): void {
    this.router.navigate(['/events', e.id], { state: { event: e } });
  }

  prefetchEvent(e: Event): void {
    this.api.getById(e.id).subscribe();
  }

  ngOnInit(): void {
    this.load();
    this.refreshService.refreshed.subscribe(() => this.load());
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api
      .list({
        upcomingOnly: this.upcomingOnly,
        page: 0,
        size: 100,
      })
      .subscribe({
        next: (p) => {
          this.page = p;
          this.allEvents = p.content ?? [];
          this.loading = false;
          if (this.isLearner) {
            this.api.myRegistrations().subscribe((list: MyRegistration[]) => {
              this.myRegistrations = list;
              this.registeredEventIds = list
                .filter(r => (r.status as string) === 'REGISTERED' || (r.status as string) === 'WAITLISTED' || (r.status as string) === 'ATTENDED')
                .map(r => r.event.id);
            });
          }
        },
        error: (err) => {
          this.error = err?.error?.message || err?.message || 'Erreur chargement';
          this.loading = false;
        },
      });
  }

  isRegistered(id: number): boolean {
    return this.registeredEventIds.includes(id);
  }

  getRegistrationStatus(eventId: number): string {
    const reg = this.myRegistrations.find(r => r.event.id === eventId);
    return reg ? reg.status : 'NONE';
  }

  onFilterChange(): void {
    this.currentPage = 0;
  }

  onUpcomingChange(): void {
    this.currentPage = 0;
    this.load();
  }

  goToPage(n: number): void {
    this.currentPage = n;
  }

  register(e: Event): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      alert("Veuillez vous connecter pour vous inscrire");
      return;
    }
    this.registeringId = e.id;
    this.api.register(e.id, { firstName: user.firstName, lastName: user.lastName }).subscribe({
      next: (res: any) => {
        this.registeringId = null;
        this.load();
        const msg = res.message === 'Waitlisted' ? 'Vous avez été ajouté à la liste d\'attente.' : 'Inscription réussie !';
        alert(msg);
      },
      error: (err) => {
        this.registeringId = null;
        const errMsg = err?.error?.message || err?.error || 'Erreur lors de l\'inscription';
        alert(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
      },
    });
  }

  shareEvent(e: Event): void {
    if (navigator.share) {
      navigator.share({
        title: e.title,
        text: e.description,
        url: window.location.origin + '/events/' + e.id
      });
    } else {
      alert('Lien copié !');
    }
  }

  addToCalendar(e: Event): void {
    const start = new Date(e.dateStart).toISOString().replace(/-|:|\.\d+/g, '');
    const end = new Date(e.dateEnd).toISOString().replace(/-|:|\.\d+/g, '');
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${start}/${end}&details=${encodeURIComponent(e.description || '')}&location=${encodeURIComponent(e.location || e.mode)}`;
    window.open(url, '_blank');
  }

  get filteredEvents(): Event[] {
    let list = [...this.allEvents];

    if (this.typeFilter) list = list.filter((e) => e.type === this.typeFilter);
    if (this.modeFilter) list = list.filter((e) => e.mode === this.modeFilter);
    if (this.trainerFilter) {
      list = list.filter((e) =>
        `${e.trainerFirstName} ${e.trainerLastName}`.toLowerCase().includes(this.trainerFilter.toLowerCase())
      );
    }

    if (this.dateStartFilter) {
      list = list.filter((e) => new Date(e.dateStart) >= new Date(this.dateStartFilter));
    }
    if (this.dateEndFilter) {
      list = list.filter((e) => new Date(e.dateStart) <= new Date(this.dateEndFilter));
    }

    if (this.durationFilter) {
      list = list.filter((e) => {
        const dur = this.getDurationMinutes(e);
        if (this.durationFilter === 'short') return dur < 60;
        if (this.durationFilter === 'medium') return dur >= 60 && dur <= 180;
        if (this.durationFilter === 'long') return dur > 180;
        return true;
      });
    }

    const q = this.searchQuery?.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          `${e.trainerFirstName ?? ''} ${e.trainerLastName ?? ''}`.toLowerCase().includes(q)
      );
    }

    if (this.sortBy === 'popularity') {
      list.sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0));
    } else {
      list.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
    }

    return list;
  }

  get paginatedEvents(): Event[] {
    const list = this.filteredEvents;
    const start = this.currentPage * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredEvents.length / this.pageSize));
  }

  isPast(e: Event): boolean {
    if (!e.dateEnd) return false;
    return new Date(e.dateEnd).getTime() < new Date().getTime();
  }

  onSearchInput(): void {
    // Client-side filter, no API call
  }

  typeLabel(type: EventType): string {
    const map: Record<string, string> = {
      WEBINAR: 'Webinaire', WORKSHOP: 'Workshop', QNA: 'Q&A',
      MEETUP: 'Meetup', BOOTCAMP: 'Bootcamp',
    };
    return map[type] ?? type;
  }

  getDurationMinutes(e: Event): number {
    const start = new Date(e.dateStart).getTime();
    const end = new Date(e.dateEnd).getTime();
    return Math.floor((end - start) / (1000 * 60));
  }

  formatDuration(e: Event): string {
    const min = this.getDurationMinutes(e);
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  getParticipantCount(e: Event): number {
    return e.participantCount ?? 0;
  }

  getEventStatus(e: Event): { label: string, class: string } {
    if (this.isPast(e)) return { label: 'Terminé', class: 'finished' };
    const count = this.getParticipantCount(e);
    if (count >= e.maxParticipants) return { label: 'Full', class: 'full' };

    const start = new Date(e.dateStart).getTime();
    const now = new Date().getTime();
    const diff = start - now;

    if (diff > 0 && diff < 24 * 60 * 60 * 1000) return { label: 'Soon', class: 'soon' };
    if (e.status === 'UPCOMING') return { label: 'Open', class: 'open' };

    return { label: e.status, class: 'default' };
  }

  formatDateShort(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  trainerInitials(e: Event): string {
    const f = (e.trainerFirstName ?? '').charAt(0);
    const l = (e.trainerLastName ?? '').charAt(0);
    return (f + l).toUpperCase() || '?';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
