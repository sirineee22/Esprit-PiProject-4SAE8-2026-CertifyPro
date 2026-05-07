import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsApiService, EventsPage } from '../../services/events.api';
import { Event } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './events-list.component.html',
  styleUrl: './events-list.component.css',
})
export class EventsListComponent {
  page: EventsPage | null = null;
  loading = true;
  error: string | null = null;
  typeFilter: string = '';
  modeFilter: string = '';
  upcomingOnly = true;
  currentPage = 0;
  pageSize = 10;

  constructor(private api: EventsApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api
      .list({
        type: this.typeFilter || undefined,
        mode: this.modeFilter || undefined,
        upcomingOnly: this.upcomingOnly,
        page: this.currentPage,
        size: this.pageSize,
      })
      .subscribe({
        next: (p) => {
          this.page = p;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || err?.message || 'Erreur chargement événements';
          this.loading = false;
        },
      });
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.load();
  }

  goToPage(n: number): void {
    this.currentPage = n;
    this.load();
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
