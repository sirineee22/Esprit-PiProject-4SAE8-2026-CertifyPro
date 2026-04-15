import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService, Room } from '../../services/rooms.api';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-rooms-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './rooms-list.component.html',
    styleUrls: ['./rooms-list.component.css']
})
export class RoomsListComponent implements OnInit {
    rooms: Room[] = [];
    isModalOpen = false;
    isAddMode = false;
    isLoading = false;
    editedRoom: Partial<Room> = {};

    constructor(
        private roomService: RoomService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadRooms();
    }

    loadRooms(): void {
        this.isLoading = true;
        this.roomService.getAll().subscribe({
            next: (data) => {
                this.rooms = data;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (e: unknown) => {
                console.error('Error loading rooms:', e);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openAddModal(): void {
        this.isAddMode = true;
        this.editedRoom = {
            name: '',
            capacity: 1,
            hasProjector: false,
            hasComputers: false,
            hasWhiteboard: false,
            available: true
        };
        this.isModalOpen = true;
    }

    openEditModal(room: Room): void {
        this.isAddMode = false;
        this.editedRoom = { ...room };
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.isModalOpen = false;
        this.editedRoom = {};
    }

    saveRoom(): void {
        const name = (this.editedRoom.name ?? '').trim();
        const capacity = this.editedRoom.capacity ?? 0;

        if (!name) {
            alert('Room name is required.');
            return;
        }
        if (capacity < 1) {
            alert('Capacity must be at least 1.');
            return;
        }

        const roomPayload: Room = {
            name,
            capacity,
            hasProjector: this.editedRoom.hasProjector ?? false,
            hasComputers: this.editedRoom.hasComputers ?? false,
            hasWhiteboard: this.editedRoom.hasWhiteboard ?? false,
            available: this.editedRoom.available ?? true
        };

        if (this.isAddMode) {
            this.roomService.create(roomPayload).subscribe({
                next: () => {
                    alert('✅ Room created successfully!');
                    this.loadRooms();
                    this.closeModal();
                },
                error: (e: unknown) => {
                    let msg = 'Failed to create room.';
                    if (e instanceof HttpErrorResponse && e.error && typeof e.error === 'string') {
                        msg = e.error;
                    }
                    alert('❌ ' + msg);
                }
            });
        } else {
            const id = this.editedRoom.id!;
            this.roomService.update(id, { ...roomPayload, id }).subscribe({
                next: () => {
                    alert('✅ Room updated successfully!');
                    this.loadRooms();
                    this.closeModal();
                },
                error: (e: unknown) => {
                    console.error('Error updating room:', e);
                    alert('❌ Failed to update room.');
                }
            });
        }
    }

    deleteRoom(id: number, name: string): void {
        if (confirm(`Are you sure you want to delete room "${name}"?`)) {
            this.roomService.delete(id).subscribe({
                next: () => {
                    this.rooms = this.rooms.filter(r => r.id !== id);
                    this.cdr.detectChanges();
                    alert('✅ Room deleted successfully!');
                },
                error: (e: unknown) => {
                    console.error('Error deleting room:', e);
                    alert('❌ Failed to delete room.');
                }
            });
        }
    }
}
