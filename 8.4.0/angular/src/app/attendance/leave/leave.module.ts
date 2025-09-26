import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';

import { LeaveRoutingModule } from './leave-routing.module';
import { LeaveRequestComponent } from '../components/leave-request/leave-request.component';
import { LeaveListComponent } from '../components/leave-list/leave-list.component';
import { ManagerApprovalsComponent } from '../manager-approvals/manager-approvals.component';

@NgModule({
    declarations: [
        LeaveRequestComponent,
        LeaveListComponent,
        ManagerApprovalsComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
        LeaveRoutingModule
    ]
})
export class LeaveModule { }
