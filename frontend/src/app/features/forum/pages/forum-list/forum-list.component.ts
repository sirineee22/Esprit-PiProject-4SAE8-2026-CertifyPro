import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ForumService } from '../../../../forum/services/forum.service';
import { UserService } from '../../../users/services/users.api';

import { Post } from '../../../../forum/models/post.model';
import { User } from '../../../../shared/models/user.model';
import { PostModalComponent } from '../../components/post-modal/post-modal.component';

@Component({
  selector: 'app-forum-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
<div class="forum">

  <h1>Community Forum</h1>

  <div class="toolbar">

    <input
      type="text"
      [(ngModel)]="searchQuery"
      (input)="filterPosts()"
      placeholder="Search posts..."
      class="search"
    >

    <button mat-raised-button color="primary" (click)="openCreateModal()">
      <mat-icon>add</mat-icon>
      New Post
    </button>

  </div>

 

  
  <div class="posts" *ngIf="!loading">

    <div class="post"
*ngFor="let post of filteredPosts || []"      [routerLink]="['/forum/post', post.id]">

      <div class="post-header">

        <div class="avatar">
          {{getUserInitials(post.userId)}}
        </div>

        <div>
          <div class="author">
            {{getUserFullName(post.userId)}}
          </div>

          <div class="date">
            {{post.createdAt | date:'mediumDate'}}
          </div>
        </div>

      </div>

      <h2>{{post.title}}</h2>

      <p class="excerpt">
        {{post.content | slice:0:120}}...
      </p>

      <div class="actions">

        <button mat-icon-button
          (click)="toggleLike(post); $event.stopPropagation()">

          <mat-icon>
            {{post.isLikedByCurrentUser ? 'favorite' : 'favorite_border'}}
          </mat-icon>

          {{post.reactionCount}}
        </button>

        <button mat-icon-button>
          <mat-icon>chat_bubble_outline</mat-icon>
          {{post.commentCount}}
        </button>

      </div>

    </div>

  </div>

</div>
`,
  styles: [`
.forum{
max-width:1000px;
margin:auto;
padding:2rem;
}

.toolbar{
display:flex;
gap:1rem;
margin:1rem 0;
}

.search{
flex:1;
padding:10px;
border-radius:8px;
border:1px solid #ddd;
}

.posts{
display:flex;
flex-direction:column;
gap:1.5rem;
}

.post{
padding:20px;
border-radius:14px;
background:white;
border:1px solid #eee;
cursor:pointer;
transition:0.2s;
}

.post:hover{
transform:translateY(-3px);
box-shadow:0 10px 25px rgba(0,0,0,0.05);
}

.post-header{
display:flex;
gap:10px;
margin-bottom:10px;
}

.avatar{
width:36px;
height:36px;
border-radius:50%;
background:#e2e8f0;
display:flex;
align-items:center;
justify-content:center;
font-weight:700;
}

.author{
font-weight:600;
}

.date{
font-size:12px;
color:#64748b;
}

.actions{
display:flex;
gap:10px;
margin-top:10px;
}
.loading{
height:200px;
}
.loading{
text-align:center;
padding:3rem;
}
`]
})
export class ForumListComponent implements OnInit {

posts: Post[] = [];
filteredPosts: Post[] = [];
users: Map<number, User> = new Map();

searchQuery = '';
loading = true;

constructor(
private forumService: ForumService,
private userService: UserService,
private dialog: MatDialog
){}

ngOnInit(): void {
this.loadPosts();
}

loadPosts() {

  this.loading = true;

  this.forumService.getAllPosts().subscribe({

    next: (data) => {

      if (!data) data = [];

      this.posts = data;
      this.filteredPosts = [...data];

      // ✅ LOAD USERS
      data.forEach(p => this.ensureUserLoaded(p.userId));

      this.loading = false;

    },

    error: (err) => {

      console.error('Error loading posts', err);

      this.loading = false;

    }

  });

}

filterPosts(){
const q=this.searchQuery.toLowerCase();

this.filteredPosts=this.posts.filter(p =>
p.title.toLowerCase().includes(q) ||
p.content.toLowerCase().includes(q) ||
this.getUserFullName(p.userId).toLowerCase().includes(q)
);
}

ensureUserLoaded(userId:number){
if(!this.users.has(userId)){
this.userService.getById(userId).subscribe(u=>{
this.users.set(userId,u);
});
}
}

getUserFullName(id:number){
const u=this.users.get(id);
return u ? `${u.firstName} ${u.lastName}` : 'User';
}

getUserInitials(id:number){
const u=this.users.get(id);
if(!u) return 'U';
return `${u.firstName[0]}${u.lastName[0]}`;
}

toggleLike(post:Post){

const wasLiked=post.isLikedByCurrentUser;

post.isLikedByCurrentUser=!wasLiked;
post.reactionCount += wasLiked ? -1 : 1;

this.forumService.reactToPost(post.id).subscribe({
error:()=>{
post.isLikedByCurrentUser=wasLiked;
post.reactionCount += wasLiked ? 1 : -1;
}
})
}

openCreateModal(){

const dialogRef=this.dialog.open(PostModalComponent,{
width:'500px'
});

dialogRef.afterClosed().subscribe(formData=>{
if(formData){
this.forumService.createPost(formData).subscribe(()=>{
this.loadPosts();
});
}
});

}

}