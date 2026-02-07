import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/users.api';
import { User } from '../../../../shared/models/user.model';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../core/api/api.config';
import { forkJoin } from 'rxjs';

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
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        console.log('UsersListComponent initialized');
        this.isLoading = true;
        this.loadData();
    }

    loadData(): void {
        console.log('loadData() called - fetching users and roles in parallel');

        forkJoin({
            users: this.userService.getAll(),
            roles: this.http.get<Role[]>(`${API_BASE_URL}/api/roles`)
        }).subscribe({
            next: (result) => {
                console.log('Data loaded successfully:', result);
                this.users = result.users;
                this.roles = result.roles;
                this.isLoading = false;
                this.cdr.detectChanges();
                console.log('isLoading set to false, users count:', this.users.length);
            },
            error: (e: unknown) => {
                console.error('Error loading data:', e);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadUsers(): void {
        console.log('loadUsers() called');
        this.userService.getAll().subscribe({
            next: (data: User[]) => {
                console.log('Users loaded successfully:', data);
                this.users = data;
            },
            error: (e: unknown) => {
                console.error('Error loading users:', e);
            }
        });
    }

    loadRoles(): void {
        console.log('loadRoles() called');
        this.http.get<Role[]>(`${API_BASE_URL}/api/roles`).subscribe({
            next: (data: Role[]) => {
                console.log('Roles loaded:', data);
                this.roles = data;
            },
            error: (e: unknown) => console.error('Error loading roles:', e)
        });
    }

    // MODAL METHODS
    openAddModal(): void {
        console.log('Opening Add User modal');
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
        console.log('Opening edit modal for:', user);
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
        console.log('saveUser() called, isAddMode:', this.isAddMode);

        if (this.isAddMode) {
            this.createUser();
        } else {
            this.updateUser();
        }
    }

    private createUser(): void {
        if (!this.editedUser.password) {
            alert('Password is required for new users!');
            return;
        }

        console.log('Creating user:', this.editedUser);
        this.userService.create(this.editedUser as User).subscribe({
            next: (response) => {
                console.log('User created successfully!', response);
                alert('✅ User created successfully!');
                this.loadData();
                this.closeEditModal();
            },
            error: (e: unknown) => {
                console.error('ERROR creating user:', e);
                alert('❌ Failed to create user. Check console for details.');
            }
        });
    }

    private updateUser(): void {
        if (!this.editedUser.id) {
            console.error('No user ID found!');
            return;
        }

        console.log('Updating user:', this.editedUser);
        this.userService.update(this.editedUser.id, this.editedUser as User).subscribe({
            next: (response) => {
                console.log('Update successful!', response);
                alert('✅ User updated successfully!');
                this.loadData();
                this.closeEditModal();
            },
            error: (e: unknown) => {
                console.error('ERROR updating user:', e);
                alert('❌ Failed to update user. Check console for details.');
            }
        });
    }

    deleteUser(id: number, userName: string): void {
        console.log('Delete user called:', id, userName);
        if (confirm(`Delete ${userName}?`)) {
            this.userService.delete(id).subscribe({
                next: () => {
                    alert('✅ User deleted successfully!');
                    this.users = this.users.filter(u => u.id !== id);
                },
                error: (e: unknown) => {
                    console.error('Error deleting user:', e);
                    alert('❌ Failed to delete user');
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
