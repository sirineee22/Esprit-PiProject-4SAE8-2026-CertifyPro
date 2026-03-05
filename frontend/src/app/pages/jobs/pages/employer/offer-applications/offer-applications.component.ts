import { Component, OnInit, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { JobApplicationService } from '../../../core/services/job-application.service';
import { JobOfferService } from '../../../core/services/job-offer.service';
import { JobApplication, APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS } from '../../../core/models/job-application.model';
import { JobOffer } from '../../../core/models/job-offer.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-offer-applications',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './offer-applications.component.html',
    styleUrls: ['./offer-applications.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferApplicationsComponent implements OnInit {

    offerId: string | null = null;
    offer: JobOffer | null = null;
    applications: JobApplication[] = [];
    loading: boolean = false;

    statusColors = APPLICATION_STATUS_COLORS;
    statusLabels = APPLICATION_STATUS_LABELS;

    constructor(
        private route: ActivatedRoute,
        private jobApplicationService: JobApplicationService,
        private jobOfferService: JobOfferService,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        this.offerId = this.route.snapshot.paramMap.get('id');
        if (this.offerId) {
            this.loadData();
        }
    }

    loadData(): void {
        this.loading = true;

        // Load Offer details
        this.jobOfferService.getEmployerOffer(this.offerId!).subscribe({
            next: (res) => {
                this.ngZone.run(() => {
                    this.offer = res.data;
                });
            }
        });

        // Load Applications
        this.jobApplicationService.getApplicationsForOffer(this.offerId!).subscribe({
            next: (res) => {
                this.ngZone.run(() => {
                    this.applications = res.data;
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

    updateStatus(appId: string, status: string): void {
        this.jobApplicationService.updateApplicationStatus(appId, { status }).subscribe({
            next: () => {
                this.ngZone.run(() => {
                    Swal.fire('Succès', 'Statut mis à jour', 'success');
                    this.loadData();
                });
            }
        });
    }

    getScoreColor(score: number): string {
        if (score >= 80) return 'text-success';
        if (score >= 50) return 'text-warning';
        return 'text-danger';
    }
}
