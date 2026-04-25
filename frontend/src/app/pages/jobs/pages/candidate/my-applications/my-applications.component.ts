import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobApplicationService } from '../../../core/services/job-application.service';
import { JobApplication, APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS } from '../../../core/models/job-application.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-my-applications',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './my-applications.component.html',
    styleUrls: ['./my-applications.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyApplicationsComponent implements OnInit {

    applications: JobApplication[] = [];
    loading = false;

    statusColors = APPLICATION_STATUS_COLORS;
    statusLabels = APPLICATION_STATUS_LABELS;

    constructor(
        private jobApplicationService: JobApplicationService,
        private cdr: ChangeDetectorRef   // ✅ NgZone remplacé par ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadApplications();
    }

    loadApplications(): void {
        this.loading = true;
        this.cdr.markForCheck();

        this.jobApplicationService.getMyApplications().subscribe({
            next: (res) => {
                this.applications = res.data;
                this.loading = false;
                this.cdr.markForCheck(); // ✅ Déclenche la détection de changements
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    withdraw(id: string): void {
        Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: 'Voulez-vous vraiment retirer cette candidature ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, retirer',
            cancelButtonText: 'Annuler',
            background: '#1a1a2e',
            color: '#f8fafc'
        }).then((result) => {
            if (result.isConfirmed) {
                this.jobApplicationService.withdrawApplication(id).subscribe({
                    next: () => {
                        Swal.fire({
                            title: 'Retiré !',
                            text: 'Votre candidature a été retirée.',
                            icon: 'success',
                            background: '#1a1a2e',
                            color: '#f8fafc'
                        });
                        this.loadApplications();
                    },
                    error: (err) => {
                        Swal.fire({
                            title: 'Erreur',
                            text: err.error?.message || 'Impossible de retirer la candidature',
                            icon: 'error',
                            background: '#1a1a2e',
                            color: '#f8fafc'
                        });
                    }
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