import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsApiService } from '../../../events/services/events.api';
import { Event, EventStats } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.css',
})
export class AdminEventsComponent {
  events: Event[] = [];
  stats: EventStats | null = null;
  loading = true;
  statsLoading = true;
  statsError = false;
  error: string | null = null;
  deletingId: number | null = null;

  constructor(
    private api: EventsApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.adminList().subscribe({
      next: (list) => {
        this.events = list;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Erreur chargement';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadStats(): void {
    this.statsLoading = true;
    this.statsError = false;
    this.api.adminStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.statsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.statsLoading = false;
        this.statsError = true;
        this.cdr.detectChanges();
      },
    });
  }

  /** Stats from API if available, otherwise computed from the events list so stats always show. */
  get displayStats(): EventStats | null {
    if (this.stats) return this.stats;
    if (this.events.length === 0) return null;
    return this.computeStatsFromEvents(this.events);
  }

  private computeStatsFromEvents(events: Event[]): EventStats {
    const byType: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    let upcoming = 0;
    let cancelled = 0;
    let done = 0;
    let totalRegistrations = 0;
    for (const e of events) {
      if (e.status === 'UPCOMING') upcoming++;
      else if (e.status === 'CANCELLED') cancelled++;
      else if (e.status === 'DONE') done++;
      byType[e.type] = (byType[e.type] ?? 0) + 1;
      byMode[e.mode] = (byMode[e.mode] ?? 0) + 1;
      totalRegistrations += e.participantCount ?? 0;
    }
    return {
      totalEvents: events.length,
      upcoming,
      cancelled,
      done,
      byType,
      byMode,
      totalRegistrations,
    };
  }

  byTypeEntries(): { key: string; value: number }[] {
    const s = this.displayStats;
    if (!s?.byType) return [];
    return Object.entries(s.byType).map(([key, value]) => ({ key, value }));
  }

  byModeEntries(): { key: string; value: number }[] {
    const s = this.displayStats;
    if (!s?.byMode) return [];
    return Object.entries(s.byMode).map(([key, value]) => ({ key, value }));
  }

  delete(id: number): void {
    if (!confirm('Supprimer cet événement ?')) return;
    this.deletingId = id;
    this.api.adminDelete(id).subscribe({
      next: () => {
        this.events = this.events.filter((e) => e.id !== id);
        this.deletingId = null;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Erreur suppression';
        this.deletingId = null;
      },
    });
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
