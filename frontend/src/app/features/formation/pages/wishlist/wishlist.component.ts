import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Training } from '../../../../shared/models/formation.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { TrainingService } from '../../services/training.service';
import { FavoriteService } from '../../services/favorite.service';

@Component({
    selector: 'app-wishlist',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './wishlist.component.html',
    styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {
    private favoriteService = inject(FavoriteService);
    private trainingService = inject(TrainingService);
    private authService = inject(AuthService);
    private router = inject(Router);

    favorites = this.favoriteService.favorites;
    isLoading = signal(true);
    currentUser = this.authService.getCurrentUser();

    ngOnInit() {
        if (this.currentUser?.id) {
            this.favoriteService.loadFavorites(this.currentUser.id).finally(() => {
                this.isLoading.set(false);
            });
        } else {
            this.isLoading.set(false);
            this.router.navigate(['/login']);
        }
    }

    joinTraining(training: Training) {
        if (training.id) {
            this.router.navigate(['/trainings/view', training.id]);
        }
    }

    onToggleFavorite(event: Event, training: Training) {
        event.stopPropagation();
        if (training.id && this.currentUser?.id) {
            this.favoriteService.toggleFavorite(this.currentUser.id, training.id).subscribe({
                next: () => {
                    // Refresh the list immediately
                    if (this.currentUser?.id) {
                        this.favoriteService.loadFavorites(this.currentUser.id);
                        this.trainingService.loadTrainings(); // Sync main list too
                    }
                }
            });
        }
    }
}
