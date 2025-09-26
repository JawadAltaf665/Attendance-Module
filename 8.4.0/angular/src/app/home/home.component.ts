import { Component, Injector, OnInit, ChangeDetectorRef } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DashboardService, AdminDashboardData, EmployeeDashboardData } from '@shared/services/dashboard.service';
import { finalize } from 'rxjs/operators';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [appModuleAnimation()]
})
export class HomeComponent extends AppComponentBase implements OnInit {
  loading = false;
  isAdmin = false;
  isEmployee = false;
  
  // Admin Dashboard Data
  adminData: AdminDashboardData | null = null;
  
  // Employee Dashboard Data
  employeeData: EmployeeDashboardData | null = null;

  constructor(
    injector: Injector,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.determineUserRole();
    this.loadDashboardData();
  }

  private determineUserRole(): void {
    // Check permissions to determine user role (admin-first, mutually exclusive)
    const hasAdminPerm = this.permission.isGranted('Pages.Administration') ||
                         this.permission.isGranted('Pages.Users') ||
                         this.permission.isGranted('Pages.Roles') ||
                         this.permission.isGranted('Pages.Employees') ||
                         this.isHost();

    const hasEmployeePerm = this.permission.isGranted('Pages.Attendance.ClockInOut') ||
                             this.permission.isGranted('Pages.Rosters.View');

    // Prioritize admin dashboard; only show employee dashboard when not admin
    this.isAdmin = !!hasAdminPerm;
    this.isEmployee = !this.isAdmin && !!hasEmployeePerm;

    console.log('User role determined:', { isAdmin: this.isAdmin, isEmployee: this.isEmployee });
  }

  private loadDashboardData(): void {
    this.loading = true;

    if (this.isAdmin) {
      this.loadAdminDashboard();
    } else if (this.isEmployee) {
      this.loadEmployeeDashboard();
    } else {
      this.loading = false;
    }
  }

  private loadAdminDashboard(): void {
    this.dashboardService.getAdminDashboard()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.adminData = data;
          console.log('Admin dashboard data loaded:', data);
        },
        error: (error) => {
          console.error('Failed to load admin dashboard:', error);
          abp.notify.error('Failed to load dashboard data');
        }
      });
  }

  private loadEmployeeDashboard(): void {
    this.dashboardService.getEmployeeDashboard()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.employeeData = data;
          console.log('Employee dashboard data loaded:', data);
        },
        error: (error) => {
          console.error('Failed to load employee dashboard:', error);
          abp.notify.error('Failed to load dashboard data');
        }
      });
  }

  // ==================== HELPER METHODS ====================

  formatDate(date: string | Date): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    if (!time) return '-';
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'badge bg-secondary';
    
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'badge bg-warning';
      case 'APPROVED':
        return 'badge bg-success';
      case 'REJECTED':
        return 'badge bg-danger';
      case 'PRESENT':
        return 'badge bg-success';
      case 'ABSENT':
        return 'badge bg-danger';
      case 'CLOCK_IN':
        return 'badge bg-info';
      case 'CLOCK_OUT':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  }

  getAttendancePercentage(): number {
    if (!this.employeeData?.attendanceSummary?.thisMonth) return 0;
    
    const summary = this.employeeData.attendanceSummary.thisMonth;
    const totalDays = summary?.totalDays || 0;
    const leaveDays = summary?.leaveDays || 0;
    const presentDays = summary?.presentDays || 0;
    const totalWorkingDays = totalDays - leaveDays;
    
    if (totalWorkingDays === 0) return 0;
    
    return Math.round((presentDays / totalWorkingDays) * 100);
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  private isHost(): boolean {
    return this.appSession.tenant === null;
  }

  getCurrentDate(): Date {
    return new Date();
  }
}
