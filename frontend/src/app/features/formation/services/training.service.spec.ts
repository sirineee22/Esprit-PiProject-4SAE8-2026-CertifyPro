import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrainingService } from './training.service';
import { of } from 'rxjs';
import { Training } from '../../../shared/models/formation.model';

describe('TrainingService', () => {
  let service: TrainingService;
  let httpClientMock: any;

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn().mockReturnValue(of([])),
      post: vi.fn(),
      delete: vi.fn()
    };
  
    service = {
      http: httpClientMock,
  
      authService: {
        getCurrentUser: vi.fn().mockReturnValue({
          id: 1,
          nom: 'training'
        })
      },
  
      addTraining: TrainingService.prototype.addTraining,
      deleteTraining: TrainingService.prototype.deleteTraining,
      trainingsSignal: { update: vi.fn() }
  
    } as any;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a training', () => {
    const mockTraining: Training = {
      id: 1,
      title: 'Test',
      description: 'Desc'
    } as any;

    const mockFile = new File([''], 'test.png');

    httpClientMock.post.mockReturnValue(of(mockTraining));

    service.addTraining(mockTraining, mockFile).subscribe((result: Training) => {
      expect(result).toEqual(mockTraining);
      expect(httpClientMock.post).toHaveBeenCalled();
    });
  });

  it('should delete a training', () => {
    httpClientMock.delete.mockReturnValue(of({}));

    service.deleteTraining(1).subscribe(() => {
      expect(httpClientMock.delete).toHaveBeenCalled();
    });
  });
});