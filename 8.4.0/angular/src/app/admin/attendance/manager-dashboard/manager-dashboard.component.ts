import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PermissionCheckerService } from 'abp-ng2-module';

@Component({
    selector: 'app-manager-dashboard',
    templateUrl: './manager-dashboard.component.html'
})
export class ManagerDashboardComponent {
    //// Live Clock
    //currentTime = new Date();
    //private clockInterval: any;

    //// Stats & Data
    //teamStats: any = { presentToday: 0, absentToday: 0, lateToday: 0 };
    //teamAttendance: any[] = [];
    //pendingApprovals: any = { total: 0 };
    //pendingLeaveRequests: any[] = [];
    //pendingShiftSwaps: any[] = [];
    //pendingOvertimeRequests: any[] = [];
    //teamReports: any[] = [];
    //teamSummary: any = {};
    //teamMembers: any[] = [];

    //// Selected Employee Modal
    //selectedEmployee: any = null;
    //selectedEmployeeRecords: any[] = [];

    //// Report Filters
    //reportFilter: any = { dateRange: 'today', employeeId: '', startDate: '', endDate: '' };

    //// Approval Modal
    //approvalData: any = null;
    //rejectionReason: string = '';

    //// View Mode
    //viewMode: 'today' | 'week' = 'today';

    //// API URLs
    //private baseUrl = 'https://localhost:44311/api/services/app';
    //private attendanceUrl = `${this.baseUrl}/Attendance`;
    //private reportUrl = `${this.baseUrl}/Report`;
    //private leaveUrl = `${this.baseUrl}/Leave`;

    //constructor(
    //    private http: HttpClient,
    //    public permission: PermissionCheckerService
    //) { }

    //ngOnInit() {
    //    // Live Clock
    //    this.clockInterval = setInterval(() => {
    //        this.currentTime = new Date();
    //    }, 1000);

    //    // Initial Loads
    //    this.loadTeamStats();
    //    this.loadTeamAttendance();
    //    this.loadPendingRequests();
    //    this.loadTeamReports();
    //}

    //ngOnDestroy() {
    //    if (this.clockInterval) clearInterval(this.clockInterval);
    //}

    ///** -------------------
    // * 📊 Dashboard Loading
    // -------------------- */
    //loadTeamStats() {
    //    this.http.get<any>(`${this.reportUrl}/GetTeamStats`).subscribe({
    //        next: (res) => (this.teamStats = res.result || {}),
    //        error: (err) => console.error('Error loading stats:', err)
    //    });
    //}

    //loadTeamAttendance() {
    //    this.http.get<any[]>(`${this.attendanceUrl}/GetTeamAttendance?mode=${this.viewMode}`).subscribe({
    //        next: (res: any) => (this.teamAttendance = res.result || []),
    //        error: (err) => console.error('Error loading attendance:', err)
    //    });
    //}

    //loadPendingRequests() {
    //    this.http.get<any>(`${this.leaveUrl}/GetPendingApprovals`).subscribe({
    //        next: (res) => {
    //            this.pendingLeaveRequests = res.result?.leaveRequests || [];
    //            this.pendingShiftSwaps = res.result?.shiftSwaps || [];
    //            this.pendingOvertimeRequests = res.result?.overtimes || [];
    //            this.pendingApprovals.total =
    //                this.pendingLeaveRequests.length +
    //                this.pendingShiftSwaps.length +
    //                this.pendingOvertimeRequests.length;
    //        },
    //        error: (err) => console.error('Error loading pending requests:', err)
    //    });
    //}

    //loadTeamReports() {
    //    this.http.post<any>(`${this.reportUrl}/GetTeamReports`, this.reportFilter).subscribe({
    //        next: (res) => {
    //            this.teamReports = res.result?.reports || [];
    //            this.teamSummary = res.result?.summary || {};
    //            this.teamMembers = res.result?.members || [];
    //        },
    //        error: (err) => console.error('Error loading reports:', err)
    //    });
    //}

    ///** -------------------
    // * 🕒 View Mode
    // -------------------- */
    //setViewMode(mode: 'today' | 'week') {
    //    this.viewMode = mode;
    //    this.loadTeamAttendance();
    //}

