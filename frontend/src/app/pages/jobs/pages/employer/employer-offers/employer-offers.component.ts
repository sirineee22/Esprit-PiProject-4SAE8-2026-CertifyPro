import { Component, OnInit, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobOfferService } from '../../../core/services/job-offer.service';
import { JobOffer, BADGE_COLORS } from '../../../core/models/job-offer.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-employer-offers',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './employer-offers.component.html',
    styleUrls: ['./employer-offers.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployerOffersComponent implements OnInit {

    offers: JobOffer[] = [];
    loading: boolean = false;
    badgeColors = BADGE_COLORS;

    constructor(
        private jobOfferService: JobOfferService,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        this.loadOffers();
    }

    loadOffers(): void {
        this.loading = true;
        this.jobOfferService.getEmployerOffers().subscribe({
            next: (res) => {
                this.ngZone.run(() => {
                    this.offers = res.data;
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

    publish(id: string): void {
        this.jobOfferService.publishOffer(id).subscribe(() => this.loadOffers());
    }

    close(id: string): void {
        this.jobOfferService.closeOffer(id).subscribe(() => this.loadOffers());
    }

    delete(id: string): void {
        Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: "Cette action est irréversible !",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        }).then((result: any) => {
            if (result.isConfirmed) {
                this.jobOfferService.deleteOffer(id).subscribe(() => {
                    Swal.fire('Supprimé !', 'L\'offre a été supprimée.', 'success');
                    this.loadOffers();
                });
            }
        });
    }

    getBadgeColor(key: string): string {
        return this.badgeColors[key] || 'secondary';
    }
}
