import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Training } from '../../../../shared/models/formation.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { TrainingService } from '../../services/training.service';
import { ProgressionService } from '../../services/progression.service';
import { FavoriteService } from '../../services/favorite.service';

@Component({
  selector: 'app-training-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './training-list.html',
  styleUrl: './training-list.css'
})
export class TrainingListComponent implements OnInit {
  private trainingService = inject(TrainingService);
  private authService = inject(AuthService);
  private progressionService = inject(ProgressionService);
  private favoriteService = inject(FavoriteService);
  private router = inject(Router);

  trainings = this.trainingService.trainings;
  pagination = this.trainingService.pagination;
  isLoading = signal(true);
  currentUser = this.authService.getCurrentUser();

  isAdmin = false;
  isTrainer = false;

  constructor() {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role?.name === 'ADMIN';
    this.isTrainer = user?.role?.name === 'TRAINER';
  }

  ngOnInit() {
    this.refreshData();
  }

  async refreshData() {
    this.isLoading.set(true);
    await this.trainingService.loadTrainings(this.pagination().currentPage);
    this.isLoading.set(false);
  }

  joinTraining(training: Training) {
    if (training.id) {
      this.router.navigate(['/trainings/view', training.id]);
    }
  }

  onDeleteTraining(event: Event, training: Training) {
    event.stopPropagation(); // Prevent navigation
    if (training.id && confirm(`Are you sure you want to delete "${training.title}"?`)) {
      this.trainingService.deleteTraining(training.id).subscribe({
        next: () => console.log('Training deleted'),
        error: (err) => alert('Failed to delete training')
      });
    }
  }

  onEditTraining(event: Event, training: Training) {
    event.stopPropagation();
    if (training.id) {
      this.router.navigate(['/trainings/edit', training.id]);
    }
  }

  isStudent(): boolean {
    return this.currentUser?.role?.name === 'STUDENT' || this.currentUser?.role?.name === 'LEARNER';
  }

  onStatusChange(event: Event, training: Training) {
    event.stopPropagation();
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as any;

    if (training.id && this.currentUser?.id) {
      this.progressionService.updateStatus(training.id, this.currentUser.id, newStatus).subscribe({
        next: () => {
          this.trainingService.loadTrainings(); // Refresh UI
        },
        error: (err) => alert('Failed to update status')
      });
    }
  }

  onToggleFavorite(event: Event, training: Training) {
    event.stopPropagation();
    if (training.id && this.currentUser?.id) {
      this.favoriteService.toggleFavorite(this.currentUser.id, training.id).subscribe({
        next: () => {
          this.trainingService.loadTrainings(this.pagination().currentPage); // Refresh same page
        },
        error: (err) => alert('Failed to update favorites')
      });
    }
  }

  onPageChange(page: number) {
    this.isLoading.set(true);
    this.trainingService.loadTrainings(page).then(() => {
      this.isLoading.set(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  onNextPage() {
    if (this.pagination().currentPage < this.pagination().totalPages - 1) {
      this.onPageChange(this.pagination().currentPage + 1);
    }
  }

  onPreviousPage() {
    if (this.pagination().currentPage > 0) {
      this.onPageChange(this.pagination().currentPage - 1);
    }
  }
}
