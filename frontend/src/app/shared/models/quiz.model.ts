import { Training } from './formation.model';
import { User } from './user.model';

export interface AnswerOption {
    id?: number;
    text: string;
    isCorrect: boolean;
}

export interface Question {
    id?: number;
    content: string;
    options: AnswerOption[];
}

export interface Quiz {
    id?: number;
    title: string;
    description: string;
    formation?: Training;
    questions: Question[];
}

export interface QuizAttempt {
    id?: number;
    student?: User;
    quiz?: Quiz;
    score: number;
    completedAt: string;
}
