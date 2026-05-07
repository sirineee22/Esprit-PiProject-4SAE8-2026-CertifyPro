import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsApiService } from '../../services/events.api';
import { Event } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-trainer-events-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './trainer-events-list.component.html',
  styleUrl: './trainer-events-list.component.css',
})
export class TrainerEventsListComponent {
  events: Event[] = [];
  loading = true;
  error: string | null = null;

  constructor(private api: EventsApiService) {}

  ngOnInit(): void {
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
