import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/users.api';
import { User } from '../../../../shared/models/user.model';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../core/api/api.config';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

interface Role {
    id: number;
    name: string;
}

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {
    users: User[] = [];
    roles: Role[] = [];
    isEditModalOpen = false;
    selectedUser: User | null = null;
    editedUser: Partial<User> = {};
    isAddMode = false;
    isLoading = false;

    constructor(
        private userService: UserService,
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.isLoading = true;
        this.loadData();
    }

    loadData(): void {
        forkJoin({
            users: this.userService.getAll(),
            roles: this.http.get<Role[]>(`${API_BASE_URL}/api/roles`)
        }).subscribe({
            next: (result) => {
                this.users = result.users;
                this.roles = result.roles;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (e: unknown) => {
                console.error('Error loading data:', e);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadUsers(): void {
        this.userService.getAll().subscribe({
            next: (data: User[]) => {
                this.users = data;
            },
            error: (e: unknown) => {
                console.error('Error loading users:', e);
            }
        });
    }

    loadRoles(): void {
        this.http.get<Role[]>(`${API_BASE_URL}/api/roles`).subscribe({
            next: (data: Role[]) => {
                this.roles = data;
            },
            error: (e: unknown) => console.error('Error loading roles:', e)
        });
    }

    // MODAL METHODS
    openAddModal(): void {
        this.isAddMode = true;
        this.selectedUser = null;
        this.editedUser = {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phoneNumber: '',
            active: true,
            role: this.roles.find(r => r.name === 'LEARNER') || (this.roles.length > 0 ? this.roles[0] : undefined)
        };
        this.isEditModalOpen = true;
    }

    openEditModal(user: User): void {
        this.selectedUser = user;
        this.editedUser = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            active: user.active,
            role: user.role
        };
        this.isEditModalOpen = true;
        this.isAddMode = false;
    }

    closeEditModal(): void {
        this.isEditModalOpen = false;
        this.selectedUser = null;
        this.editedUser = {};
        this.isAddMode = false;
    }

    onRoleChange(roleId: string): void {
        const role = this.roles.find(r => r.id === Number(roleId));
        if (role) {
            this.editedUser.role = role;
        }
    }

    saveUser(): void {
        if (this.isAddMode) {
            this.createUser();
        } else {
            this.updateUser();
        }
    }

    private createUser(): void {
        if (!this.editedUser.password) {
            this.toast.warning('Password is required for new users.');
            return;
        }

        this.userService.create(this.editedUser as User).subscribe({
            next: () => {
                this.toast.success('User created successfully.');
                this.loadData();
                this.closeEditModal();
            },
            error: (e: unknown) => {
                console.error('ERROR creating user:', e);
                this.toast.error('Failed to create user. Check console for details.');
            }
        });
    }

    private updateUser(): void {
        if (!this.editedUser.id) {
            console.error('No user ID found!');
            return;
        }

        this.userService.update(this.editedUser.id, this.editedUser as User).subscribe({
            next: () => {
                this.toast.success('User updated successfully.');
                this.loadData();
                this.closeEditModal();
            },
            error: (e: unknown) => {
                console.error('ERROR updating user:', e);
                this.toast.error('Failed to update user. Check console for details.');
            }
        });
    }

    deleteUser(id: number, userName: string): void {
        if (confirm(`Delete ${userName}?`)) {
            this.userService.delete(id).subscribe({
                next: () => {
                    this.toast.success('User deleted successfully.');
                    this.users = this.users.filter(u => u.id !== id);
                },
                error: (e: unknown) => {
                    console.error('Error deleting user:', e);
                    this.toast.error('Failed to delete user.');
                }
            });
        }
    }

    // HANDLERS FOR TEMPLATE
    handleEditClick(user: User): void {
        this.openEditModal(user);
    }

    handleDeleteClick(user: User): void {
        if (user.id) {
            this.deleteUser(user.id, `${user.firstName} ${user.lastName}`);
        }
    }
}
