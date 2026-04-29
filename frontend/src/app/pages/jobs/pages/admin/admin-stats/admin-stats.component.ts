import { Component, OnInit, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobOfferService } from '../../../core/services/job-offer.service';
import { DashboardStats } from '../../../core/models/api-response.model';

@Component({
    selector: 'app-admin-stats',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-stats.component.html',
    styleUrls: ['./admin-stats.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminStatsComponent implements OnInit {

    stats: DashboardStats | null = null;
    loading: boolean = false;

    constructor(
        private jobOfferService: JobOfferService,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.loading = true;
        this.jobOfferService.getAdminStats().subscribe({
            next: (res) => {
                this.ngZone.run(() => {
                    this.stats = res.data;
                    this.loading = false;
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
                    console.error(err);
                    this.loading = false;
                });
            }
        });
    }
}
