import { Routes } from '@angular/router';
import { EvaluationListComponent } from './pages/evaluation-list/evaluation-list.component';
import { EvaluationFormComponent } from './pages/evaluation-form/evaluation-form.component';
import { QuizBuilderComponent } from './pages/quiz-builder/quiz-builder.component';
import { QuizPlayerComponent } from './pages/quiz-player/quiz-player.component';
import { TrainerDashboardComponent } from './pages/trainer-dashboard/trainer-dashboard';

export const EVALUATION_ROUTES: Routes = [
    { path: '', component: EvaluationListComponent },
    { path: 'dashboard', component: TrainerDashboardComponent },
    { path: 'my-evals', component: EvaluationListComponent },
    { path: 'new', component: EvaluationFormComponent },
    { path: 'quizzes/new', component: QuizBuilderComponent },
    { path: 'quizzes/:id/play', component: QuizPlayerComponent }
];
