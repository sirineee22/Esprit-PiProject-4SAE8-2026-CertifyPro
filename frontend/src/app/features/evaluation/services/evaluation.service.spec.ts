import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvaluationService } from './evaluation.service';
import { of, lastValueFrom } from 'rxjs';
import { Evaluation } from '../../../shared/models/evaluation.model';

describe('EvaluationService', () => {
    let service: EvaluationService;
    let httpClientMock: any;

    beforeEach(() => {
        httpClientMock = {
            get: vi.fn().mockReturnValue(of([])),
            post: vi.fn(),
            delete: vi.fn(),
        };

        service = {
            http: httpClientMock,
            addEvaluation: EvaluationService.prototype.addEvaluation,
            deleteEvaluation: EvaluationService.prototype.deleteEvaluation,
            evaluationsSignal: { update: vi.fn() }
        } as any;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add an evaluation', async () => {
        const mockEval: Evaluation = { id: 1, score: 90 } as any;
        httpClientMock.post.mockReturnValue(of(mockEval));

        const result = await lastValueFrom(service.addEvaluation(mockEval));
        expect(result).toEqual(mockEval);
        expect(httpClientMock.post).toHaveBeenCalled();
    });

    it('should delete an evaluation', async () => {
        httpClientMock.delete.mockReturnValue(of({}));

        await lastValueFrom(service.deleteEvaluation(1));
        expect(httpClientMock.delete).toHaveBeenCalled();
    });
});
