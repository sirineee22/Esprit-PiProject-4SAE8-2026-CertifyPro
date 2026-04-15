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
        this.cancellingId = null;
        this.load();
      },
      error: () => {
        this.cancellingId = null;
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
