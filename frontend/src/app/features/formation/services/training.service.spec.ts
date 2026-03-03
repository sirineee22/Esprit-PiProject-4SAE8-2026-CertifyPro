import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrainingService } from './training.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Training } from '../../../shared/models/formation.model';

describe('TrainingService', () => {
    let service: TrainingService;
    let httpClientMock: any;

    beforeEach(() => {
        httpClientMock = {
            get: vi.fn().mockReturnValue(of([])),
            post: vi.fn(),
            delete: vi.fn(),
        };

        // Simplest possible mock service that mimics TrainingService
        service = {
            http: httpClientMock,
            addTraining: TrainingService.prototype.addTraining,
            deleteTraining: TrainingService.prototype.deleteTraining,
            trainingsSignal: { update: vi.fn() }
        } as any;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add a training', (done) => {
        const mockTraining: Training = { id: 1, title: 'Test', description: 'Desc' } as any;
        const mockFile = new File([''], 'test.png');
        httpClientMock.post.mockReturnValue(of(mockTraining));

        service.addTraining(mockTraining, mockFile).subscribe(result => {
            expect(result).toEqual(mockTraining);
            expect(httpClientMock.post).toHaveBeenCalled();
            done();
        });
    });

    it('should delete a training', (done) => {
        httpClientMock.delete.mockReturnValue(of({}));

        service.deleteTraining(1).subscribe(() => {
            expect(httpClientMock.delete).toHaveBeenCalled();
            done();
        });
    });
});
