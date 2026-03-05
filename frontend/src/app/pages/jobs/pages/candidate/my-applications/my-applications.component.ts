import { Component, OnInit, ChangeDetectionStrategy, NgZone } from '@angular/core';
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
    loading: boolean = false;

    statusColors = APPLICATION_STATUS_COLORS;
    statusLabels = APPLICATION_STATUS_LABELS;

    constructor(
        private jobApplicationService: JobApplicationService,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        this.loadApplications();
    }

    loadApplications(): void {
        this.loading = true;
        this.jobApplicationService.getMyApplications().subscribe({
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

    withdraw(id: string): void {
        Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: "Voulez-vous vraiment retirer cette candidature ?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, retirer',
            cancelButtonText: 'Annuler'
        }).then((result: any) => {
            if (result.isConfirmed) {
                this.jobApplicationService.withdrawApplication(id).subscribe({
                    next: () => {
                        this.ngZone.run(() => {
                            Swal.fire('Retiré !', 'Votre candidature a été retirée.', 'success');
                            this.loadApplications();
                        });
                    },
                    error: (err) => {
                        this.ngZone.run(() => {
                            Swal.fire('Erreur', err.error?.message || 'Impossible de retirer la candidature', 'error');
                        });
                    }
                });
            }
        });
    }

    getScoreColor(score: number): string {
        if (score >= 80) return 'text-success';
        if (score >= 50) return 'text-warning';
        return 'bg-danger'; // For progress bars if needed, but text color logic works.
    }
}
