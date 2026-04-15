import { Training } from './formation.model';
import { User } from './user.model';

export enum EvaluationType {
    QUIZ = 'QUIZ',
    QUESTION_ANSWER = 'QUESTION_ANSWER'
}

export interface Evaluation {
    id?: number;
    type: EvaluationType;
    score: number;
    remarks: string;
    student?: User;
    formation?: Training;
}
