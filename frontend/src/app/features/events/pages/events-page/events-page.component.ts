import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { EventsApiService } from '../../services/events.api';
import { EventsExplorerTabComponent } from '../events-explorer-tab/events-explorer-tab.component';
import { EventsAgendaTabComponent } from '../events-agenda-tab/events-agenda-tab.component';
import { EventsTrainerTabComponent } from '../events-trainer-tab/events-trainer-tab.component';
import { type Event } from '../../../../shared/models/event.model';

type TabId = 'explorer' | 'agenda' | 'my-events';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [
    CommonModule,
    EventsExplorerTabComponent,
    EventsAgendaTabComponent,
    EventsTrainerTabComponent,
  ],
  templateUrl: './events-page.component.html',
  styleUrl: './events-page.component.css',
})
export class EventsPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly api = inject(EventsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  activeTab: TabId = 'explorer';
  agendaView: 'list' | 'calendar' = 'list';

  ngOnInit(): void {
    this.api.list({ upcomingOnly: true, page: 0, size: 10 }).subscribe();

    if (this.isTrainer && this.auth.getToken()) {
      this.api.myEvents().subscribe({ error: () => { } });
    }
    if (this.isLearner && this.auth.getToken()) {
      this.api.myRegistrations().subscribe({ error: () => { } });
    }

    const tab = this.route.snapshot.queryParamMap.get('tab') as TabId;
    if (tab && ['explorer', 'agenda', 'my-events'].includes(tab)) {
      this.activeTab = tab;
    }
  }

  get isLearner(): boolean {
    return this.auth.getCurrentUser()?.role?.name === 'LEARNER';
  }

  get isTrainer(): boolean {
    return this.auth.getCurrentUser()?.role?.name === 'TRAINER';
  }

  get isLoggedIn(): boolean {
    return !!this.auth.getCurrentUser();
  }

  get tabs(): { id: TabId; label: string }[] {
    const t: { id: TabId; label: string }[] = [{ id: 'explorer', label: 'Explorer' }];
    if (this.isLearner || this.isTrainer) {
      t.push({ id: 'agenda', label: 'My Agenda' });
    }
    if (this.isTrainer) {
      t.push({ id: 'my-events', label: 'My Events' });
    }
    return t;
  }

  openCreate(): void {
    this.router.navigate(['/events/create']);
  }

  openEdit(e: Event): void {
    this.router.navigate(['/events/create'], { queryParams: { edit: e.id } });
  }
}
