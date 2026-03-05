import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { JobApplicationService } from '../../../core/services/job-application.service';
import { JobOffer } from '../../../core/models/job-offer.model';
import {
    JobApplication,
    APPLICATION_STATUS_COLORS,
    APPLICATION_STATUS_LABELS,
    UpdateApplicationStatusRequest
} from '../../../core/models/job-application.model';
import { JobOfferService } from '../../../core/services/job-offer.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-offer-applications',
    standalone: true,
    imports: [CommonModule, RouterModule, NgbDropdownModule],
    templateUrl: './offer-applications.component.html',
    styleUrls: ['./offer-applications.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferApplicationsComponent implements OnInit {

    offerId!: string;
    offer: JobOffer | null = null;
    applications: JobApplication[] = [];
    loading = false;

    statusColors = APPLICATION_STATUS_COLORS;
    statusLabels = APPLICATION_STATUS_LABELS;

    constructor(
        private route: ActivatedRoute,
        private jobApplicationService: JobApplicationService,
        private jobOfferService: JobOfferService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.offerId = this.route.snapshot.paramMap.get('id') as string;
        if (this.offerId) {
            this.loadOffer();
            this.loadApplications();
        }
    }

    loadOffer(): void {
        this.jobOfferService.getEmployerOffer(this.offerId).subscribe({
            next: (res) => {
                this.offer = res.data;
                this.cdr.markForCheck();
            },
            error: () => {
                this.offer = null;
                this.cdr.markForCheck();
            }
        });
    }

    loadApplications(): void {
        this.loading = true;
        this.cdr.markForCheck();

        this.jobApplicationService.getApplicationsForOffer(this.offerId).subscribe({
            next: (res) => {
                this.applications = res.data;
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                Swal.fire('Erreur', 'Impossible de charger les candidatures.', 'error');
                this.cdr.markForCheck();
            }
        });
    }

    updateStatus(applicationId: string, status: string): void {
        const request: UpdateApplicationStatusRequest = { status };

        this.jobApplicationService.updateApplicationStatus(applicationId, request).subscribe({
            next: () => {
                Swal.fire('Succès', 'Statut de la candidature mis à jour.', 'success');
                this.loadApplications();
            },
            error: (err) => {
                console.error(err);
                Swal.fire('Erreur', err.error?.message || 'Impossible de mettre à jour le statut.', 'error');
            }
        });
    }

    getScoreColor(score: number): string {
        if (score >= 80) return 'text-success';
        if (score >= 50) return 'text-warning';
        return 'text-danger';
    }
}