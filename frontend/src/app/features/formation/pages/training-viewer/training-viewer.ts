import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { Training } from '../../../../shared/models/formation.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-training-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './training-viewer.html',
  styleUrl: './training-viewer.css'
})
export class TrainingViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trainingService = inject(TrainingService);
  private sanitizer = inject(DomSanitizer);

  training = signal<Training | null>(null);
  safeUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.trainingService.getTrainingById(Number(id));
      if (found) {
        this.training.set(found);
        if (found.contentUrl && found.contentUrl !== '#') {
          this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(found.contentUrl));
        }
      } else {
        this.router.navigate(['/trainings']);
      }
    }
  }

  goBack() {
    this.router.navigate(['/trainings']);
  }
}
