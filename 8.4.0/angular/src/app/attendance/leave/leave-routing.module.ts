import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeaveRequestComponent } from '../components/leave-request/leave-request.component';
import { LeaveListComponent } from '../components/leave-list/leave-list.component';
import { ManagerApprovalsComponent } from '../manager-approvals/manager-approvals.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'my-requests',
        pathMatch: 'full'
    },
    {
        path: 'request',
        component: LeaveRequestComponent,
        data: {
            permission: 'Pages.Leaves.Request',
            title: 'Request Leave'
        }
    },
    {
        path: 'my-requests',
        component: LeaveListComponent,
        data: {
            permission: 'Pages.Leaves.View',
            title: 'My Leave Requests'
        }
    },
    {
        path: 'approvals',
        component: ManagerApprovalsComponent,
        data: {
            permission: 'Pages.Leaves.Approve',
            title: 'Leave Approvals'
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LeaveRoutingModule { }
