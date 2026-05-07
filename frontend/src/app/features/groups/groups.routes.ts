import { Routes } from '@angular/router';

export const groupsRoutes: Routes = [
    {
        path: 'groups',
        loadComponent: () => import('./pages/groups-list/groups-list.component').then(m => m.GroupsListComponent)
    },
    {
        path: 'groups/:id',
        loadComponent: () => import('./pages/group-detail/group-detail.component').then(m => m.GroupDetailComponent)
    }
];
