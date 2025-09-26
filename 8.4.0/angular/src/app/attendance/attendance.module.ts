import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// ABP modules
import { SharedModule } from '@shared/shared.module';

// Routing
import { AttendanceRoutingModule } from './attendance-routing.module';

// Core Attendance Components (Clock In/Out and History only)
import { AttendanceClockComponent } from './components/attendance-clock/attendance-clock.component';
import { AttendanceStatusCardComponent } from './components/attendance-status-card/attendance-status-card.component';
import { SelfieCaptureComponent } from './components/selfie-capture/selfie-capture.component';
import { ClockInOutComponent } from './components/clock-in-out/clock-in-out.component';
import { AttendanceHistoryComponent } from './attendance-history/attendance-history.component';

// Services
import { AttendanceApiService } from './services/attendance-api.service';
import { EmployeeSessionService } from './services/employee-session.service';

@NgModule({
    declarations: [
        AttendanceClockComponent,
        AttendanceStatusCardComponent,
        SelfieCaptureComponent,
        ClockInOutComponent,
        AttendanceHistoryComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,

        // Shared modules
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