import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventsApiService } from '../../services/events.api';
import { AuthService } from '../../../../core/auth/auth.service';
import { CreateEventRequest, EventType, EventMode } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-trainer-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './trainer-event-form.component.html',
  styleUrl: './trainer-event-form.component.css',
})
export class TrainerEventFormComponent {
  private readonly fb = inject(FormBuilder);

  isEdit = false;
  eventId: number | null = null;
  loading = false;
  loadError: string | null = null;
  submitError: string | null = null;

  types: EventType[] = ['WEBINAR', 'WORKSHOP', 'QNA', 'MEETUP', 'BOOTCAMP'];
  modes: EventMode[] = ['ONLINE', 'ONSITE', 'HYBRID'];

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    type: ['WEBINAR' as EventType, Validators.required],
    mode: ['ONLINE' as EventMode, Validators.required],
    dateStart: ['', Validators.required],
    dateEnd: ['', Validators.required],
    meetingLink: [''],
    location: [''],
    maxParticipants: [50, [Validators.required, Validators.min(1), Validators.max(1000)]],
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: EventsApiService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.eventId = +id;
      this.api.getById(this.eventId).subscribe({
        next: (e) => {
          const start = e.dateStart.slice(0, 16);
          const end = e.dateEnd.slice(0, 16);
          this.form.patchValue({
            title: e.title,
            description: e.description ?? '',
            type: e.type,
            mode: e.mode,
            dateStart: start,
            dateEnd: end,
            meetingLink: e.meetingLink ?? '',
            location: e.location ?? '',
            maxParticipants: e.maxParticipants,
          });
        },
        error: () => (this.loadError = 'Événement introuvable'),
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const user = this.auth.getCurrentUser();
    const body: CreateEventRequest = {
      title: v.title,
      description: v.description || undefined,
      type: v.type,
      mode: v.mode,
      dateStart: new Date(v.dateStart).toISOString(),
      dateEnd: new Date(v.dateEnd).toISOString(),
      meetingLink: v.meetingLink || undefined,
      location: v.location || undefined,
      maxParticipants: v.maxParticipants,
      trainerFirstName: user?.firstName,
      trainerLastName: user?.lastName,
    };
    this.submitError = null;
    this.loading = true;
    if (this.isEdit && this.eventId) {
      this.api.update(this.eventId, body).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/events/trainer']);
        },
        error: (err) => {
          this.submitError = err?.error?.message || err?.message || 'Erreur';
          this.loading = false;
        },
      });
    } else {
      this.api.create(body).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/events/trainer']);
        },
        error: (err) => {
          this.submitError = err?.error?.message || err?.message || 'Erreur';
          this.loading = false;
        },
      });
    }
  }
}
