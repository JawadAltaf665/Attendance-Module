import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendanceClockComponent } from './components/attendance-clock/attendance-clock.component';
import { ClockInOutComponent } from './components/clock-in-out/clock-in-out.component';
import { AttendanceHistoryComponent } from './attendance-history/attendance-history.component';
import { LeaveRequestComponent } from './components/leave-request/leave-request.component';
import { LeaveListComponent } from './components/leave-list/leave-list.component';
import { ManagerApprovalsComponent } from './manager-approvals/manager-approvals.component';
import { RosterComponent } from './roster/roster.component';
import { ManagerSwapApprovalComponent } from './manager-swap-approval/manager-swap-approval.component';
import { AdminShiftsComponent } from './admin-shifts/admin-shifts.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'clock-in-out',
        pathMatch: 'full'
    },
    {
        path: 'clock',
        component: AttendanceClockComponent,
        data: {
            permission: 'Pages.Attendance.ClockInOut',
            title: 'Clock In/Out'
        }
    },
    {
        path: 'clock-in-out',
        component: ClockInOutComponent,
        data: {
            permission: 'Pages.Attendance.ClockInOut',
            title: 'Clock In/Out'
        }
    },
    {
        path: 'history',
        component: AttendanceHistoryComponent,
        data: {
            permission: 'Pages.Attendance.View',
            title: 'Attendance History'
        }
    },
    {
        path: 'leave-request',
        component: LeaveRequestComponent,
        data: {
            permission: 'Pages.Leaves.Request',
            title: 'Request Leave'
        }
    },
    {
        path: 'leave-list',
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
            title: 'Manager Approvals'
        }
    },
    {
        path: 'roster',
        component: RosterComponent,
        data: {
            permission: 'Pages.Rosters.View',
            title: 'Roster Schedule'
        }
    },
    {
        path: 'swap-approvals',
        component: ManagerSwapApprovalComponent,
        data: {
            permission: 'Pages.Rosters.Swap',
            title: 'Swap Approvals'
        }
    },
    {
        path: 'admin/shifts',
        component: AdminShiftsComponent,
        data: {
            permission: 'Pages.Shifts.View',
            title: 'Shift Management'
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AttendanceRoutingModule { }