import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { GroupService, Workgroup } from '../../services/group.api';

@Component({
    selector: 'app-groups-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './groups-list.component.html',
    styleUrls: ['./groups-list.component.css']
})
export class GroupsListComponent implements OnInit {
    myGroups: Workgroup[] = [];
    publicGroups: Workgroup[] = [];
    userId: number | null = null;
    userName = '';
    isTrainer = false;
    isLoading = true;
    showCreateForm = false;

    newGroupName = '';
    newGroupDesc = '';
    newGroupVisibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC';
    successMsg = '';
    errorMsg = '';

    constructor(
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
        this.loadGroups();
    }

    loadGroups(): void {
        this.isLoading = true;
        if (this.userId) {
            this.groupService.getMyGroups(this.userId).subscribe({
                next: (groups) => { this.myGroups = groups; this.loadPublicGroups(); },
                error: () => { this.isLoading = false; this.cdr.detectChanges(); }
            });
        } else {
            this.loadPublicGroups();
        }
    }

    loadPublicGroups(): void {
        this.groupService.getPublicGroups().subscribe({
            next: (groups) => {
                const myIds = this.myGroups.map(g => g.id);
                this.publicGroups = groups.filter(g => !myIds.includes(g.id));
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => { this.isLoading = false; this.cdr.detectChanges(); }
        });
    }

    createGroup(): void {
        this.successMsg = '';
        this.errorMsg = '';
        if (!this.newGroupName.trim()) { this.errorMsg = 'Group name required'; return; }

        this.groupService.createGroup({
            name: this.newGroupName.trim(),
            description: this.newGroupDesc.trim(),
            teacherId: this.userId!,
            teacherName: this.userName,
            visibility: this.newGroupVisibility
        }).subscribe({
            next: () => {
                this.successMsg = 'Group created!';
                this.newGroupName = '';
                this.newGroupDesc = '';
                this.showCreateForm = false;
                this.loadGroups();
            },
            error: () => { this.errorMsg = 'Failed to create group'; this.cdr.detectChanges(); }
        });
    }

    joinGroup(group: Workgroup): void {
        if (!this.userId) return;
        this.groupService.joinGroup(group.id, this.userId, this.userName).subscribe({
            next: () => { this.loadGroups(); },
            error: (e) => { alert(typeof e.error === 'string' ? e.error : 'Failed to join'); }
        });
    }
}
