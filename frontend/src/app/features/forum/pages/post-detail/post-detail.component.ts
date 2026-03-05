import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ForumService } from '../../../../forum/services/forum.service';
import { UserService } from '../../../users/services/users.api';

import { Post } from '../../../../forum/models/post.model';
import { Comment } from '../../../../forum/models/comment.model';
import { User } from '../../../../shared/models/user.model';

@Component({
selector:'app-post-detail',
standalone:true,
imports:[
CommonModule,
RouterLink,
FormsModule,
MatCardModule,
MatIconModule,
MatButtonModule
],
template:`
<div class="container" *ngIf="post">

<a routerLink="/forum" class="back">
<mat-icon>arrow_back</mat-icon> Back
</a>

<mat-card>

<mat-card-header>

<div mat-card-avatar class="avatar">
{{getUserInitials(post.userId)}}
</div>

<mat-card-title>{{post.title}}</mat-card-title>

<mat-card-subtitle>
{{getUserFullName(post.userId)}} • {{post.createdAt | date}}
</mat-card-subtitle>

</mat-card-header>

<mat-card-content>

<p>{{post.content}}</p>

</mat-card-content>

<mat-card-actions>

<button mat-button (click)="toggleLike()">

<mat-icon>
{{post.isLikedByCurrentUser ? 'favorite' : 'favorite_border'}}
</mat-icon>

{{post.reactionCount}}

</button>

<button mat-button>

<mat-icon>chat</mat-icon>

{{post.commentCount}}

</button>

</mat-card-actions>

</mat-card>


<div class="comments">

<h3>Comments</h3>

<textarea
[(ngModel)]="newComment"
placeholder="Write a comment..."
></textarea>

<button mat-raised-button color="primary"
(click)="submitComment()"
[disabled]="!newComment.trim()">

Comment

</button>

<div class="comment"
*ngFor="let c of comments">

<div class="avatar">
{{getUserInitials(c.userId)}}
</div>

<div>

<b>{{getUserFullName(c.userId)}}</b>

<p>{{c.content}}</p>

</div>

</div>

</div>

</div>
`,
styles:[`
.container{
max-width:800px;
margin:auto;
padding:2rem;
}

.avatar{
width:40px;
height:40px;
border-radius:50%;
background:#e2e8f0;
display:flex;
align-items:center;
justify-content:center;
font-weight:700;
}

.comments{
margin-top:2rem;
}

textarea{
width:100%;
padding:10px;
margin:1rem 0;
border-radius:8px;
border:1px solid #ddd;
}

.comment{
display:flex;
gap:10px;
margin-top:1rem;
}

.back{
display:flex;
gap:6px;
align-items:center;
margin-bottom:1rem;
text-decoration:none;
}
`]
})
export class PostDetailComponent implements OnInit{

post:Post|null=null;
comments:Comment[]=[];
users:Map<number,User>=new Map();

newComment='';

constructor(
private route:ActivatedRoute,
private forumService:ForumService,
private userService:UserService
){}

ngOnInit(){

const id=this.route.snapshot.paramMap.get('id');

if(id){
this.loadPost(+id);
this.loadComments(+id);
}

}

loadPost(id:number){

this.forumService.getPostById(id).subscribe(post=>{
this.post=post;
this.ensureUserLoaded(post.userId);
})

}

loadComments(postId:number){

this.forumService.getCommentsByPostId(postId).subscribe(c=>{
this.comments=c;

c.forEach(com=>{
this.ensureUserLoaded(com.userId);
})

})

}

ensureUserLoaded(id:number){

if(!this.users.has(id)){

this.userService.getById(id).subscribe(u=>{
this.users.set(id,u);
})

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

toggleLike(){

if(!this.post) return;

const wasLiked=this.post.isLikedByCurrentUser;

this.post.isLikedByCurrentUser=!wasLiked;
this.post.reactionCount += wasLiked ? -1 : 1;

this.forumService.reactToPost(this.post.id).subscribe({
error:()=>{
this.post!.isLikedByCurrentUser=wasLiked;
this.post!.reactionCount += wasLiked ? 1 : -1;
}
})

}

submitComment(){

if(!this.post || !this.newComment.trim()) return;

this.forumService.createComment(this.post.id,this.newComment)
.subscribe(c=>{

this.comments.unshift(c);

this.post!.commentCount++;

this.newComment='';

this.ensureUserLoaded(c.userId);

})

}

}