    ///** -------------------
    // * 👥 Employee Details
    // -------------------- */
    //viewEmployeeDetails(employeeId: number) {
    //    this.http.get<any>(`${this.attendanceUrl}/GetEmployeeDetails?employeeId=${employeeId}`).subscribe({
    //        next: (res) => {
    //            this.selectedEmployee = res.result?.employee;
    //            this.selectedEmployeeRecords = res.result?.records || [];
    //            // Bootstrap modal open
    //            const modal = document.getElementById('employeeDetailModal');
    //            if (modal) (window as any).bootstrap.Modal.getOrCreateInstance(modal).show();
    //        },
    //        error: (err) => console.error('Error loading employee details:', err)
    //    });
    //}

    ///** -------------------
    // * ✅ Approvals
    // -------------------- */
    //approveLeave(id: number) {
    //    this.http.post(`${this.leaveUrl}/ApproveLeave`, { id }).subscribe({
    //        next: () => {
    //            abp.message.success('Leave approved');
    //            this.loadPendingRequests();
    //        },
    //        error: (err) => {
    //            console.error('Error approving leave:', err);
    //            abp.message.error('Approval failed');
    //        }
    //    });
    //}

    //rejectLeave(id: number) {
    //    this.http.post(`${this.leaveUrl}/RejectLeave`, { id, reason: this.rejectionReason }).subscribe({
    //        next: () => {
    //            abp.message.success('Leave rejected');
    //            this.loadPendingRequests();
    //        },
    //        error: (err) => {
    //            console.error('Error rejecting leave:', err);
    //            abp.message.error('Rejection failed');
    //        }
    //    });
    //}

    //approveShiftSwap(id: number) {
    //    this.http.post(`${this.baseUrl}/Shift/Approve`, { id }).subscribe({
    //        next: () => {
    //            abp.message.success('Shift swap approved');
    //            this.loadPendingRequests();
    //        },
    //        error: (err) => console.error('Error approving shift swap:', err)
    //    });
    //}

    //rejectShiftSwap(id: number) {
    //    this.http.post(`${this.baseUrl}/Shift/Reject`, { id }).subscribe({
    //        next: () => {
    //            abp.message.success('Shift swap rejected');
    //            this.loadPendingRequests();
    //        },
    //        error: (err) => console.error('Error rejecting shift swap:', err)
    //    });
    //}

    //approveOvertime(id: number) {
    //    this.http.post(`${this.baseUrl}/Overtime/Approve`, { id }).subscribe({
    //        next: () => {
    //            abp.message.success('Overtime approved');
    //            this.loadPendingRequests();
    //        },
    //        error: (err) => console.error('Error approving overtime:', err)
    //    });
    //}

    //rejectOvertime(id: number) {
    //    this.http.post(`${this.baseUrl}/Overtime/Reject`, { id }).subscribe({
    //        next: () => {
    //            abp.message.success('Overtime rejected');
    //            this.loadPendingRequests();
    //        },
    //        error: (err) => console.error('Error rejecting overtime:', err)
    //    });
    //}

    ///** -------------------
    // * 📊 Reports
    // -------------------- */
    //exportTeamReport(type: 'pdf' | 'excel') {
    //    this.http
    //        .post(`${this.reportUrl}/ExportTeamReport?format=${type}`, this.reportFilter, { responseType: 'blob' })
    //        .subscribe({
    //            next: (blob) => {
    //                const url = window.URL.createObjectURL(blob);
    //                const a = document.createElement('a');
    //                a.href = url;
    //                a.download = `team-report.${type}`;
    //                a.click();
    //            },
    //            error: (err) => console.error(`Error exporting report (${type}):`, err)
    //        });
    //}

    ///** -------------------
    // * 🎨 UI Helpers
    // -------------------- */
    //getStatusClass(status: string): string {
    //    switch (status) {
    //        case 'PRESENT': return 'bg-success';
    //        case 'LATE': return 'bg-warning';
    //        case 'ABSENT': return 'bg-danger';
    //        case 'ON_BREAK': return 'bg-info';
    //        default: return 'bg-secondary';
    //    }
    //}

    //getEfficiencyClass(value: number): string {
    //    if (value >= 80) return 'bg-success';
    //    if (value >= 50) return 'bg-warning';
    //    return 'bg-danger';
    //}
}
