import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { map, Subscription, Observable } from 'rxjs';
import { EventsApiService } from '../../services/events.api';
import { EventRefreshService } from '../../services/event-refresh.service';
import { Event } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-events-agenda-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events-agenda-tab.component.html',
  styleUrl: './events-agenda-tab.component.css',
})
export class EventsAgendaTabComponent implements OnDestroy {
  @Input() isLearner = false;
  @Input() viewMode: 'list' | 'calendar' = 'list';
  @Output() viewModeChange = new EventEmitter<'list' | 'calendar'>();

  events: (Event & { regStatus?: string })[] = [];
  loading = true;
  error: string | null = null;
  unregisteringId: number | null = null;

  // Calendar properties
  currentMonth: Date = new Date();
  calendarDays: { date: Date; isCurrentMonth: boolean; isToday: boolean; events: Event[] }[] = [];
  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  private refreshSub?: Subscription;

  constructor(
    public api: EventsApiService,
    private router: Router,
    private refresh: EventRefreshService
  ) {
    this.refreshSub = this.refresh.refreshed.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  goToEvent(e: Event): void {
    this.router.navigate(['/events', e.id], { state: { event: e } });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    const obs: Observable<any[]> = this.isLearner
      ? this.api.myRegistrations()
      : this.api.myEvents();

    obs.subscribe({
      next: (list: any[]) => {
        if (this.isLearner) {
          // list is MyRegistration[]
          this.events = list.map(r => ({
            ...r.event,
            regStatus: r.status
          }));
        } else {
          // list is Event[]
          this.events = list;
        }
        this.generateCalendar();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.message || 'Erreur chargement';
        this.loading = false;
      },
    });
  }

  unregister(e: Event): void {
    this.unregisteringId = e.id;
    this.api.unregister(e.id).subscribe({
      next: () => {
        this.unregisteringId = null;
        this.load();
      },
      error: () => {
        this.unregisteringId = null;
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
    const count = this.getParticipantCount(e);
    if (count >= e.maxParticipants) return { label: 'Complet', class: 'full' };
    const start = new Date(e.dateStart).getTime();
    const now = new Date().getTime();
    const diff = start - now;
    if (diff > 0 && diff < 24 * 60 * 60 * 1000) return { label: 'Bientôt', class: 'soon' };
    if (e.status === 'UPCOMING') return { label: 'Open', class: 'open' };
    return { label: e.status, class: 'default' };
  }

  toggleView(): void {
    this.viewModeChange.emit(this.viewMode === 'list' ? 'calendar' : 'list');
  }

  // --- Calendar Logic ---

  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // 0 = Sunday, 1 = Monday. We want Monday = 0 index for our loop if we start with Mon.
    // Standard JS: Sun=0, Mon=1...Sat=6.
    // We want Mon as col 0. So Mon(1)->0, Tue(2)->1 ... Sun(0)->6
    const startDayIndex = (firstDay.getDay() + 6) % 7;

    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push(this.createDay(d, false));
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push(this.createDay(d, true));
    }

    // Next month padding to fill 42 cells (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push(this.createDay(d, false));
    }

    this.calendarDays = days;
  }

  createDay(date: Date, isCurrentMonth: boolean) {
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    // Find events for this day
    const dayEvents = this.events.filter(e => {
      const eDate = new Date(e.dateStart);
      return eDate.getDate() === date.getDate() &&
        eDate.getMonth() === date.getMonth() &&
        eDate.getFullYear() === date.getFullYear();
    });

    // Sort by time
    dayEvents.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

    return {
      date,
      isCurrentMonth,
      isToday,
      events: dayEvents
    };
  }

  prevMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  formatDate(d: string | Date): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
