import { Component, OnInit, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JobOfferService } from '../../../core/services/job-offer.service';
import { CONTRACT_TYPES, EXPERIENCE_LEVELS, SECTORS, CreateJobOfferRequest } from '../../../core/models/job-offer.model';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-offer-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './offer-form.component.html',
    styleUrls: ['./offer-form.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferFormComponent implements OnInit {

    offerForm!: FormGroup;
    isEditMode: boolean = false;
    offerId: string | null = null;
    loading: boolean = false;
    submitting: boolean = false;

    contractTypes = CONTRACT_TYPES;
    experienceLevels = EXPERIENCE_LEVELS;
    sectors = SECTORS;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private jobOfferService: JobOfferService,
        private ngZone: NgZone
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.offerId = this.route.snapshot.paramMap.get('id');
        if (this.offerId) {
            this.isEditMode = true;
            this.loadOfferData(this.offerId);
        }
    }

    initForm(): void {
        this.offerForm = this.fb.group({
            title: ['', Validators.required],
            description: ['', Validators.required],
            location: ['', Validators.required],
            contractType: ['CDI', Validators.required],
            experienceLevel: ['MID_LEVEL', Validators.required],
            sector: ['IT', Validators.required],
            remote: [false],
            salaryMin: [null],
            salaryMax: [null],
            deadline: [''],
            status: ['DRAFT', Validators.required],
            requiredSkills: this.fb.array([this.fb.control('')])
        });
    }

    get skillsArray() {
        return this.offerForm.get('requiredSkills') as FormArray;
    }

    addSkill() {
        this.skillsArray.push(this.fb.control(''));
    }

    removeSkill(index: number) {
        if (this.skillsArray.length > 1) {
            this.skillsArray.removeAt(index);
        }
    }

    loadOfferData(id: string): void {
        this.loading = true;
        this.jobOfferService.getEmployerOffer(id).subscribe({
            next: (res) => {
                this.ngZone.run(() => {
                    const offer = res.data;
                    this.offerForm.patchValue({
                        title: offer.title,
                        description: offer.description,
                        location: offer.location,
                        contractType: offer.contractType,
                        experienceLevel: offer.experienceLevel,
                        sector: offer.sector,
                        remote: offer.remote,
                        salaryMin: offer.salaryMin,
                        salaryMax: offer.salaryMax,
                        deadline: offer.deadline ? offer.deadline.substring(0, 10) : '',
                        status: offer.status
                    });

                    if (offer.requiredSkills && offer.requiredSkills.length > 0) {
                        this.skillsArray.clear();
                        offer.requiredSkills.forEach(skill => {
                            this.skillsArray.push(this.fb.control(skill));
                        });
                    }
                    this.loading = false;
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
                    console.error(err);
                    this.loading = false;
                    Swal.fire('Erreur', 'Impossible de charger les données de l\'offre.', 'error');
                    this.router.navigate(['/employer/jobs']);
                });
            }
        });
    }

    onSubmit(): void {
        if (this.offerForm.invalid) {
            this.offerForm.markAllAsTouched();
            return;
        }

        this.submitting = true;
        const formValue = this.offerForm.value;

        // Format payload
        const payload: CreateJobOfferRequest = {
            ...formValue,
            deadline: formValue.deadline ? `${formValue.deadline}T23:59:59` : undefined,
            requiredSkills: formValue.requiredSkills.filter((s: string) => s.trim() !== '')
        };

        const request$ = this.isEditMode
            ? this.jobOfferService.updateOffer(this.offerId!, payload)
            : this.jobOfferService.createOffer(payload);

        request$.subscribe({
            next: () => {
                this.ngZone.run(() => {
                    this.submitting = false;
                    Swal.fire('Succès', `Offre ${this.isEditMode ? 'mise à jour' : 'créée'} avec succès !`, 'success');
                    this.router.navigate(['/employer/jobs']);
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
                    console.error(err);
                    this.submitting = false;
                    Swal.fire('Erreur', 'Une erreur est survenue.', 'error');
                });
            }
        });
    }
}
