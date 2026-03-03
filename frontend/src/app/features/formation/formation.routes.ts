import { Routes } from '@angular/router';
import { AddFormationComponent } from './pages/add-formation/add-formation.component';
import { TrainingListComponent } from './pages/training-list/training-list';
import { TrainingViewerComponent } from './pages/training-viewer/training-viewer';

export const formationRoutes: Routes = [
    { path: '', component: TrainingListComponent },
    { path: 'add', component: AddFormationComponent },
    { path: 'edit/:id', component: AddFormationComponent },
    { path: 'view/:id', component: TrainingViewerComponent }
];
