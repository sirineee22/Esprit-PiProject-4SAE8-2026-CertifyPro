import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/api/api.config';

export interface Room {
    id?: number;
    name: string;
    capacity: number;
    hasProjector: boolean;
    hasComputers: boolean;
    hasWhiteboard: boolean;
    available: boolean;
}

@Injectable({ providedIn: 'root' })
export class RoomService {
    private url = API_ENDPOINTS.rooms;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Room[]> {
        return this.http.get<Room[]>(this.url);
    }

    getById(id: number): Observable<Room> {
        return this.http.get<Room>(`${this.url}/${id}`);
    }

    create(room: Room): Observable<Room> {
        return this.http.post<Room>(this.url, room);
    }

    update(id: number, room: Room): Observable<Room> {
        return this.http.put<Room>(`${this.url}/${id}`, room);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}
