import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvaluationService } from './evaluation.service';
import { of } from 'rxjs';
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

    it('should add an evaluation', (done) => {
        const mockEval: Evaluation = { id: 1, score: 90 } as any;
        httpClientMock.post.mockReturnValue(of(mockEval));

        service.addEvaluation(mockEval).subscribe(result => {
            expect(result).toEqual(mockEval);
            expect(httpClientMock.post).toHaveBeenCalled();
            done();
        });
    });

    it('should delete an evaluation', (done) => {
        httpClientMock.delete.mockReturnValue(of({}));

        service.deleteEvaluation(1).subscribe(() => {
            expect(httpClientMock.delete).toHaveBeenCalled();
            done();
        });
    });
});
