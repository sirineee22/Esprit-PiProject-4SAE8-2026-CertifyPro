import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionService, SessionSchedule } from '../../services/session.api';
import { AuthService } from '../../../../core/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-my-sessions',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './my-sessions.component.html',
    styleUrls: ['./my-sessions.component.css']
})
export class MySessionsComponent implements OnInit, OnDestroy {
    private sessionService = inject(SessionService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    sessions: SessionSchedule[] = [];
    loading = true;
    error: string | null = null;
    private sub = new Subscription();

    ngOnInit(): void {
        this.sub.add(
            this.authService.currentUser$.subscribe(user => {
                if (user && user.id) {
                    this.loadSessions(user.id);
                } else if (user) {
                    this.error = "Profil utilisateur incomplet";
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            })
        );
    }

    loadSessions(trainerId?: number): void {
        this.loading = true;
        this.error = null;

        const id = trainerId || this.authService.getCurrentUser()?.id;

        if (!id) {
            this.error = "Profil utilisateur introuvable";
            this.loading = false;
            this.cdr.detectChanges();
            return;
        }

        this.sessionService.getSessionsByTrainer(id).subscribe({
            next: (data) => {
                if (Array.isArray(data)) {
                    this.sessions = data.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
                } else {
                    this.sessions = [];
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Fetch error:', err);
                this.error = "Impossible de charger les sessions. Veuillez réessayer plus tard.";
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }


    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    toggleStatus(session: SessionSchedule): void {
        const newStatus = session.status === 'SCHEDULED' ? 'CANCELLED' : 'SCHEDULED';

        this.sessionService.updateSessionStatus(session.id, newStatus).subscribe({
            next: (updated) => {
                const index = this.sessions.findIndex(s => s.id === updated.id);
                if (index !== -1) {
                    this.sessions[index] = updated;
                }
            },
            error: (err) => {
                console.error('Failed to update status', err);
                // Optionally show a toast/alert
            }
        });
    }

    isFuture(startTime: string): boolean {
        return new Date(startTime).getTime() > new Date().getTime();
    }

    getStatusClass(status: string): string {
        return `status-${status.toLowerCase()}`;
    }
}
