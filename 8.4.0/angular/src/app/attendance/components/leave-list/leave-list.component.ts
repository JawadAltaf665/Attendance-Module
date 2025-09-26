import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AttendanceApiService } from '../../services/attendance-api.service';
import { LeaveRequest, LeaveBalanceDto } from '../../models/index';

export interface LeaveDetailDto {
    id: number;

    // Employee Information
    employeeId: number;
    employeeName: string;
    employeeEmail?: string;   // you had it but commented out in HTML

    // Leave Details
    leaveType: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    halfDay?: boolean;        // optional because not always shown
    status: string;

    // Extra Info
    reason: string;
    attachmentUrl?: string;   // for uploaded file
    approverName?: string;    // who approved/rejected
    creationTime: Date;       // when request was created

    // UI helpers
    selected?: boolean;       // for checkbox/bulk selection
}

@Component({
    selector: 'app-leave-list',
    templateUrl: './leave-list.component.html'
})

export class LeaveListComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // Data
    leaveRequests: LeaveRequest[] = [];
    leaveBalances: LeaveBalanceDto[] = [];
    isLoading = false;

    // Filters
    selectedStatus = 'ALL';
    selectedType = 'ALL';
    searchTerm = '';

    // Filtered data
    filteredRequests: LeaveRequest[] = [];
    selectedMyLeave: LeaveDetailDto | null = null;
    showMyLeaveModal = false;

    // Statistics
    statistics = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalDaysUsed: 0
    };
    showLeaveBalances = true;
    showFilters = false;

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalPages = 0;
    paginatedRequests: LeaveRequest[] = [];

    // Expose Math to template
    Math = Math;

    constructor(
        private router: Router,
        private attendanceService: AttendanceApiService
    ) { }

    ngOnInit(): void {
        this.loadLeaveRequests();
        this.loadLeaveBalances();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Toggle Events
    toggleLeaveBalances(): void {
        this.showLeaveBalances = !this.showLeaveBalances;
    }
    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }

    private loadLeaveRequests(): void {
        this.isLoading = true;
        this.attendanceService.getMyLeaves()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (requests) => {
                    this.leaveRequests = requests.sort((a, b) =>
                        new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
                    );
                    this.calculateStatistics();
                    this.applyFilters();
                },
                error: (error) => {
                    console.error('Failed to load leave requests:', error);
                    abp.message.error('Failed to load your leave requests');
                    this.leaveRequests = [];
                },
                complete: () => {
                    this.isLoading = false;
                }
            });
    }

    private loadLeaveBalances(): void {
        this.attendanceService.getLeaveBalance()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (balanceData) => {
                    this.leaveBalances = balanceData.balances || [];
                },
                error: (error) => {
                    console.error('Failed to load leave balances:', error);
                    this.leaveBalances = [];
                }
            });
    }

    private calculateStatistics(): void {
        this.statistics.total = this.leaveRequests.length;
        this.statistics.pending = this.leaveRequests.filter(r => r.status === 'PENDING').length;
        this.statistics.approved = this.leaveRequests.filter(r => r.status === 'APPROVED').length;
        this.statistics.rejected = this.leaveRequests.filter(r => r.status === 'REJECTED').length;

        // Calculate total days used (approved leaves only)
        this.statistics.totalDaysUsed = this.leaveRequests
            .filter(r => r.status === 'APPROVED')
            .reduce((total, request) => {
                const days = this.calculateDays(request);
                return total + days;
            }, 0);
    }

    applyFilters(): void {
        this.filteredRequests = this.leaveRequests.filter(request => {
            // Status filter
            if (this.selectedStatus !== 'ALL' && request.status !== this.selectedStatus) {
                return false;
            }

            // Type filter
            if (this.selectedType !== 'ALL' && request.leaveType !== this.selectedType) {
                return false;
            }

            // Search filter
            if (this.searchTerm) {
                const searchLower = this.searchTerm.toLowerCase();
                return request.reason?.toLowerCase().includes(searchLower) ||
                       request.leaveType.toLowerCase().includes(searchLower);
            }

            return true;
        });

        this.updatePagination();
    }

    updatePagination(): void {
        this.totalPages = Math.ceil(this.filteredRequests.length / this.pageSize);
        this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.paginatedRequests = this.filteredRequests.slice(startIndex, endIndex);
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilters();
    }

    onPageChange(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
        }
    }

    onRequestNewLeave(): void {
        this.router.navigate(['/app/attendance/leave-request']);
    }

    onViewDetails(item: LeaveDetailDto): void {
        // Show details in a modal or navigate to detail page
        this.selectedMyLeave = item;   // uses employee’s own leave list
        this.showMyLeaveModal = true;
    }

    closeMyLeaveModal() {
        this.showMyLeaveModal = false;   // or whatever boolean you’re using to toggle modal
        this.selectedMyLeave = null;
    }

    getLeaveTypeBadgeClass(leaveType: string): string {
        switch (leaveType) {
            case 'Sick':
                return 'badge bg-warning';
            case 'Casual':
                return 'badge bg-info';
            case 'Annual':
                return 'badge bg-success';
            default:
                return 'badge bg-secondary';
        }
    }

    onCancelRequest(request: LeaveRequest): void {
        if (request.status !== 'PENDING') {
            abp.message.warn('Only pending requests can be cancelled');
            return;
        }

        abp.message.confirm(
            'Are you sure you want to cancel this leave request?',
            'Cancel Leave Request',
            (result: boolean) => {
                if (result) {
                    this.cancelLeaveRequest(request.id);
                }
            }
        );
    }

    private cancelLeaveRequest(requestId: number): void {
        // In a real implementation, this would call the backend to cancel the request
        abp.notify.success('Leave request cancelled successfully');
        this.loadLeaveRequests();
    }

    calculateDays(request: LeaveRequest): number {
        if (request.halfDay) {
            return 0.5;
        }

        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        let days = 0;
        const current = new Date(start);

        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                days++;
            }
            current.setDate(current.getDate() + 1);
        }

        return days;
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'PENDING':
                return 'badge bg-warning text-dark';
            case 'APPROVED':
                return 'badge bg-success';
            case 'REJECTED':
                return 'badge bg-danger';
            default:
                return 'badge bg-secondary';
        }
    }

    getLeaveTypeIcon(leaveType: string): string {
        switch (leaveType) {
            case 'VACATION':
                return 'fa-umbrella-beach';
            case 'SICK':
                return 'fa-briefcase-medical';
            case 'PERSONAL':
                return 'fa-home';
            case 'UNPAID':
                return 'fa-clock';
            default:
                return 'fa-calendar';
        }
    }

    getLeaveTypeColor(leaveType: string): string {
        switch (leaveType) {
            case 'VACATION':
                return 'primary';
            case 'SICK':
                return 'danger';
            case 'PERSONAL':
                return 'info';
            case 'UNPAID':
                return 'secondary';
            default:
                return 'secondary';
        }
    }

    formatDate(date: string | Date): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateRange(startDate: string | Date, endDate: string | Date): string {
        const start = this.formatDate(startDate);
        const end = this.formatDate(endDate);
        return start === end ? start : `${start} - ${end}`;
    }

    getBalanceForType(leaveType: string): LeaveBalanceDto | undefined {
        return this.leaveBalances.find(b => b.leaveType === leaveType);
    }

    refreshData(): void {
        this.loadLeaveRequests();
        this.loadLeaveBalances();
    }
}
