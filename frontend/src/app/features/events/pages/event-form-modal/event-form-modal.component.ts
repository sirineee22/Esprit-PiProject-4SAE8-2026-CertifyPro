import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventsApiService } from '../../services/events.api';
import { EventRefreshService } from '../../services/event-refresh.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { CreateEventRequest, Event, EventType, EventMode } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-event-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-form-modal.component.html',
  styleUrl: './event-form-modal.component.css',
  })
export class EventFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(EventsApiService);
  private readonly refreshService = inject(EventRefreshService);
  private readonly auth = inject(AuthService);

  @Input() event: Event | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  loading = false;
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

  ngOnInit(): void {
    this.submitError = null;
    if (this.event) {
      const start = this.event.dateStart.slice(0, 16);
      const end = this.event.dateEnd.slice(0, 16);
      this.form.patchValue({
        title: this.event.title,
        description: this.event.description ?? '',
        type: this.event.type,
        mode: this.event.mode,
        dateStart: start,
        dateEnd: end,
        meetingLink: this.event.meetingLink ?? '',
        location: this.event.location ?? '',
        maxParticipants: this.event.maxParticipants,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (v.mode === 'ONLINE' && !(v.meetingLink ?? '').trim()) {
      this.submitError = 'The meeting link is required for online events.';
      return;
    }
    if (v.mode === 'ONSITE' && !(v.location ?? '').trim()) {
      this.submitError = 'The location is required for on-site events.';
      return;
    }
    if (v.mode === 'HYBRID' && (!(v.meetingLink ?? '').trim() || !(v.location ?? '').trim())) {
      this.submitError = 'The meeting link and location are required for hybrid events.';
      return;
    }
    const now = new Date();
    if (new Date(v.dateStart) < now) {
      this.submitError = 'The start date must be in the future.';
      return;
    }
    if (new Date(v.dateEnd) <= new Date(v.dateStart)) {
      this.submitError = 'The end date must be after the start date.';
      return;
    }
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
    if (this.event) {
      this.api.update(this.event.id, body).subscribe({
        next: () => {
          this.loading = false;
          this.refreshService.triggerRefresh();
          this.saved.emit();
        },
        error: (err) => {
          this.submitError = (typeof err?.error === 'string' ? err.error : err?.error?.message) || err?.message || 'Error';
          this.loading = false;
        },
      });
    } else {
      this.api.create(body).subscribe({
        next: () => {
          this.loading = false;
          this.refreshService.triggerRefresh();
          this.saved.emit();
        },
        error: (err) => {
          this.submitError = (typeof err?.error === 'string' ? err.error : err?.error?.message) || err?.message || 'Error';
          this.loading = false;
        },
      });
    }
  }
}
