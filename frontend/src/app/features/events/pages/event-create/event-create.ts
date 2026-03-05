import { Component, inject, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { EventsApiService } from '../../services/events.api';
import { EventRefreshService } from '../../services/event-refresh.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { CreateEventRequest, EventType, EventMode, Event } from '../../../../shared/models/event.model';
import * as L from 'leaflet';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './event-create.html',
  styleUrl: './event-create.css',
})
export class EventCreateComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(EventsApiService);
  private readonly refreshService = inject(EventRefreshService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  @Inject(PLATFORM_ID) private platformId = inject(PLATFORM_ID);

  loading = false;
  submitError: string | null = null;
  editEvent: Event | null = null;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  suggestions: any[] = [];
  searchingLocation = false;
  noResultsFound = false;
  showDefaultCities = false;
  defaultCities = [
    { display_name: 'Tunis, Gouvernorat Tunis, Tunisie', lat: '36.8065', lon: '10.1815', isCity: true },
    { display_name: 'Sousse, Gouvernorat Sousse, Tunisie', lat: '35.8256', lon: '10.6369', isCity: true },
    { display_name: 'Sfax, Gouvernorat Sfax, Tunisie', lat: '34.7406', lon: '10.7603', isCity: true },
    { display_name: 'Hammamet, Gouvernorat Nabeul, Tunisie', lat: '36.3980', lon: '10.6120', isCity: true },
    { display_name: 'Bizerte, Gouvernorat Bizerte, Tunisie', lat: '37.2744', lon: '9.8739', isCity: true }
  ];
  private searchSubject = new Subject<string>();

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
    program: this.fb.array([])
  });

  get programControls() {
    return this.form.get('program') as FormArray;
  }

  addProgramItem(time = '', activity = ''): void {
    this.programControls.push(
      this.fb.group({
        time: [time, Validators.required],
        activity: [activity, Validators.required]
      })
    );
  }

  removeProgramItem(index: number): void {
    this.programControls.removeAt(index);
  }

  ngOnInit(): void {
    const editId = this.route.snapshot.queryParamMap.get('edit');
    if (editId) {
      this.loadEvent(+editId);
    } else {
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
      const end = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
      this.form.patchValue({ dateStart: start, dateEnd: end });
      // Add one default row
      this.addProgramItem('09:00', 'Accueil et Introduction');
    }

    // React to mode changes to init/destroy map
    this.form.get('mode')?.valueChanges.subscribe(mode => {
      if (mode === 'ONSITE' || mode === 'HYBRID') {
        setTimeout(() => this.initMap(), 100);
      } else {
        this.destroyMap();
      }
    });

    // Setup autocomplete search
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 3) {
          this.noResultsFound = false;
          return of([]);
        }
        this.searchingLocation = true;
        this.noResultsFound = false;
        // Limit search to Tunisia with countrycodes=tn
        return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=tn`)
          .then(res => res.json())
          .catch(() => []);
      })
    ).subscribe(results => {
      this.searchingLocation = false;
      this.suggestions = results as any[];
      const locationVal = this.form.getRawValue().location;
      this.noResultsFound = this.suggestions.length === 0 && locationVal.length >= 3;
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initMap(), 300);
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  private initMap(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const mapEl = document.getElementById('preview-map');
    if (!mapEl || this.map) return;

    // Fix for Leaflet tiles size
    setTimeout(() => {
      if (!this.map) {
        this.map = L.map('preview-map', {
          zoomControl: true,
          scrollWheelZoom: false
        }).setView([36.837, 10.235], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(this.map);

        const icon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        this.marker = L.marker([36.837, 10.235], { icon }).addTo(this.map);

        // Map Click Listener
        this.map.on('click', (e: L.LeafletMouseEvent) => {
          this.handleMapClick(e.latlng.lat, e.latlng.lng);
        });

        // Trigger resize to fix tile issues
        setTimeout(() => this.map?.invalidateSize(), 200);
      }
    }, 50);

    // If editing and has location, update map
    if (this.editEvent?.location) {
      this.updateMapForLocation(this.editEvent.location);
    }
  }

  onLocationInput(e: any): void {
    const val = e.target.value;
    this.showDefaultCities = !val;
    this.searchSubject.next(val);
  }

  onLocationFocus(): void {
    if (!this.form.get('location')?.value) {
      this.showDefaultCities = true;
    }
  }

  onLocationBlur(): void {
    // Small timeout to allow click on suggestion
    setTimeout(() => {
      this.showDefaultCities = false;
    }, 200);
  }

  selectLocation(item: any): void {
    this.form.patchValue({ location: item.display_name });
    this.suggestions = [];
    this.showDefaultCities = false;

    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    if (this.map && this.marker) {
      this.map.setView([lat, lon], 15);
      this.marker.setLatLng([lat, lon]);
    }
  }

  private handleMapClick(lat: number, lon: number): void {
    if (!this.map || !this.marker) return;

    this.marker.setLatLng([lat, lon]);
    this.map.panTo([lat, lon]);

    // Reverse Geocoding via Nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&countrycodes=tn`)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          this.form.patchValue({ location: data.display_name });
        }
      })
      .catch(() => { });
  }

  private updateMapForLocation(location: string): void {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          if (this.map && this.marker) {
            this.map.setView([lat, lon], 14);
            this.marker.setLatLng([lat, lon]);
          }
        }
      });
  }

  loadEvent(id: number): void {
    this.loading = true;
    this.api.getById(id).subscribe({
      next: (e) => {
        this.editEvent = e;
        this.form.patchValue({
          title: e.title,
          description: e.description ?? '',
          type: e.type,
          mode: e.mode,
          dateStart: e.dateStart.slice(0, 16),
          dateEnd: e.dateEnd.slice(0, 16),
          meetingLink: e.meetingLink ?? '',
          location: e.location ?? '',
          maxParticipants: e.maxParticipants
        });

        // Load program
        this.programControls.clear();
        if (e.program && e.program.length > 0) {
          e.program.forEach(p => this.addProgramItem(p.time, p.activity));
        } else {
          this.addProgramItem('09:00', 'Accueil et Introduction');
        }

        this.loading = false;
        if (e.location) this.updateMapForLocation(e.location);
      },
      error: () => {
        this.router.navigate(['/events']);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    if ((v.mode === 'ONLINE' || v.mode === 'HYBRID') && !(v.meetingLink ?? '').trim()) {
      this.submitError = 'Le lien de réunion est requis pour cet événement.';
      return;
    }
    if ((v.mode === 'ONSITE' || v.mode === 'HYBRID') && !(v.location ?? '').trim()) {
      this.submitError = 'Le lieu est requis pour cet événement.';
      return;
    }

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
      trainerFirstName: this.auth.getCurrentUser()?.firstName,
      trainerLastName: this.auth.getCurrentUser()?.lastName,
      program: v.program as any[]
    };

    this.submitError = null;
    this.loading = true;

    const obs = this.editEvent
      ? this.api.update(this.editEvent.id, body)
      : this.api.create(body);

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.refreshService.triggerRefresh();
        this.router.navigate(['/events'], { queryParams: { tab: 'my-events' } });
      },
      error: (err) => {
        let msg = 'Erreur lors de l\'enregistrement';
        if (typeof err?.error === 'string') {
          msg = err.error;
        } else if (err?.error?.message) {
          msg = err.error.message;
        } else if (err?.message) {
          msg = err.message;
        }
        this.submitError = msg;
        this.loading = false;
        console.error('Submit error:', err);
      },
    });
  }
}
