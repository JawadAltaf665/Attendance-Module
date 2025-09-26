import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';

import { RosterManagementRoutingModule } from './roster-management-routing.module';
import { RosterComponent } from '../roster/roster.component';
import { AdminShiftsComponent } from '../admin-shifts/admin-shifts.component';
import { EmployeeShiftSwapComponent } from '../employee-shift-swap/employee-shift-swap.component';
import { ManagerSwapApprovalComponent } from '../manager-swap-approval/manager-swap-approval.component';
import { AssignShiftFormComponent } from '../assign-shift-form/assign-shift-form.component';
import { ShiftCardComponent } from '../shift-card/shift-card.component';
import { ShiftDetailModalComponent } from '../shift-detail-modal/shift-detail-modal.component';
import { ShiftFormComponent } from '../shift-form/shift-form.component';

@NgModule({
    declarations: [
        RosterComponent,
        AdminShiftsComponent,
        EmployeeShiftSwapComponent,
        ManagerSwapApprovalComponent,
        AssignShiftFormComponent,
        ShiftCardComponent,
        ShiftDetailModalComponent,
        ShiftFormComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
        RosterManagementRoutingModule
    ]
})
export class RosterManagementModule { }
