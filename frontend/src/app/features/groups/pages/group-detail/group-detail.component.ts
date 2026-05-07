import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { GroupService, Workgroup, GroupMessage, GroupFileInfo } from '../../services/group.api';

@Component({
    selector: 'app-group-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './group-detail.component.html',
    styleUrls: ['./group-detail.component.css']
})
export class GroupDetailComponent implements OnInit {
    group: Workgroup | null = null;
    messages: GroupMessage[] = [];
    files: GroupFileInfo[] = [];
    userId: number | null = null;
    userName = '';
    isTrainer = false;
    isOwner = false;

    newMessage = '';
    pinMessage = true;
    addStudentName = '';
    selectedFile: File | null = null;

    constructor(
        private route: ActivatedRoute,
        private groupService: GroupService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();
        if (user?.id) {
            this.userId = user.id;
            this.userName = `${user.firstName} ${user.lastName}`;
            this.isTrainer = user.role?.name === 'TRAINER';
        }
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.loadGroup(id);
    }

    loadGroup(id: number): void {
        this.groupService.getGroupById(id).subscribe({
            next: (g) => {
                this.group = g;
                this.isOwner = g.teacherId === this.userId;
                this.loadMessages(id);
                this.loadFiles(id);
            }
        });
    }

    loadMessages(id: number): void {
        this.groupService.getMessages(id).subscribe({
            next: (msgs) => { this.messages = msgs; this.cdr.detectChanges(); }
        });
    }

    loadFiles(id: number): void {
        this.groupService.getFiles(id).subscribe({
            next: (files) => { this.files = files; this.cdr.detectChanges(); }
        });
    }

    postMessage(): void {
        if (!this.group || !this.newMessage.trim()) return;
        this.groupService.postMessage(this.group.id, {
            content: this.newMessage.trim(),
            pinned: this.pinMessage,
            authorId: this.userId!,
            authorName: this.userName
        }).subscribe({
            next: () => {
                this.newMessage = '';
                this.loadMessages(this.group!.id);
            }
        });
    }

    addMember(): void {
        if (!this.group || !this.addStudentName.trim()) return;
        this.groupService.addMember(this.group.id, this.addStudentName.trim()).subscribe({
            next: () => { this.addStudentName = ''; alert('Student added!'); },
            error: (e) => { alert(typeof e.error === 'string' ? e.error : 'Failed'); }
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
        }
    }

    uploadFile(): void {
        if (!this.group || !this.selectedFile || !this.userId) return;
        this.groupService.uploadFile(this.group.id, this.selectedFile, this.userId, this.userName)
            .subscribe({
                next: () => {
                    this.selectedFile = null;
                    this.loadFiles(this.group!.id);
                    alert('File uploaded!');
                },
                error: () => alert('Upload failed')
            });
    }

    downloadFile(fileId: number, fileName: string): void {
        if (!this.group) return;
        this.groupService.downloadFile(this.group.id, fileId).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = fileName;
                document.body.appendChild(a); a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        });
    }

    getFileIcon(fileType: string): string {
        if (fileType?.includes('pdf')) return 'bi bi-file-earmark-pdf-fill';
        if (fileType?.includes('sheet') || fileType?.includes('excel')) return 'bi bi-file-earmark-excel-fill';
        if (fileType?.includes('text')) return 'bi bi-file-earmark-text-fill';
        return 'bi bi-file-earmark-fill';
    }

    formatSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }
}
