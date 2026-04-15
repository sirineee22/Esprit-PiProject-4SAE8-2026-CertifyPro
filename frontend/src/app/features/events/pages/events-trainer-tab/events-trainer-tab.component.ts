import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EventsApiService } from '../../services/events.api';
import { EventRefreshService } from '../../services/event-refresh.service';
import { Event } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-events-trainer-tab',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './events-trainer-tab.component.html',
  styleUrl: './events-trainer-tab.component.css',
})
export class EventsTrainerTabComponent {
  @Output() edit = new EventEmitter<Event>();

  events: Event[] = [];
  loading = true;
  error: string | null = null;
  cancellingId: number | null = null;
  deletingId: number | null = null;

  constructor(
    public api: EventsApiService,
    private refreshService: EventRefreshService,
    private router: Router,
  ) { }

  goToEvent(e: Event): void {
    this.router.navigate(['/events', e.id], { state: { event: e } });
  }

  ngOnInit(): void {
    this.load();
    this.refreshService.refreshed.subscribe(() => this.load());
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.myEvents().subscribe({
      next: (list) => {
        this.events = list;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Erreur chargement';
        this.loading = false;
      },
    });
  }

  cancelEvent(e: Event): void {
    if (!confirm('Annuler cet événement ?')) return;
    this.cancellingId = e.id;
    this.api.cancel(e.id).subscribe({
      next: () => {
        this.events = this.events.map(ev =>
          ev.id === e.id ? { ...ev, status: 'CANCELLED' } : ev
        );
        this.cancellingId = null;
      },
      error: () => {
        this.cancellingId = null;
      },
    });
  }

  deleteEvent(e: Event): void {
    if (!confirm('Supprimer définitivement cet événement ? Cette action est irréversible.')) return;
    this.deletingId = e.id;
    this.api.delete(e.id).subscribe({
      next: () => {
        this.events = this.events.filter(ev => ev.id !== e.id);
        this.deletingId = null;
      },
      error: () => {
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
