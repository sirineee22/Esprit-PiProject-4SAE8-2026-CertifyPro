import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/api/api.config';

export interface Workgroup {
    id: number;
    name: string;
    description: string;
    teacherId: number;
    teacherName: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    createdAt: string;
}

export interface GroupMessage {
    id: number;
    content: string;
    pinned: boolean;
    authorId: number;
    authorName: string;
    createdAt: string;
}

export interface GroupFileInfo {
    id: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedByName: string;
    uploadedAt: string;
}

@Injectable({ providedIn: 'root' })
export class GroupService {
    private url = API_ENDPOINTS.groups;

    constructor(private http: HttpClient) { }

    createGroup(group: Partial<Workgroup>): Observable<Workgroup> {
        return this.http.post<Workgroup>(this.url, group);
    }

    getPublicGroups(): Observable<Workgroup[]> {
        return this.http.get<Workgroup[]>(`${this.url}/public`);
    }

    getMyGroups(userId: number): Observable<Workgroup[]> {
        return this.http.get<Workgroup[]>(`${this.url}/my?userId=${userId}`);
    }

    getGroupById(id: number): Observable<Workgroup> {
        return this.http.get<Workgroup>(`${this.url}/${id}`);
    }

    joinGroup(groupId: number, userId: number, userName: string): Observable<any> {
        return this.http.post(`${this.url}/${groupId}/join?userId=${userId}&userName=${encodeURIComponent(userName)}`, {}, { responseType: 'text' });
    }

    addMember(groupId: number, studentName: string): Observable<any> {
        return this.http.post(`${this.url}/${groupId}/members?studentName=${encodeURIComponent(studentName)}`, {}, { responseType: 'text' });
    }

    getMessages(groupId: number): Observable<GroupMessage[]> {
        return this.http.get<GroupMessage[]>(`${this.url}/${groupId}/messages`);
    }

    postMessage(groupId: number, message: Partial<GroupMessage>): Observable<GroupMessage> {
        return this.http.post<GroupMessage>(`${this.url}/${groupId}/messages`, message);
    }

    getFiles(groupId: number): Observable<GroupFileInfo[]> {
        return this.http.get<GroupFileInfo[]>(`${this.url}/${groupId}/files`);
    }

    uploadFile(groupId: number, file: File, uploadedById: number, uploadedByName: string): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploadedById', uploadedById.toString());
        formData.append('uploadedByName', uploadedByName);
        return this.http.post(`${this.url}/${groupId}/files/upload`, formData, { responseType: 'text' });
    }

    downloadFile(groupId: number, fileId: number): Observable<Blob> {
        return this.http.get(`${this.url}/${groupId}/files/${fileId}/download`, { responseType: 'blob' });
    }
}
