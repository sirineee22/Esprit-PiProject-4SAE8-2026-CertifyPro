import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private apiUrl = `${API_BASE_URL}/api/ai/generate-description`;

    constructor(private http: HttpClient) { }

    /**
     * Generates a full certification description using the backend AI proxy.
     * This avoids CORS issues and keeps the API key secure on the server.
     */
    generateDescription(shortDescription: string): Observable<string> {
        return this.http.post(this.apiUrl, { shortDescription }, { responseType: 'text' });
    }

    /**
     * Generates quiz questions based on certification description.
     */
    generateQuiz(description: string): Observable<string> {
        return this.http.post(`${API_BASE_URL}/api/ai/generate-quiz`, { description }, { responseType: 'text' });
    }
}
