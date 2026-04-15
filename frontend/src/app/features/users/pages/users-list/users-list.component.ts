import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/users.api';
import { User } from '../../../../shared/models/user.model';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../core/api/api.config';
import { HttpErrorResponse } from '@angular/common/http';
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

    private isPasswordStrong(pwd: string): boolean {
        if (!pwd || pwd.length < 8) return false;
        return /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd);
    }

    private createUser(): void {
        const fn = (this.editedUser.firstName ?? '').trim();
        const ln = (this.editedUser.lastName ?? '').trim();
        const em = (this.editedUser.email ?? '').trim();
        const pw = this.editedUser.password ?? '';

        if (!fn || fn.length < 2) {
            alert('First name is required (min 2 characters).');
            return;
        }
        if (!ln || ln.length < 2) {
            alert('Last name is required (min 2 characters).');
            return;
        }
        if (!em) {
            alert('Email is required.');
            return;
        }
        if (!pw) {
            alert('Password is required.');
            return;
        }
        if (!this.isPasswordStrong(pw)) {
            alert('Password must have: 8+ characters, uppercase, lowercase, digit, and special character (e.g. !@#$%).');
            return;
        }

        const userToCreate: User = {
            firstName: fn,
            lastName: ln,
            email: em.toLowerCase(),
            password: pw,
            phoneNumber: this.editedUser.phoneNumber || undefined,
            active: this.editedUser.active ?? true,
            role: this.editedUser.role ?? undefined
        };

        this.userService.create(userToCreate).subscribe({
            next: () => {
                alert('✅ User created successfully!');
                this.loadData();
                this.closeEditModal();
            },
            error: (e: unknown) => {
                console.error('ERROR creating user:', e);
                let msg = 'Failed to create user.';
                if (e instanceof HttpErrorResponse) {
                    if (e.status === 409) msg = 'Email already exists.';
                    else if (e.error && typeof e.error === 'string') msg = e.error;
                }
                alert('❌ ' + msg);
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
        if (confirm(`Delete ${userName}?`)) {
            this.userService.delete(id).subscribe({
                next: () => {
                    this.users = this.users.filter(u => String(u.id) !== String(id));
                    this.cdr.detectChanges();
                    alert('✅ User deleted successfully!');
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
<<<<<<< HEAD

    formatDate(d: string) {
        if (!d) return 'Never';
        return new Date(d).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    }
=======
>>>>>>> origin/Trainings-Evaluation
}
