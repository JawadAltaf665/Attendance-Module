import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { RosterService, RosterWithShift, ShiftSwapRequestDto, ShiftSwapRequestDetailDto } from '@shared/services/roster.service';
import { EmployeeService } from '@shared/services/employee.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-employee-shift-swap',
  templateUrl: './employee-shift-swap.component.html',
  styleUrls: ['./employee-shift-swap.component.css']
})
export class EmployeeShiftSwapComponent extends AppComponentBase implements OnInit {
  myRoster: RosterWithShift[] = [];
  employees: any[] = [];
  mySwapRequests: ShiftSwapRequestDetailDto[] = [];
  loading = false;
  loadingRoster = false;
  loadingEmployees = false;

  // Request form
  showRequestForm = false;
  selectedRoster: RosterWithShift | null = null;
  newSwapRequest: ShiftSwapRequestDto = {
    requesterId: 0,
    targetEmployeeId: 0,
    shiftId: 0,
    rosterDate: '',
    reason: ''
  };

  // Pagination for swap requests
  totalCount = 0;
  pageSize = 10;
  pageNumber = 1;
  statusFilter = '';
  Math = Math;

  constructor(
    injector: Injector,
    private rosterService: RosterService,
    private employeeService: EmployeeService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    // Only load data if user is logged in
    if (this.appSession.userId) {
      this.loadMyRoster();
      this.loadEmployees();
      this.loadMySwapRequests();
    } else {
      console.warn('User is not logged in, skipping data load');
    }
  }

  loadMyRoster(): void {
    this.loadingRoster = true;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Next 3 months

    console.log('Loading roster for current user:', this.appSession.userId);

    this.rosterService.getMyRoster(startDate, endDate)
      .pipe(finalize(() => this.loadingRoster = false))
      .subscribe(
        (response) => {
          const result = (response as any).result || response;
          this.myRoster = result || [];
          console.log('Loaded my roster:', this.myRoster);
          
          // Validate that these are actually MY assigned shifts
          if (this.myRoster.length > 0) {
            const currentEmployeeId = this.getCurrentEmployeeId();
            if (currentEmployeeId) {
              this.myRoster = this.myRoster.filter(roster => 
                roster.employeeId === currentEmployeeId
              );
              console.log('Filtered roster for current employee:', this.myRoster);
            }
          }
        },
        (error) => {
          console.error('Failed to load roster:', error);
          // Only show error if it's not a "no employee found" case
          if (error?.status !== 500) {
            abp.notify.error('Failed to load your roster');
          }
          // Initialize with empty array on error
          this.myRoster = [];
        }
      );
  }

  loadEmployees(): void {
    this.loadingEmployees = true;
    this.employeeService.getAllEmployees()
      .pipe(finalize(() => this.loadingEmployees = false))
      .subscribe(
        (response) => {
          const result = (response as any).result || response;
          this.employees = result || [];
        },
        (error) => {
          console.error('Failed to load employees:', error);
          abp.notify.error('Failed to load employees');
        }
      );
  }

  loadMySwapRequests(): void {
    this.loading = true;
    const skipCount = (this.pageNumber - 1) * this.pageSize;

    this.rosterService.getMySwapRequests(this.statusFilter || undefined, this.pageSize, skipCount)
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        (response) => {
          const result = (response as any).result || response;
          this.mySwapRequests = result.items || [];
          this.totalCount = result.totalCount || 0;
        },
        (error) => {
          console.error('Failed to load swap requests:', error);
          // Only show error if it's not a "no employee found" case
          if (error?.status !== 500) {
            abp.notify.error('Failed to load your swap requests');
          }
          // Initialize with empty array on error
          this.mySwapRequests = [];
          this.totalCount = 0;
        }
      );
  }

  openRequestForm(roster: RosterWithShift): void {
    this.selectedRoster = roster;
    this.newSwapRequest = {
      requesterId: 0, // Will be set by backend
      targetEmployeeId: 0,
      shiftId: roster.shift.id,
      rosterDate: roster.rosterDate,
      reason: ''
    };
    this.showRequestForm = true;
  }

  closeRequestForm(): void {
    this.showRequestForm = false;
    this.selectedRoster = null;
  }

  submitSwapRequest(): void {
    if (!this.newSwapRequest.targetEmployeeId || !this.newSwapRequest.reason) {
      abp.notify.error('Please select a target employee and provide a reason');
      return;
    }

    // Get the current employee's ID
    const currentEmployeeId = this.employees.find(e => e.userId === this.appSession.userId)?.id;
    if (!currentEmployeeId) {
      abp.notify.error('Could not determine your employee ID');
      return;
    }

    if (this.newSwapRequest.targetEmployeeId === currentEmployeeId) {
      abp.notify.error('You cannot swap shifts with yourself');
      return;
    }

    // Set the requester ID
    this.newSwapRequest.requesterId = currentEmployeeId;

    this.loading = true;
    this.rosterService.requestShiftSwap(this.newSwapRequest)
      .pipe(finalize(() => {
        this.loading = false;
        this.closeRequestForm();
      }))
      .subscribe(
        (result) => {
          abp.notify.success('Shift swap request submitted successfully. The target employee will be notified.');
          this.loadMySwapRequests();
        },
        (error) => {
          console.error('Failed to submit swap request:', error);
          const errorMessage = error?.error?.error?.message || 'Failed to submit swap request';
          abp.notify.error(errorMessage);
        }
      );
  }

  onStatusFilterChange(): void {
    this.pageNumber = 1;
    this.loadMySwapRequests();
  }

  onPageChange(page: number): void {
    this.pageNumber = page;
    this.loadMySwapRequests();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'badge bg-warning';
      case 'APPROVED':
        return 'badge bg-success';
      case 'REJECTED':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  canRequestSwap(rosterDate: string): boolean {
    const rosterDateObj = new Date(rosterDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    rosterDateObj.setHours(0, 0, 0, 0);

    // Can only request swap for future dates (at least tomorrow)
    return rosterDateObj > today;
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  }

  getDaysDifference(date: string): number {
    const rosterDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    rosterDate.setHours(0, 0, 0, 0);
    const diffTime = rosterDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getUrgencyClass(date: string): string {
    const days = this.getDaysDifference(date);
    if (days <= 2) return 'text-danger';
    if (days <= 7) return 'text-warning';
    return 'text-success';
  }

  getCurrentEmployeeId(): number | null {
    const currentEmployee = this.employees.find(e => e.userId === this.appSession.userId);
    return currentEmployee ? currentEmployee.id : null;
  }
}