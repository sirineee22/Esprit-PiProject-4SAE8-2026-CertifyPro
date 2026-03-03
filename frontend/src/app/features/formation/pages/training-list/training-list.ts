import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Training } from '../../../../shared/models/formation.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { TrainingService } from '../../services/training.service';
import { ProgressionService } from '../../services/progression.service';

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
  private router = inject(Router);

  trainings = this.trainingService.trainings;
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
    // Artificial delay to simulate loading
    setTimeout(() => {
      this.isLoading.set(false);
    }, 800);
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
}
