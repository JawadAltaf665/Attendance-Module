import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RosterComponent } from '../roster/roster.component';
import { AdminShiftsComponent } from '../admin-shifts/admin-shifts.component';
import { EmployeeShiftSwapComponent } from '../employee-shift-swap/employee-shift-swap.component';
import { ManagerSwapApprovalComponent } from '../manager-swap-approval/manager-swap-approval.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'schedule',
        pathMatch: 'full'
    },
    {
        path: 'schedule',
        component: RosterComponent,
        data: {
            permission: 'Pages.Rosters.View',
            title: 'Roster Schedule'
        }
    },
    {
        path: 'shifts',
        component: AdminShiftsComponent,
        data: {
            permission: 'Pages.Shifts.View',
            title: 'Shift Management'
        }
    },
    {
        path: 'shift-swap',
        component: EmployeeShiftSwapComponent,
        data: {
            permission: 'Pages.Rosters.SwapRequest',
            title: 'Shift Swap Request'
        }
    },
    {
        path: 'swap-approvals',
        component: ManagerSwapApprovalComponent,
        data: {
            permission: 'Pages.Rosters.SwapApprove',
            title: 'Swap Approvals'
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RosterManagementRoutingModule { }
