import { Component, Input, Output, EventEmitter, OnInit, Injector } from '@angular/core';
import { RosterWithShift, RosterService, ShiftSwapRequestDto } from '@shared/services/roster.service';
import { AppComponentBase } from '@shared/app-component-base';
import { EmployeeDto, EmployeeService } from '@shared/services/employee.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-shift-detail-modal',
  templateUrl: './shift-detail-modal.component.html',
  styleUrls: ['./shift-detail-modal.component.css']
})
export class ShiftDetailModalComponent extends AppComponentBase implements OnInit {
  @Input() roster: RosterWithShift;
  @Input() isManager: boolean = false;
  @Output() close = new EventEmitter<void>();

  showSwapRequest = false;
  targetEmployeeId: number | null = null;
  employees: any[] = [];
  loading = false;
  swapReason = '';
  proposedDate = '';
  confirmSwap = false;
  showReasonError = false;

  constructor(
    injector: Injector,
    private rosterService: RosterService,
    private employeeService: EmployeeService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    if (this.showSwapRequest) {
      this.loadEmployees();
    }
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  calculateDuration(): string {
    const start = this.parseTime(this.roster.shift.startTime);
    const end = this.parseTime(this.roster.shift.endTime);
    let diffMinutes = (end.hours * 60 + end.minutes) - (start.hours * 60 + start.minutes);

    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }

    diffMinutes -= this.roster.shift.breakMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }

  private parseTime(timeString: string): { hours: number, minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  onClose(): void {
    this.close.emit();
  }

  toggleSwapRequest(): void {
    this.showSwapRequest = !this.showSwapRequest;
    if (this.showSwapRequest && this.employees.length === 0) {
      this.loadEmployees();
    }
  }

    loadEmployees(): void {
        this.loading = true;
        this.employeeService.getAllEmployees()
            .pipe(finalize(() => this.loading = false))
            .subscribe(
                (result: EmployeeDto[]) => {   // 👈 directly array
                    this.employees = result.filter(e =>
                        e.id !== this.roster.employeeId &&
                        e.id !== this.appSession.user?.id
                    );
                },
                (error) => {
                    abp.notify.error('Failed to load employees');
                }
            );
    }

  submitSwapRequest(): void {
    this.showReasonError = false;

    if (!this.isSwapFormValid()) {
      if (!this.swapReason || this.swapReason.trim() === '') {
        this.showReasonError = true;
      }
      abp.notify.warn('Please fill in all required fields');
      return;
    }

    abp.message.confirm(
      `Are you sure you want to request a shift swap with ${this.getSelectedEmployeeName()} for ${this.roster.shift.name} on ${new Date(this.roster.rosterDate).toLocaleDateString()}?`,
      'Confirm Shift Swap Request',
      (result: boolean) => {
        if (result) {
          this.processSwapRequest();
        }
      }
    );
  }

  private processSwapRequest(): void {
    const request: ShiftSwapRequestDto = {
      requesterId: this.appSession.user?.id || this.roster.employeeId,
      targetEmployeeId: this.targetEmployeeId!,
      shiftId: this.roster.shift.id,
      rosterDate: this.roster.rosterDate,
      reason: this.swapReason,
      proposedDate: this.proposedDate || undefined
    };

    this.loading = true;
    this.rosterService.requestShiftSwap(request)
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        (result) => {
          abp.notify.success('Shift swap request submitted successfully. You will be notified once it is processed.');
          this.onClose();
        },
        (error) => {
          abp.notify.error('Failed to submit swap request');
        }
      );
  }

  isSwapFormValid(): boolean {
    return !!this.targetEmployeeId &&
           !!this.swapReason && this.swapReason.trim() !== '' &&
           this.confirmSwap;
  }

  getSelectedEmployeeName(): string {
    const employee = this.employees.find(e => e.id === this.targetEmployeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : '';
  }

  getTeamEmployees(): any[] {
    // For now, return first half of employees as "team"
    // In production, this would filter by actual department/team
    const halfLength = Math.floor(this.employees.length / 2);
    return this.employees.slice(0, halfLength);
  }

  getOtherEmployees(): any[] {
    // Return second half of employees as "other"
    // In production, this would filter by actual department/team
    const halfLength = Math.floor(this.employees.length / 2);
    return this.employees.slice(halfLength);
  }

  getMinDate(): string {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  }

  canRequestSwap(): boolean {
    return !this.isManager &&
           this.roster.employeeId === this.appSession.user?.id &&
           new Date(this.roster.rosterDate) > new Date();
  }
}
