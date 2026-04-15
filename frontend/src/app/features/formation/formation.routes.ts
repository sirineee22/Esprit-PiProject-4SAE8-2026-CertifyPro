import { Routes } from '@angular/router';
import { AddFormationComponent } from './pages/add-formation/add-formation.component';
import { TrainingListComponent } from './pages/training-list/training-list';
import { TrainingViewerComponent } from './pages/training-viewer/training-viewer';
import { WishlistComponent } from './pages/wishlist/wishlist.component';
import { authGuard } from '../../core/guards/auth.guard';

export const formationRoutes: Routes = [
    { path: '', component: TrainingListComponent },
    { path: 'add', component: AddFormationComponent, canActivate: [authGuard] },
    { path: 'edit/:id', component: AddFormationComponent, canActivate: [authGuard] },
    { path: 'view/:id', component: TrainingViewerComponent, canActivate: [authGuard] },
    { path: 'wishlist', component: WishlistComponent, canActivate: [authGuard] }
];
