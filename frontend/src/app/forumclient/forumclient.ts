import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import jsPDF from 'jspdf';

import {
  ForumComment,
  ForumPost,
  ForumService
} from '../forum/services/forum.service';

type ForumPostVM = ForumPost & {
  comments: ForumComment[];
  showComments: boolean;
  showCommentForm: boolean;
  isEditing: boolean;
  isTranslating?: boolean;
  isTranslated?: boolean;
  translatedTitle?: string;
  translatedContent?: string;
  newComment: string;
  editTitle: string;
  editContent: string;
};

@Component({
  selector: 'app-forumadmin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forumclient.html',
  styleUrls: ['./forumclient.css']
})
export class Forumclient implements OnInit {
  private readonly forumService = inject(ForumService);
  private readonly cdr = inject(ChangeDetectorRef);

  posts: ForumPostVM[] = [];
  filteredPosts: ForumPostVM[] = [];

  loading = false;
  submittingPost = false;
  searchTerm = '';

  currentUserId: number | null = null;
  adminName = 'Admin Forum';

  newPost = {
    title: '',
    content: ''
  };

  selectedImage: File | null = null;
  imagePreview: string | null = null;

  editingCommentId: number | null = null;
  editingCommentContent = '';

  likingPosts = new Set<number>();

  translationFrom = 'fr';
  translationTo = 'en';

  stats = {
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    totalImages: 0
  };
  aiPrompt = '';
  generatingAi = false;

  generatePostAi(): void {

    const prompt = this.aiPrompt.trim();
  
    if (!prompt) return;
  
    this.generatingAi = true;
  
    this.forumService
      .generatePostWithAi(prompt)
      .pipe(
        finalize(() => {
          this.generatingAi = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
  
          this.newPost.title = res.title || '';
          this.newPost.content = res.content || '';
  
        },
        error: (err) => {
          console.error('AI generate error', err);
        }
      });
  }



  ngOnInit(): void {
    this.currentUserId = Number(localStorage.getItem('userId') || 0);
    this.initializePage();
  }
  

  initializePage(): void {
    this.resetTransientUi();
    this.loadPosts(true);
  }

  resetTransientUi(): void {
    this.loading = false;
    this.submittingPost = false;
    this.searchTerm = '';
    this.imagePreview = null;
    this.selectedImage = null;
    this.editingCommentId = null;
    this.editingCommentContent = '';
    this.likingPosts.clear();
  }

