import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendanceClockComponent } from './components/attendance-clock/attendance-clock.component';
import { ClockInOutComponent } from './components/clock-in-out/clock-in-out.component';
import { AttendanceHistoryComponent } from './attendance-history/attendance-history.component';

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
            permission: 'Pages.Attendance.ClockInOut',
            title: 'Attendance History'
        }
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AttendanceRoutingModule { }