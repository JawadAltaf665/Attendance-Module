import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AppSessionService } from '@shared/session/app-session.service';
import { PermissionCheckerService } from 'abp-ng2-module';
import { AppConsts } from '@shared/AppConsts';

interface LeaveDetailDto {
    id: number;
    employeeId: number;
    employeeName: string;
    employeeEmail: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    halfDay: boolean;
    status: string;
    reason: string;
    attachmentUrl?: string;
    totalDays: number;
    creationTime: Date;
    approverId?: number;
    approverName?: string;
    selected?: boolean;
}

interface BulkApprovalRequest {
    ids: number[];
    approverId: number;
    comment: string;
    isApproved: boolean;
}

@Component({
    selector: 'app-manager-approvals',
    templateUrl: './manager-approvals.component.html'
})
export class ManagerApprovalsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private baseUrl = AppConsts.remoteServiceBaseUrl;

    // Tab control
    activeTab = 'pto';

    // Filter form
    filterForm: FormGroup;
    showFilters = false;

    // Data
    pendingLeaves: LeaveDetailDto[] = [];
    selectedItems: Set<number> = new Set();

    // Loading states
    isLoading = false;
    isProcessing = false;

    // Pagination
    totalCount = 0;
    pageSize = 10;
    currentPage = 1;

    // Modal states
    showCommentModal = false;
    approvalComment = '';
    isApproving = true;

    // Selected item for detail view
    selectedLeave: LeaveDetailDto | null = null;
    showDetailModal = false;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private appSession: AppSessionService,
        public permission: PermissionCheckerService
    ) {
        this.initializeForm();
    }

    ngOnInit() {
        this.loadPendingItems();
        this.setupFormSubscriptions();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Toggle filter visibility
    toggleFilters() {
        this.showFilters = !this.showFilters;
    }

    private initializeForm() {
        this.filterForm = this.fb.group({
            employeeName: [''],
            startDate: [''],
            endDate: [''],
            leaveType: ['']
        });
    }

    private setupFormSubscriptions() {
        this.filterForm.valueChanges
            .pipe(
                debounceTime(500),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.loadPendingItems();
            });
    }

    loadPendingItems() {
        if (this.isLoading) return;

        this.isLoading = true;
        const filters = this.filterForm.value;

        // Build query parameters
        let params: string[] = [];

        if (filters.startDate) {
            params.push(`StartDate=${encodeURIComponent(new Date(filters.startDate).toISOString())}`);
        }

        if (filters.endDate) {
            params.push(`EndDate=${encodeURIComponent(new Date(filters.endDate).toISOString())}`);
        }

        if (filters.leaveType) {
            params.push(`LeaveType=${encodeURIComponent(filters.leaveType)}`);
        }

        const queryString = params.length > 0 ? `?${params.join('&')}` : '';
        const url = `${this.baseUrl}/api/services/app/Leave/GetPendingLeavesForManager${queryString}`;

        this.http.get<any>(url, this.getHttpOptions())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.pendingLeaves = response.result || [];
                    this.totalCount = this.pendingLeaves.length;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error loading pending items:', error);
                    abp.message.error('Failed to load pending approvals');
                    this.isLoading = false;
                }
            });
    }

    // Selection methods
    toggleItemSelection(item: LeaveDetailDto) {
        item.selected = !item.selected;
        if (item.selected) {
            this.selectedItems.add(item.id);
        } else {
            this.selectedItems.delete(item.id);
        }
    }

    toggleSelectAll() {
        const allSelected = this.isAllSelected();

        this.pendingLeaves.forEach(item => {
            item.selected = !allSelected;
            if (item.selected) {
                this.selectedItems.add(item.id);
            } else {
                this.selectedItems.delete(item.id);
            }
        });
    }

    isAllSelected(): boolean {
        return this.pendingLeaves.length > 0 &&
               this.pendingLeaves.every(item => item.selected);
    }

    isIndeterminate(): boolean {
        return this.pendingLeaves.some(item => item.selected) &&
               !this.isAllSelected();
    }

    hasSelection(): boolean {
        return this.selectedItems.size > 0;
    }

    // Approval actions
    openBulkApprovalModal(approve: boolean) {
        if (!this.hasSelection()) {
            abp.message.warn('Please select at least one item');
            return;
        }

        this.isApproving = approve;
        this.approvalComment = '';
        this.showCommentModal = true;
    }

    processBulkApproval() {
        if (this.isProcessing) return;

        this.isProcessing = true;

        const request: BulkApprovalRequest = {
            ids: Array.from(this.selectedItems),
            approverId: this.appSession.userId || 1,
            comment: this.approvalComment,
            isApproved: this.isApproving
        };

        const url = `${this.baseUrl}/api/services/app/Leave/BulkApproveLeave`;

        this.http.post<any>(url, request, this.getHttpOptions())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    const action = this.isApproving ? 'approved' : 'rejected';
                    abp.message.success(`Successfully ${action} ${this.selectedItems.size} item(s)`);
                    this.closeCommentModal();
                    this.selectedItems.clear();
                    this.loadPendingItems();
                    this.isProcessing = false;
                },
                error: (error) => {
                    console.error('Error processing bulk approval:', error);
                    abp.message.error('Failed to process approval');
                    this.isProcessing = false;
                }
            });
    }

    // Single item actions
    approveSingle(item: LeaveDetailDto) {
        if (this.isProcessing) return;

        abp.message.confirm(
            "Are you sure you want to approve this leave request?",
            "Confirm Approval",
            (isConfirmed) => {
                if (isConfirmed) {
                    this.isProcessing = true;

                    const request = {
                        approverId: this.appSession.userId || 1,
                        comment: ''
                    };

                    const url = `${this.baseUrl}/api/services/app/Leave/ApproveLeave?id=${item.id}`;

                    this.http.post<any>(url, request, this.getHttpOptions())
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                abp.message.success('Leave request approved successfully');
                                this.loadPendingItems();
                                this.isProcessing = false;
                            },
                            error: (error) => {
                                console.error('Error approving leave:', error);
                                abp.message.error('Failed to approve leave request');
                                this.isProcessing = false;
                            }
                        });
                }
            }
        );
    }

    rejectSingle(item: LeaveDetailDto) {
        if (this.isProcessing) return;

        abp.message.confirm(
            "Are you sure you want to reject this leave request?",
            "Confirm Rejection",
            (isConfirmed) => {
                if (isConfirmed) {
                    this.isProcessing = true;

                    const request = {
                        approverId: this.appSession.userId || 1,
                        comment: ''
                    };

                    const url = `${this.baseUrl}/api/services/app/Leave/RejectLeave?id=${item.id}`;

                    this.http.post<any>(url, request, this.getHttpOptions())
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                abp.message.success('Leave request rejected successfully');
                                this.loadPendingItems();
                                this.isProcessing = false;
                            },
                            error: (error) => {
                                console.error('Error rejecting leave:', error);
                                abp.message.error('Failed to reject leave request');
                                this.isProcessing = false;
                            }
                        });
                }
            }
        );
    }

    // View details
    viewDetails(item: LeaveDetailDto) {
        this.selectedLeave = item;
        this.showDetailModal = true;
    }

    closeDetailModal() {
        this.showDetailModal = false;
        this.selectedLeave = null;
    }

    closeCommentModal() {
        this.showCommentModal = false;
        this.approvalComment = '';
    }

    // Tab navigation
    switchTab(tab: string) {
        this.activeTab = tab;
        this.selectedItems.clear();
        this.loadPendingItems();
    }

    // Utility methods
    formatDate(date: Date | string): string {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    getLeaveTypeBadgeClass(type: string): string {
        switch (type) {
            case 'VACATION': return 'badge bg-primary';
            case 'SICK': return 'badge bg-warning';
            case 'PERSONAL': return 'badge bg-info';
            case 'UNPAID': return 'badge bg-secondary';
            default: return 'badge bg-light';
        }
    }

    private getHttpOptions() {
        const token = abp.auth.getToken();
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    }

    // Pagination
    get paginatedItems(): LeaveDetailDto[] {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.pendingLeaves.slice(start, end);
    }

    get totalPages(): number {
        return Math.ceil(this.totalCount / this.pageSize);
    }

    onPageChange(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }
}