  loadPosts(initialLoad = false): void {
    this.loading = true;

    this.forumService
      .getPosts()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          const normalized = (data || []).map((p) => this.mapPostToVm(p));

          this.posts = [...normalized];
          this.applyFilter();
          this.computeStats();

          if (initialLoad) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur chargement posts:', err);
          this.posts = [];
          this.filteredPosts = [];
          this.computeStats();
          this.cdr.detectChanges();
        }
      });
  }

  mapPostToVm(post: ForumPost): ForumPostVM {
    return {
      ...post,
      userId: Number(post.userId),

      comments: [...(post.comments || [])],
      showComments: false,
      showCommentForm: false,
      isEditing: false,
      isTranslating: false,
      isTranslated: false,
      translatedTitle: '',
      translatedContent: '',
      newComment: '',
      editTitle: post.title || '',
      editContent: post.content || ''
    };
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredPosts = [...this.posts];
      this.cdr.detectChanges();
      return;
    }

    this.filteredPosts = this.posts.filter((post) => {
      const title = (post.title || '').toLowerCase();
      const content = (post.content || '').toLowerCase();
      const translatedTitle = (post.translatedTitle || '').toLowerCase();
      const translatedContent = (post.translatedContent || '').toLowerCase();
      const commentsText = (post.comments || [])
        .map((c) => c.content || '')
        .join(' ')
        .toLowerCase();

      return (
        title.includes(term) ||
        content.includes(term) ||
        translatedTitle.includes(term) ||
        translatedContent.includes(term) ||
        commentsText.includes(term) ||
        String(post.userId).includes(term)
      );
    });

    this.cdr.detectChanges();
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  computeStats(): void {
    const totalPosts = this.posts.length;
    const totalComments = this.posts.reduce(
      (sum, post) => sum + (post.commentCount || post.comments?.length || 0),
      0
    );
    const totalLikes = this.posts.reduce(
      (sum, post) => sum + (post.reactionCount || 0),
      0
    );
    const totalImages = this.posts.filter((p) => !!p.imageUrl).length;

    this.stats = {
      totalPosts,
      totalComments,
      totalLikes,
      totalImages
    };
  }

  refreshListReference(): void {
    this.posts = [...this.posts];
    this.applyFilter();
    this.computeStats();
    this.cdr.detectChanges();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] || null;

    this.selectedImage = file;

    if (!file) {
      this.imagePreview = null;
      this.cdr.detectChanges();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeSelectedImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.cdr.detectChanges();
  }

  createPost(): void {
    if (!this.newPost.title.trim() || !this.newPost.content.trim()) {
      return;
    }

    this.submittingPost = true;

    this.forumService
      .createPost({
        userId: this.currentUserId!,
        title: this.newPost.title.trim(),
        content: this.newPost.content.trim(),
        image: this.selectedImage || undefined
      })
      .pipe(
        finalize(() => {
          this.submittingPost = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (createdPost) => {
          const postVm = this.mapPostToVm(createdPost);
          this.posts = [postVm, ...this.posts];

          this.newPost = { title: '', content: '' };
          this.selectedImage = null;
          this.imagePreview = null;

          this.refreshListReference();
        },
        error: (err) => {
          console.error('Erreur création post:', err);
        }
      });
  }

  toggleLike(post: ForumPostVM): void {
    if (this.likingPosts.has(post.id)) return;

    this.likingPosts.add(post.id);

    const wasLiked = !!post.isLikedByCurrentUser;
    post.isLikedByCurrentUser = !wasLiked;
    post.reactionCount = Math.max(0, (post.reactionCount || 0) + (wasLiked ? -1 : 1));
    this.refreshListReference();

    this.forumService.toggleReaction(post.id, this.currentUserId!).subscribe({
      next: () => {
        this.likingPosts.delete(post.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur like:', err);
        post.isLikedByCurrentUser = wasLiked;
        post.reactionCount = Math.max(0, (post.reactionCount || 0) + (wasLiked ? 1 : -1));
        this.likingPosts.delete(post.id);
        this.refreshListReference();
      }
    });
  }

  deletePost(post: ForumPostVM): void {
    if (!confirm('Supprimer ce post ?')) return;

    const backup = [...this.posts];
    this.posts = this.posts.filter((p) => p.id !== post.id);
    this.refreshListReference();

    this.forumService.deletePost(post.id).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Erreur suppression post:', err);
        this.posts = backup;
        this.refreshListReference();
      }
    });
  }

  startEditPost(post: ForumPostVM): void {
    post.isEditing = true;
    post.editTitle = post.title || '';
    post.editContent = post.content || '';
    this.refreshListReference();
  }

  cancelEditPost(post: ForumPostVM): void {
    post.isEditing = false;
    post.editTitle = post.title || '';
    post.editContent = post.content || '';
    this.refreshListReference();
  }

  savePost(post: ForumPostVM): void {
    const newTitle = (post.editTitle || '').trim();
    const newContent = (post.editContent || '').trim();

    if (!newTitle || !newContent) return;

    const oldTitle = post.title;
    const oldContent = post.content;

    post.title = newTitle;
    post.content = newContent;
    post.isEditing = false;

    this.refreshListReference();

    this.forumService
      .updatePost(post.id, {
        title: post.title,
        content: post.content
      })
      .subscribe({
        next: () => {},
        error: (err) => {
          console.error('Erreur update post:', err);
          post.title = oldTitle;
          post.content = oldContent;
          this.refreshListReference();
        }
      });
  }

  toggleComments(post: ForumPostVM): void {
    post.showComments = !post.showComments;
    this.refreshListReference();
  }

  toggleCommentForm(post: ForumPostVM): void {
    post.showCommentForm = !post.showCommentForm;
    this.refreshListReference();
  }

  addComment(post: ForumPostVM): void {
    const content = (post.newComment || '').trim();
    if (!content) return;

    const tempComment: ForumComment = {
      id: Date.now(),
      content,
      userId: this.currentUserId!,
      date: new Date().toISOString()
    };

    post.comments = [tempComment, ...(post.comments || [])];
    post.commentCount = (post.commentCount || 0) + 1;
    post.newComment = '';
    post.showComments = true;

    this.refreshListReference();

    this.forumService.addComment(post.id, this.currentUserId!, content).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Erreur ajout commentaire:', err);
        this.loadPosts();
      }
    });
  }

  deleteComment(post: ForumPostVM, comment: ForumComment): void {
    const previousComments = [...post.comments];
    const previousCount = post.commentCount || 0;

    post.comments = post.comments.filter((c) => c.id !== comment.id);
    post.commentCount = Math.max(0, previousCount - 1);

    this.refreshListReference();

    this.forumService.deleteComment(comment.id).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Erreur suppression commentaire:', err);
        post.comments = previousComments;
        post.commentCount = previousCount;
        this.refreshListReference();
      }
    });
  }

  startEditComment(comment: ForumComment): void {
    this.editingCommentId = comment.id;
    this.editingCommentContent = comment.content;
    this.cdr.detectChanges();
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editingCommentContent = '';
    this.cdr.detectChanges();
  }

  saveComment(comment: ForumComment): void {
    const newContent = (this.editingCommentContent || '').trim();
    if (!newContent) return;

    const oldContent = comment.content;
    comment.content = newContent;

    this.editingCommentId = null;
    this.editingCommentContent = '';

    this.refreshListReference();

    this.forumService.updateComment(comment.id, newContent).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Erreur modification commentaire:', err);
        comment.content = oldContent;
        this.refreshListReference();
      }
    });
  }

  translatePost(post: ForumPostVM): void {

    if (post.isTranslated) {
      post.isTranslated = false;
      this.refreshListReference();
      return;
    }
  
    post.isTranslating = true;
  
    this.forumService
      .translatePost(
        post.title,
        post.content,
        this.translationFrom,
        this.translationTo
      )
      .subscribe({
        next: (res) => {
  
          post.translatedTitle = res.title;
          post.translatedContent = res.content;
  
          post.isTranslated = true;
          post.isTranslating = false;
  
          this.refreshListReference();
        },
        error: () => {
          post.isTranslating = false;
        }
      });
  }
  
  clearTranslation(post: ForumPostVM): void {
    post.isTranslated = false;
    post.translatedTitle = '';
    post.translatedContent = '';
    this.refreshListReference();
  }

  async exportPostToPdf(post: ForumPostVM): Promise<void> {

    const doc = new jsPDF('p', 'mm', 'a4');
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
  
    const title = post.isTranslated && post.translatedTitle
      ? post.translatedTitle
      : post.title || '';
  
    const content = post.isTranslated && post.translatedContent
      ? post.translatedContent
      : post.content || '';
  
    const createdAt = post.createdAt
      ? new Date(post.createdAt).toLocaleString()
      : 'N/A';
  
    // =====================================
    // HEADER GRADIENT STYLE
    // =====================================
  
    doc.setFillColor(13, 110, 253);
    doc.roundedRect(0, 0, pageWidth, 38, 0, 0, 'F');
  
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Forum Post Report', margin, 18);
  
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Forum Admin Dashboard', margin, 27);
  
    // =====================================
    // USER INFO CARD
    // =====================================
  
    let y = 48;
  
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y, contentWidth, 30, 4, 4, 'FD');
  
    doc.setTextColor(33, 37, 41);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
  
    doc.text(`Post ID: ${post.id}`, margin + 5, y + 8);
    doc.text(`User ID: ${post.userId}`, margin + 70, y + 8);
  
    doc.text(`Likes: ${post.reactionCount || 0}`, margin + 5, y + 18);
    doc.text(`Comments: ${post.commentCount || 0}`, margin + 70, y + 18);
  
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${createdAt}`, margin + 5, y + 28);
  
    y += 40;
  
    // =====================================
    // IMAGE
    // =====================================
  
    if (post.imageUrl) {
      try {
  
        const imageData = await this.loadImageAsBase64(post.imageUrl);
  
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Attached Image', margin, y);
  
        y += 6;
  
        doc.addImage(
          imageData,
          'JPEG',
          margin,
          y,
          contentWidth,
          70
        );
  
        y += 78;
  
      } catch (e) {
        console.log('Image not loaded');
      }
    }
  
    // =====================================
    // TITLE BOX
    // =====================================
  
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(margin, y, contentWidth, 18, 4, 4, 'F');
  
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(13, 110, 253);
    doc.text('Title', margin + 4, y + 11);
  
    y += 24;
  
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
  
    const splitTitle = doc.splitTextToSize(title, contentWidth);
    doc.text(splitTitle, margin, y);
  
    y += splitTitle.length * 7 + 6;
  
    // =====================================
    // CONTENT BOX
    // =====================================
  
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, contentWidth, 18, 4, 4, 'F');
  
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Content', margin + 4, y + 11);
  
    y += 24;
  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
  
    const splitContent = doc.splitTextToSize(content, contentWidth);
    doc.text(splitContent, margin, y);
  
    y += splitContent.length * 6 + 10;
  
    // =====================================
    // FOOTER
    // =====================================
  
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
  
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
  
    doc.text(
      'Forum Admin • Confidential Export',
      margin,
      pageHeight - 10
    );
  
    doc.text(
      `Page 1`,
      pageWidth - 25,
      pageHeight - 10
    );
  
    // =====================================
    // SAVE
    // =====================================
  
    doc.save(`forum-post-${post.id}.pdf`);
  }
  
  
  // =====================================================
  // LOAD IMAGE URL TO BASE64
  // =====================================================
  
  private loadImageAsBase64(url: string): Promise<string> {
  
    return new Promise((resolve, reject) => {
  
      const img = new Image();
  
      img.crossOrigin = 'Anonymous';
  
      img.onload = () => {
  
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
  
        const ctx = canvas.getContext('2d');
  
        if (!ctx) {
          reject();
          return;
        }
  
        ctx.drawImage(img, 0, 0);
  
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
  
      img.onerror = reject;
  
      img.src = url;
    });
  }

  trackByPostId(index: number, post: ForumPostVM): number {
    return post.id;
  }

  trackByCommentId(index: number, comment: ForumComment): number {
    return comment.id;
  }

  getPostImage(post: ForumPostVM): string {
    return post.imageUrl || '';
  }
}