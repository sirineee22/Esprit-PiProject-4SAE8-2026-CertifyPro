import { Component, OnInit, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { JobOfferService } from '../../core/services/job-offer.service';
import { JobOffer, JobFilter, CONTRACT_TYPES, EXPERIENCE_LEVELS, SECTORS, BADGE_COLORS } from '../../core/models/job-offer.model';
import { PageResponse } from '../../core/models/api-response.model';

@Component({
    selector: 'app-job-search',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './job-search.component.html',
    styleUrls: ['./job-search.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobSearchComponent implements OnInit {

    offers: JobOffer[] = [];
    pageResponse: PageResponse<JobOffer> | null = null;

    filter: JobFilter = {};
    page: number = 0;
    size: number = 10;
    loading: boolean = false;
    viewMode: 'list' | 'grid' = 'list';

    contractTypes = CONTRACT_TYPES;
    experienceLevels = EXPERIENCE_LEVELS;
    sectors = SECTORS;
    badgeColors = BADGE_COLORS;

    constructor(
        private jobOfferService: JobOfferService,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        this.loadJobs();
    }

    loadJobs(): void {
        this.loading = true;
        this.jobOfferService.searchPublicJobs(this.filter, this.page, this.size).subscribe({
            next: (res) => {
                this.ngZone.run(() => {
                    this.pageResponse = res.data;
                    this.offers = this.pageResponse?.content || [];
                    this.loading = false;
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
                    console.error('Error loading jobs', err);
                    this.loading = false;
                });
            }
        });
    }

    onFilterChange(): void {
        this.page = 0;
        this.loadJobs();
    }

    onPageChange(newPage: number): void {
        this.page = newPage;
        this.loadJobs();
    }

    getBadgeColor(key: string): string {
        return this.badgeColors[key] || 'secondary';
    }

    formatSalary(min?: number, max?: number): string {
        return this.jobOfferService.formatSalary(min, max);
    }
}
