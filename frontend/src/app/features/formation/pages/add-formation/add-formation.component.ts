import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Training } from '../../../../shared/models/formation.model';
import { TrainingService } from '../../services/training.service';

@Component({
  selector: 'app-add-formation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="formation-container">
      <!-- Decoration Elements -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      
      <div class="form-wrapper animate-slide-up">
        <!-- Floating Header -->
        <header class="form-header">
          <div class="header-content">
             <div class="icon-badge">
               <i class="bi" [ngClass]="isEditMode() ? 'bi-pencil-square' : 'bi-mortarboard-fill'"></i>
             </div>
             <div>
               <h1>{{ isEditMode() ? 'Update Training' : 'Create New Content' }}</h1>
               <p>{{ isEditMode() ? 'Refine your lesson details and content' : 'Design a premium learning experience for your audience' }}</p>
             </div>
          </div>
          <button (click)="onCancel()" class="close-btn">
            <i class="bi bi-x-lg"></i>
          </button>
        </header>

        <form [formGroup]="formationForm" (ngSubmit)="onSubmit()" class="modern-form">
          <div class="form-body">
            
            <!-- Type Selection -->
            <div class="type-selector-group">
              <label class="group-label">Resource Type</label>
              <div class="type-cards">
                <label class="type-card" [class.active]="formationForm.get('trainingType')?.value === 'PDF'">
                  <input type="radio" formControlName="trainingType" value="PDF" class="hidden-radio">
                  <div class="card-ui">
                    <i class="bi bi-file-earmark-pdf"></i>
                    <span>PDF Document</span>
                  </div>
                </label>
                <label class="type-card" [class.active]="formationForm.get('trainingType')?.value === 'VIDEO'">
                  <input type="radio" formControlName="trainingType" value="VIDEO" class="hidden-radio">
                  <div class="card-ui">
                    <i class="bi bi-play-btn"></i>
                    <span>Video Capsule</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="main-fields">
              <div class="input-row">
                <div class="field-box">
                  <label>Training Title</label>
                  <div class="input-container">
                    <input type="text" formControlName="title" placeholder="e.g., Mastering Modern Architecture" [class.is-invalid]="formationForm.get('title')?.touched && formationForm.get('title')?.invalid">
                  </div>
                  <small class="error-text" *ngIf="formationForm.get('title')?.touched && formationForm.get('title')?.invalid">
                    Title is required and helps students find your content.
                  </small>
                </div>
              </div>

              <div class="input-row split">
                <div class="field-box">
                  <label>Expertise Level</label>
                  <select formControlName="level">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div class="field-box">
                  <label>Duration</label>
                  <input type="text" formControlName="duration" placeholder="e.g., 12 Hours" [class.is-invalid]="formationForm.get('duration')?.touched && formationForm.get('duration')?.invalid">
                  <small class="error-text" *ngIf="formationForm.get('duration')?.touched && formationForm.get('duration')?.invalid">
                    Please specify the duration.
                  </small>
                </div>
              </div>

              <div class="field-box">
                <label>Description</label>
                <textarea formControlName="description" rows="3" placeholder="Tell your students what they will achieve..." [class.is-invalid]="formationForm.get('description')?.touched && formationForm.get('description')?.invalid"></textarea>
                <small class="error-text" *ngIf="formationForm.get('description')?.touched && formationForm.get('description')?.invalid">
                  A good description increases enrollment rates.
                </small>
              </div>

              <!-- Upload Section -->
              <div class="upload-section">
                <label class="group-label">Content Upload</label>
                <div class="drop-zone" [class.has-file]="!!selectedFileName()">
                  <input type="file" id="fileInput" (change)="onFileSelected($event)" class="file-input" 
                         [accept]="formationForm.get('trainingType')?.value === 'PDF' ? '.pdf' : 'video/*'">
                  
                  <div class="drop-zone-content" *ngIf="!selectedFileName()">
                    <div class="upload-icon">
                      <i class="bi" [ngClass]="formationForm.get('trainingType')?.value === 'PDF' ? 'bi-cloud-arrow-up' : 'bi-camera-video'"></i>
                    </div>
                    <p>Click or drag your <strong>{{ formationForm.get('trainingType')?.value }}</strong> file here</p>
                    <span>Max size: 50MB</span>
                  </div>

                  <div class="file-info" *ngIf="selectedFileName()">
                    <i class="bi bi-check-circle-fill text-success"></i>
                    <div class="file-details">
                      <span class="file-name">{{ selectedFileName() }}</span>
                      <span class="file-size">{{ selectedFileSize() }}</span>
                    </div>
                    <button type="button" class="remove-file" (click)="removeFile()">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer class="form-footer">
            <button type="button" class="btn-cancel" (click)="onCancel()">Discard</button>
            <button type="submit" class="btn-submit" [disabled]="formationForm.invalid || isSubmitting() || (!isEditMode() && !selectedFile())">
              <span *ngIf="!isSubmitting()">{{ isEditMode() ? 'Save Changes' : 'Publish Training' }}</span>
              <span class="loader" *ngIf="isSubmitting()"></span>
            </button>
          </footer>
        </form>
      </div>

      <!-- Success Interaction -->
      <div class="overlay animate-fade" *ngIf="showToast()">
        <div class="success-card animate-scale">
          <div class="confetti"></div>
          <div class="success-icon">
            <i class="bi bi-check2"></i>
          </div>
          <h2>{{ isEditMode() ? 'Updated!' : 'Great Success!' }}</h2>
          <p>{{ isEditMode() ? 'Your training changes have been saved.' : 'Your training has been published and is now live.' }}</p>
          <button (click)="closeToast()" class="btn-done">Wonderful</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .formation-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      padding: 2rem;
      position: relative;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }

    /* Background blobs */
    .blob {
      position: absolute;
      width: 500px;
      height: 500px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      filter: blur(100px);
      border-radius: 50%;
      opacity: 0.15;
      z-index: 0;
      pointer-events: none; /* Fix: Prevent blobs from capturing clicks */
    }
    .blob-1 { top: -200px; right: -100px; }
    .blob-2 { bottom: -200px; left: -100px; background: #f59e0b; }

    .form-wrapper {
      width: 100%;
      max-width: 650px;
      background: rgba(255, 255, 255, 1);
      border-radius: 2rem;
      box-shadow: 0 40px 80px -20px rgba(0,0,0,0.5);
      position: relative;
      z-index: 10;
      overflow: hidden;
    }

    .form-header {
      padding: 2rem;
      background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content { display: flex; align-items: center; gap: 1.5rem; }
    
    .icon-badge {
      width: 50px;
      height: 50px;
      background: #3b82f6;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.5);
    }

    .form-header h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
    .form-header p { font-size: 0.875rem; color: #64748b; margin: 0; }
    
    .close-btn {
      background: #f1f5f9;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #94a3b8;
      transition: all 0.2s;
    }
    .close-btn:hover { background: #fee2e2; color: #ef4444; }

    .form-body { padding: 2rem; max-height: 70vh; overflow-y: auto; }

    .group-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    /* Type Selector */
    .type-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .type-card {
      cursor: pointer;
      position: relative;
    }
    .hidden-radio { position: absolute; opacity: 0; pointer-events: none; }
    .card-ui {
      padding: 1.5rem;
      border: 2px solid #f1f5f9;
      border-radius: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s;
      background: white;
    }
    .card-ui i { font-size: 1.75rem; color: #cbd5e1; }
    .card-ui span { font-weight: 700; color: #64748b; font-size: 0.875rem; }

    .type-card.active .card-ui {
      border-color: #3b82f6;
      background: #eff6ff;
      transform: translateY(-4px);
      box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.15);
    }
    .type-card.active i { color: #3b82f6; }
    .type-card.active span { color: #1e40af; }

    /* Inputs */
    .main-fields { display: flex; flex-direction: column; gap: 1.5rem; }
    .field-box { display: flex; flex-direction: column; gap: 0.5rem; }
    .field-box label { font-size: 0.875rem; font-weight: 700; color: #475569; }
    
    .input-row.split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    input, select, textarea {
      padding: 0.875rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      background: #f8fafc;
      font-family: inherit;
      font-size: 0.95rem;
      transition: all 0.2s;
      position: relative;
      z-index: 2;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #3b82f6;
      background: white;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    /* Drop Zone */
    .drop-zone {
      border: 2px dashed #e2e8f0;
      border-radius: 1rem;
      padding: 2.5rem;
      text-align: center;
      position: relative;
      transition: all 0.3s;
      background: #f8fafc;
    }
    .drop-zone:hover { border-color: #3b82f6; background: #f0f7ff; }
    .drop-zone.has-file { border-style: solid; border-color: #10b981; background: #f0fdf4; border-width: 1px; }

    .file-input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }

    .upload-icon {
      width: 48px;
      height: 48px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      color: #3b82f6;
      font-size: 1.25rem;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }

    .drop-zone-content p { font-size: 0.875rem; margin-bottom: 0.25rem; color: #475569; }
    .drop-zone-content span { font-size: 0.75rem; color: #94a3b8; }

    .file-info { display: flex; align-items: center; gap: 1rem; text-align: left; }
    .file-details { flex-grow: 1; display: flex; flex-direction: column; }
    .file-name { font-weight: 700; color: #065f46; font-size: 0.875rem; }
    .file-size { font-size: 0.75rem; color: #059669; }
    .remove-file {
      background: white;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ef4444;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    /* Footer */
    .form-footer {
      padding: 1.5rem 2rem;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .btn-cancel {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: none;
      color: #64748b;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cancel:hover { color: #0f172a; }

    .btn-submit {
      padding: 0.75rem 2rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
      transition: all 0.2s;
    }
    .btn-submit:hover:not(:disabled) { background: #2563eb; transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(59, 130, 246, 0.5); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

    /* Success Overlay */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .success-card {
      background: white;
      padding: 3.5rem 2.5rem;
      border-radius: 2.5rem;
      text-align: center;
      max-width: 400px;
      width: 100%;
      position: relative;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: #eff6ff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: #3b82f6;
      font-size: 2.5rem;
    }

    .success-card h2 { font-size: 1.75rem; font-weight: 900; color: #0f172a; margin-bottom: 0.5rem; }
    .success-card p { color: #64748b; margin-bottom: 2rem; }
    
    .btn-done {
      width: 100%;
      padding: 1rem;
      background: #0f172a;
      color: white;
      border: none;
      border-radius: 1rem;
      font-weight: 700;
      cursor: pointer;
    }

    /* Animations */
    .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-scale { animation: scale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .animate-fade { animation: fadeIn 0.3s ease; }

    @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes scale { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Custom Scrollbar */
    .form-body::-webkit-scrollbar { width: 6px; }
    .form-body::-webkit-scrollbar-track { background: transparent; }
    .form-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

    .error-text {
      color: #ef4444;
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.25rem;
      display: block;
      animation: fadeIn 0.3s ease;
    }

    input.is-invalid, textarea.is-invalid, select.is-invalid {
      border-color: #ef4444;
      background: #fffafa;
    }

    input.is-invalid:focus, textarea.is-invalid:focus, select.is-invalid:focus {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    }
  `]
})
export class AddFormationComponent implements OnInit {
  formationForm: FormGroup;
  isSubmitting = signal(false);
  showToast = signal(false);
  isEditMode = signal(false);
  trainingId = signal<number | null>(null);

  // File Upload State
  selectedFile = signal<File | null>(null);
  selectedFileName = signal<string>('');
  selectedFileSize = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private trainingService: TrainingService
  ) {
    this.formationForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      level: ['Beginner', Validators.required],
      duration: ['', Validators.required],
      trainingType: ['PDF', Validators.required]
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.trainingId.set(Number(id));

      // Try to get from signal first
      const training = this.trainingService.getTrainingById(Number(id));
      if (training) {
        this.formationForm.patchValue(training);
        if (training.contentUrl) {
          this.selectedFileName.set('Current linked file (will keep unless replaced)');
        }
      } else {
        // Fetch from API if signal is empty (page refresh)
        this.trainingService.fetchTrainingById(Number(id)).subscribe({
          next: (data) => {
            this.formationForm.patchValue(data);
            if (data.contentUrl) {
              this.selectedFileName.set('Current linked file (will keep unless replaced)');
            }
          },
          error: () => this.router.navigate(['/trainings'])
        });
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      this.selectedFileName.set(file.name);
      this.selectedFileSize.set(this.formatFileSize(file.size));
    }
  }

  removeFile() {
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.selectedFileSize.set('');
    // Clear the input value so the same file can be selected again
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onSubmit() {
    const file = this.selectedFile();
    if (this.formationForm.valid) {
      this.isSubmitting.set(true);
      const trainingData = this.formationForm.value;

      if (this.isEditMode() && this.trainingId()) {
        this.trainingService.updateTraining(this.trainingId()!, trainingData, file || undefined).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.showToast.set(true);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            console.error('Update training failed details:', err);
            alert('Failed to update training. Error: ' + (err.message || 'Unknown error'));
          }
        });
      } else if (file) {
        this.trainingService.addTraining(trainingData, file).subscribe({
          next: (response) => {
            console.log('Training successfully saved to backend:', response);
            this.isSubmitting.set(false);
            this.showToast.set(true);
          },
          error: (error) => {
            console.error('Failed to save training:', error);
            this.isSubmitting.set(false);
            alert('Failed to save training. Please try again.');
          }
        });
      }
    }
  }

  closeToast() {
    this.showToast.set(false);
    this.router.navigate(['/trainings']);
  }

  onCancel() {
    this.router.navigate(['/trainings']);
  }
}
