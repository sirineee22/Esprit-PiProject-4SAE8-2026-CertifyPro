import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsApiService } from '../../services/events.api';
import { Event, MyRegistration } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-events.component.html',
  styleUrl: './my-events.component.css',
})
export class MyEventsComponent {
  events: Event[] = [];
  loading = true;
  error: string | null = null;

  constructor(private api: EventsApiService) { }

  ngOnInit(): void {
    this.api.myRegistrations().subscribe({
      next: (list: MyRegistration[]) => {
        this.events = list.map(r => r.event);
        this.loading = false;
      },
      error: (err: any) => {
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
