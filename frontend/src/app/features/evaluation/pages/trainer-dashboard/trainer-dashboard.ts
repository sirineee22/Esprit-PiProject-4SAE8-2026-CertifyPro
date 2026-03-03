import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsService } from '../../services/statistics.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Stats } from '../../../../shared/models/stats.model';

@Component({
    selector: 'app-trainer-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './trainer-dashboard.html',
    styleUrl: './trainer-dashboard.css'
})
export class TrainerDashboardComponent implements OnInit {
    private statsService = inject(StatisticsService);
    private authService = inject(AuthService);

    stats = signal<Stats | null>(null);
    isLoading = signal(true);
    hasError = signal(false);

    ngOnInit() {
        this.loadStats();
    }

    async loadStats() {
        this.isLoading.set(true);
        this.hasError.set(false);

        const user = this.authService.getCurrentUser();
        if (user?.id) {
            this.statsService.getTrainerStats(user.id).subscribe({
                next: (data) => {
                    this.stats.set(data);
                    this.isLoading.set(false);
                },
                error: (err) => {
                    console.error('Failed to load stats', err);
                    this.hasError.set(true);
                    this.isLoading.set(false);
                }
            });
        } else {
            this.isLoading.set(false);
        }
    }

    getScoreColor(score: number): string {
        if (score >= 80) return '#198754';
        if (score >= 50) return '#0d6efd';
        return '#dc3545';
    }
}
