import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AppRouteGuard } from '@shared/auth/auth-route-guard';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { UsersComponent } from './users/users.component';
import { TenantsComponent } from './tenants/tenants.component';
import { RolesComponent } from 'app/roles/roles.component';
import { ChangePasswordComponent } from './users/change-password/change-password.component';
import { AttendanceModule } from './attendance/attendance.module';
import { EmployeeListComponent } from './Employee/employee-list/employee-list.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: AppComponent,
                children: [
                    { path: 'home', component: HomeComponent, canActivate: [AppRouteGuard] },
                    { path: 'employees', component: EmployeeListComponent, data: { permission: 'Pages.Employees' }, canActivate: [AppRouteGuard] },
                    { path: 'users', component: UsersComponent, data: { permission: 'Pages.Users' }, canActivate: [AppRouteGuard] },
                    { path: 'roles', component: RolesComponent, data: { permission: 'Pages.Roles' }, canActivate: [AppRouteGuard] },
                    { path: 'tenants', component: TenantsComponent, data: { permission: 'Pages.Tenants' }, canActivate: [AppRouteGuard] },
                    { path: 'about', component: AboutComponent, canActivate: [AppRouteGuard] },
                    { path: 'update-password', component: ChangePasswordComponent, canActivate: [AppRouteGuard] },
                    // Attendance Management - Lazy loaded modules
                    {
                        path: 'attendance',
                        loadChildren: () => import('./attendance/attendance.module').then(m => m.AttendanceModule),
                        data: { permission: 'Pages.Attendance' },
                        canActivate: [AppRouteGuard]
                    },
                    {
                        path: 'leave',
                        loadChildren: () => import('./attendance/leave/leave.module').then(m => m.LeaveModule),
                        data: { permission: 'Pages.Leaves' },
                        canActivate: [AppRouteGuard]
                    },
                    {
                        path: 'roster',
                        loadChildren: () => import('./attendance/roster-management/roster-management.module').then(m => m.RosterManagementModule),
                        data: { permission: 'Pages.Rosters' },
                        canActivate: [AppRouteGuard]
                    }


                ]
            }
        ])
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
