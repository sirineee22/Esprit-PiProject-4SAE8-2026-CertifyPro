import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-post-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.edit ? 'Edit Post' : 'Create New Post' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="postForm" class="post-form">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="What's on your mind?">
          <mat-error *ngIf="postForm.get('title')?.hasError('required')">Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Content</mat-label>
          <textarea matInput formControlName="content" rows="5" placeholder="Share your thoughts..."></textarea>
          <mat-error *ngIf="postForm.get('content')?.hasError('required')">Content is required</mat-error>
        </mat-form-field>

        <div class="file-upload">
          <button type="button" mat-stroked-button (click)="fileInput.click()">
            <mat-icon>image</mat-icon>
            {{ selectedFile ? selectedFile.name : 'Upload Image' }}
          </button>
          <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" style="display: none">
          <button *ngIf="selectedFile" type="button" mat-icon-button color="warn" (click)="removeFile()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="postForm.invalid" (click)="onSubmit()">
        {{ data.edit ? 'Update' : 'Post' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .post-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 400px;
      padding-top: 1rem;
    }
    .file-upload {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 0.5rem;
    }
  `]
})
export class PostModalComponent {
  postForm: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PostModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.postForm = this.fb.group({
      title: [data.post?.title || '', Validators.required],
      content: [data.post?.content || '', Validators.required]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  removeFile() {
    this.selectedFile = null;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.postForm.valid) {
      const formData = new FormData();
      formData.append('title', this.postForm.value.title);
      formData.append('content', this.postForm.value.content);
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }
      this.dialogRef.close(formData);
    }
  }
}
