import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrainingService } from './training.service';
import { of, lastValueFrom } from 'rxjs';
import { Training } from '../../../shared/models/formation.model';

describe('TrainingService', () => {
    let service: TrainingService;
    let httpClientMock: any;
    let authServiceMock: any;

    beforeEach(() => {
        httpClientMock = {
            get: vi.fn().mockReturnValue(of([])),
            post: vi.fn(),
            delete: vi.fn(),
        };

        authServiceMock = {
            getCurrentUser: vi.fn().mockReturnValue({ id: 1, firstName: 'Test' }),
        };

        service = {
            http: httpClientMock,
            authService: authServiceMock,
            addTraining: TrainingService.prototype.addTraining,
            deleteTraining: TrainingService.prototype.deleteTraining,
            trainingsSignal: { update: vi.fn() }
        } as any;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add a training', async () => {
        const mockTraining: Training = { id: 1, title: 'Test', description: 'Desc' } as any;
        const mockFile = new File([''], 'test.png');
        httpClientMock.post.mockReturnValue(of(mockTraining));

        const result = await lastValueFrom(service.addTraining(mockTraining, mockFile));
        expect(result).toEqual(mockTraining);
        expect(httpClientMock.post).toHaveBeenCalled();
    });

    it('should delete a training', async () => {
        httpClientMock.delete.mockReturnValue(of({}));

        await lastValueFrom(service.deleteTraining(1));
        expect(httpClientMock.delete).toHaveBeenCalled();
    });
});
