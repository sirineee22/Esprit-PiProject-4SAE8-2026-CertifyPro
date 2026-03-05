import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class JobFileUploadService {

    private apiUrl = 'http://localhost:8082/api/jobs/upload';

    constructor(private http: HttpClient) { }

    /**
     * Uploads a CV file and optionally tracks progress based on `reportProgress` flag.
     */
    uploadCv(file: File): Observable<HttpEvent<any>> {
        const formData: FormData = new FormData();
        formData.append('file', file);

        const req = new HttpRequest('POST', `${this.apiUrl}/cv`, formData, {
            reportProgress: true,
            responseType: 'json'
        });

        return this.http.request(req);
    }
}
