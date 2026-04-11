import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TrainerRequestsComponent } from './pages/trainer-requests/trainer-requests.component';
 import { usersRoutes } from '../users/users.routes';
import { ProductListComponent } from '../../product-list/product-list.component';
 import { OrdersListComponent } from '../../product-list/orders-list.component';
import { ProductsListComponentAdmin } from '../../product-list/products-listadmin.component';
import { Forumadmin } from '../../forumadmin/forumadmin';

export const adminRoutes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'trainer-requests', component: TrainerRequestsComponent },
   { path: 'products', component: ProductListComponent },
  { path: 'productss', component: ProductsListComponentAdmin },
  { path: 'orders', component: OrdersListComponent },
  { path: 'posts', component: Forumadmin },
  
  ...usersRoutes,
];
