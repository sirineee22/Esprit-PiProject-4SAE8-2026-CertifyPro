import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { SessionService } from '../../services/session.api';
import { RoomService, Room } from '../../../rooms/services/rooms.api';
import { HttpErrorResponse } from '@angular/common/http';

interface EndTimeOption {
    label: string;
    hours: number;
    value: string; // computed ISO string
}

@Component({
    selector: 'app-book-session',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './book-session.component.html',
    styleUrls: ['./book-session.component.css']
})
export class BookSessionComponent implements OnInit {
    topic = '';
    startTimeRaw = ''; // bound to datetime-local input
    selectedEndTime = '';
    endTimeOptions: EndTimeOption[] = [];
    selectedRoomId: number | null = null;
    rooms: Room[] = [];
    isLoading = false;
    isSubmitting = false;
    trainerId: number | null = null;
    trainerName = '';
    successMessage = '';
    errorMessage = '';

    constructor(
        private authService: AuthService,
        private sessionService: SessionService,
        private roomService: RoomService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();
        if (user?.id) {
            this.trainerId = user.id;
            this.trainerName = `${user.firstName} ${user.lastName}`;
        }
        this.loadRooms();
    }

    loadRooms(): void {
        this.isLoading = true;
        this.roomService.getAll().subscribe({
            next: (rooms) => {
                this.rooms = rooms.filter(r => r.available);
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    get minDateTime(): string {
        // Prevent booking in the past — min is current datetime
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    }

    onStartTimeChange(): void {
        this.selectedEndTime = '';
        this.endTimeOptions = [];

        if (!this.startTimeRaw) return;

        const start = new Date(this.startTimeRaw);
        if (isNaN(start.getTime())) return;

        this.endTimeOptions = [1, 2, 3].map(hours => {
            const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
            return {
                label: `+${hours}h  (${this.formatTime(end)})`,
                hours,
                value: this.toLocalISOString(end)
            };
        });
    }

    selectEndTime(option: EndTimeOption): void {
        this.selectedEndTime = option.value;
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    private toLocalISOString(date: Date): string {
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - offset * 60 * 1000);
        return local.toISOString().slice(0, 16);
    }

    isEndTimeSelected(option: EndTimeOption): boolean {
        return this.selectedEndTime === option.value;
    }

    submitSession(): void {
        this.successMessage = '';
        this.errorMessage = '';

        if (!this.topic.trim()) {
            this.errorMessage = 'Please enter a session topic.';
            return;
        }
        if (!this.startTimeRaw) {
            this.errorMessage = 'Please select a start time.';
            return;
        }
        if (!this.selectedEndTime) {
            this.errorMessage = 'Please select a session duration.';
            return;
        }
        if (!this.selectedRoomId) {
            this.errorMessage = 'Please select a room.';
            return;
        }
        if (!this.trainerId) {
            this.errorMessage = 'Trainer information not found. Please log in again.';
            return;
        }

        this.isSubmitting = true;

        this.sessionService.createSession({
            topic: this.topic.trim(),
            startTime: this.startTimeRaw + ':00', // add seconds for backend
            endTime: this.selectedEndTime + ':00',
            trainer: { id: this.trainerId },
            room: { id: this.selectedRoomId }
        }).subscribe({
            next: () => {
                this.successMessage = '✅ Session booked successfully!';
                this.resetForm();
                this.isSubmitting = false;
                this.cdr.detectChanges();
            },
            error: (e: unknown) => {
                this.isSubmitting = false;
                if (e instanceof HttpErrorResponse) {
                    this.errorMessage = '❌ ' + (e.error || 'Booking failed. There may be a conflict.');
                } else {
                    this.errorMessage = '❌ An unexpected error occurred.';
                }
                this.cdr.detectChanges();
            }
        });
    }

    resetForm(): void {
        this.topic = '';
        this.startTimeRaw = '';
        this.selectedEndTime = '';
        this.endTimeOptions = [];
        this.selectedRoomId = null;
    }
}
