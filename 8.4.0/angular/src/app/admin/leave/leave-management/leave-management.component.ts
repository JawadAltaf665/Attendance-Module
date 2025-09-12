import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PermissionCheckerService } from 'abp-ng2-module';
import { BsModalService } from 'ngx-bootstrap/modal';
import { RequestLeaveFormComponent } from '../request-leave-form/request-leave-form.component';

@Component({
  selector: 'app-leave-management',
  templateUrl: './leave-management.component.html',
  styleUrls: ['./leave-management.component.css']
})
export class LeaveManagementComponent {
    balances = [
        { type: 'Vacation', hours: 5, icon: 'fas fa-umbrella-beach', color: 'text-primary' },
        { type: 'Sick Leave', hours: 4, icon: 'fas fa-briefcase-medical', color: 'text-danger' },
        { type: 'Personal', hours: 10, icon: 'fas fa-home', color: 'text-info' },
        { type: 'Unpaid', hours: 0, icon: 'fas fa-clock', color: 'text-secondary' }
    ];

    //requests: any[] = [];
    recentLeaves: any[] = [];
    pendingRequets: any[] = [];
    activeTab = 'requests';
    private apiUrl = 'https://localhost:44311/api/services/app/Leave';
    employeeId: number;
    _appSessionService: any;

    constructor(
        private http: HttpClient,
        private modalService: BsModalService,
        public permission: PermissionCheckerService,

    ) { }

    ngOnInit(): void {
        if (this.permission.isGranted('Pages.Leaves.Approve')) {
            this.activeTab = 'requests';  // Manager view
            this.loadPendingRequests();
        } else {
            this.activeTab = 'overview';  // Employee view
            this.loadBalances();
            this.loadRecentLeaves();
        }
    }

    approve(request: any) {
        debugger;
        console.log("Calling ApproveLeave API with:", { id: request.id });

        this.http.post<any>(`${this.apiUrl}/ApproveLeave?id=${request.id}`, {})
            .subscribe({
                next: () => {
                    abp.message.success("Leave request approved");
                    this.loadPendingRequests();
                    this.loadRecentLeaves();
                },
                error: (err) => {
                    console.error("Error approving leave:", err);
                    abp.message.error("Failed to approve leave request");
                }
            });

    }



    reject(request: any) {
        debugger;
        this.http.post<any>(`${this.apiUrl}/RejectLeave?id=${request.id}`, {})
            .subscribe({
                next: () => {
                    abp.message.success("Leave request rejected");
                    this.loadPendingRequests();
                    this.loadRecentLeaves();
                },
                error: (err) => {
                    console.error("Error approving leave:", err);
                    abp.message.error("Failed to approve leave request");
                }
            });
    }

    loadRecentLeaves() {
        debugger;
        this.http.get<any>(`${this.apiUrl}/GetMyLeaves`)
            .subscribe({
                next: (res) => {
                    this.recentLeaves = res.result || [];
                },
                error: (err) => {
                    console.error("Error loading leaves:", err);
                    abp.message.error("Failed to load leave requests");
                }
            });
    }

    loadPendingRequests() {
        this.http.get<any>(`${this.apiUrl}/GetAllLeaves`)
            .subscribe({
                next: (res: any) => {
                    // Filter only pending requests
                    this.pendingRequets = (res.result || []).filter((r: any) => r.status === 'PENDING');

                },
                error: (err) => {
                    console.error("Error loading requests:", err);
                    abp.message.error("Failed to load requests");
                }
            });
    }


    loadBalances() {
        this.http.get<any>(`${this.apiUrl}/GetBalances?employeeId=1`).subscribe({
            next: (res: any) => {
                if (res && res.result) {
                    this.balances.forEach(b => {
                        const found = res.result.find((x: any) => x.type === b.type);
                        if (found) b.hours = found.hours;
                    });
                }
            },
            error: err => console.error('Error loading balances:', err)
        });
    }

    //loadRequests() {
    //    this.http.get<any>(`${this.apiUrl}/GetAllLeaves`).subscribe({
    //        next: (res: any) => {
    //            this.requests = res.result || [];
    //        },
    //        error: err => console.error('Error loading requests:', err)
    //    });
    //}

    public openRequestModal() {
        const modalRef = this.modalService.show(RequestLeaveFormComponent);
    }
}
