import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// ABP modules
import { AbpModule } from 'abp-ng2-module';
import { SharedModule } from '@shared/shared.module';

// Routing
import { AttendanceRoutingModule } from './attendance-routing.module';

// Components
import { AttendanceClockComponent } from './components/attendance-clock/attendance-clock.component';
import { AttendanceStatusCardComponent } from './components/attendance-status-card/attendance-status-card.component';
import { SelfieCaptureComponent } from './components/selfie-capture/selfie-capture.component';
import { ClockInOutComponent } from './components/clock-in-out/clock-in-out.component';
import { AttendanceHistoryComponent } from './attendance-history/attendance-history.component';
import { LeaveRequestComponent } from './components/leave-request/leave-request.component';
import { LeaveListComponent } from './components/leave-list/leave-list.component';
import { ManagerApprovalsComponent } from './manager-approvals/manager-approvals.component';
import { RosterComponent } from './roster/roster.component';
import { ShiftCardComponent } from './shift-card/shift-card.component';
import { ShiftDetailModalComponent } from './shift-detail-modal/shift-detail-modal.component';
import { ManagerSwapApprovalComponent } from './manager-swap-approval/manager-swap-approval.component';
import { AdminShiftsComponent } from './admin-shifts/admin-shifts.component';
import { ShiftFormComponent } from './shift-form/shift-form.component';
import { AssignShiftFormComponent } from './assign-shift-form/assign-shift-form.component';
import { EmployeeShiftSwapComponent } from './employee-shift-swap/employee-shift-swap.component';

// Services
import { AttendanceApiService } from './services/attendance-api.service';
import { EmployeeSessionService } from './services/employee-session.service';

@NgModule({
    declarations: [
        AttendanceClockComponent,
        AttendanceStatusCardComponent,
        SelfieCaptureComponent,
        ClockInOutComponent,
        AttendanceHistoryComponent,
        LeaveRequestComponent,
        LeaveListComponent,
        ManagerApprovalsComponent,
        RosterComponent,
        ShiftCardComponent,
        ShiftDetailModalComponent,
        ManagerSwapApprovalComponent,
        AdminShiftsComponent,
        ShiftFormComponent,
        AssignShiftFormComponent,
        EmployeeShiftSwapComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,

        // ABP modules
        AbpModule,
        SharedModule,

        // Routing
        AttendanceRoutingModule
    ],
    providers: [
        AttendanceApiService,
        EmployeeSessionService
    ]
})
export class AttendanceModule { }