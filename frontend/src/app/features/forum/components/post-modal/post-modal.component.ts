import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
selector:'app-post-modal',
standalone:true,
imports:[
CommonModule,
ReactiveFormsModule,
MatDialogModule,
MatFormFieldModule,
MatInputModule,
MatButtonModule,
MatIconModule
],
template:`

<div class="modal-wrapper">

<h2 mat-dialog-title class="modal-title">
  <mat-icon>edit</mat-icon>
  {{data?.edit ? 'Edit Post' : 'Create Post'}}
</h2>

<mat-dialog-content>

<form [formGroup]="form" class="post-form">

<mat-form-field appearance="outline" class="full-width">

<mat-label>Title</mat-label>

<input matInput formControlName="title" placeholder="Write a short title">

</mat-form-field>


<mat-form-field appearance="outline" class="full-width">

<mat-label>Content</mat-label>

<textarea matInput rows="5"
formControlName="content"
placeholder="Share your thoughts with the community..."></textarea>

</mat-form-field>


<div class="upload-area">

<input #fileInput type="file"
accept="image/*"
hidden
(change)="onFile($event)">

<button
type="button"
mat-stroked-button
class="upload-btn"
(click)="fileInput.click()">

<mat-icon>image</mat-icon>

{{file ? file.name : 'Upload Image'}}

</button>

<button
*ngIf="file"
type="button"
mat-icon-button
color="warn"
(click)="removeFile()">

<mat-icon>close</mat-icon>

</button>

</div>


<div *ngIf="preview" class="image-preview">

<img [src]="preview">

</div>

</form>

</mat-dialog-content>

<mat-dialog-actions align="end" class="actions">

<button mat-button (click)="dialogRef.close()">

Cancel

</button>

<button
mat-raised-button
color="primary"
(click)="submit()"
[disabled]="form.invalid">

<mat-icon>send</mat-icon>

Post

</button>

</mat-dialog-actions>

</div>

`,
styles:[`

.modal-wrapper{
padding-top:10px;
}

.modal-title{
display:flex;
align-items:center;
gap:8px;
font-weight:600;
}

.post-form{
display:flex;
flex-direction:column;
gap:18px;
margin-top:10px;
}

.full-width{
width:100%;
}

.upload-area{
display:flex;
align-items:center;
gap:10px;
}

.upload-btn{
border-radius:10px;
padding:8px 14px;
}

.image-preview{
margin-top:10px;
border-radius:10px;
overflow:hidden;
border:1px solid #eee;
}

.image-preview img{
width:100%;
max-height:250px;
object-fit:cover;
}

.actions{
margin-top:10px;
}

`]
})
export class PostModalComponent{

form:FormGroup
file:File|null=null
preview:string|null=null

constructor(
private fb:FormBuilder,
public dialogRef:MatDialogRef<PostModalComponent>,
@Inject(MAT_DIALOG_DATA) public data:any
){

this.form=this.fb.group({
title:['',Validators.required],
content:['',Validators.required]
})

}

onFile(event:any){

const selected=event.target.files[0]

if(!selected) return

this.file=selected

const reader=new FileReader()

reader.onload=()=>{
this.preview=reader.result as string
}

reader.readAsDataURL(selected)

}

removeFile(){

this.file=null
this.preview=null

}

submit(){

const fd=new FormData()

fd.append('title',this.form.value.title)
fd.append('content',this.form.value.content)

if(this.file){
fd.append('image',this.file)
}

this.dialogRef.close(fd)

}

}