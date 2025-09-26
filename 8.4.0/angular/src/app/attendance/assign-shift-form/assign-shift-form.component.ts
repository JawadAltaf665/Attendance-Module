import { Component, EventEmitter, Input, OnInit, Output, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { RosterService, CreateRosterDto } from '@shared/services/roster.service';
import { ShiftService, ShiftDto } from '@shared/services/shift.service';
import { EmployeeService } from '@shared/services/employee.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-assign-shift-form',
  templateUrl: './assign-shift-form.component.html',
  styleUrls: ['./assign-shift-form.component.css']
})
export class AssignShiftFormComponent extends AppComponentBase implements OnInit {
  @Input() selectedDate: Date;
  @Output() assigned = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  shifts: ShiftDto[] = [];
  employees: any[] = [];
  selectedEmployeeId: number | null = null;
  selectedShiftId: number | null = null;
  loading = false;
  loadingShifts = false;
  loadingEmployees = false;

  constructor(
    injector: Injector,
    private rosterService: RosterService,
    private shiftService: ShiftService,
    private employeeService: EmployeeService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    // Check if user has permission to assign rosters
    if (!this.canAssignShifts()) {
      abp.notify.error('You do not have permission to assign shifts');
      this.cancelled.emit();
      return;
    }

    this.loadShifts();
    this.loadEmployees();
  }

  canAssignShifts(): boolean {
    return this.permission.isGranted('Pages.Rosters.Assign') ||
           this.permission.isGranted('Pages.Administration') ||
           this.permission.isGranted('Pages.Administration.Roles') ||
           this.appSession.tenant === null;
  }

  loadShifts(): void {
    this.loadingShifts = true;
    this.shiftService.getAllShifts()
      .pipe(finalize(() => this.loadingShifts = false))
      .subscribe(
        (result: any) => {
          // Handle ABP response wrapper
          if (result && result.result) {
            this.shifts = result.result;
          } else if (Array.isArray(result)) {
            this.shifts = result;
          } else {
            this.shifts = [];
          }
          console.log('Loaded shifts:', this.shifts);
        },
        (error) => {
          console.error('Error loading shifts:', error);
          abp.notify.error('Failed to load shifts');
        }
      );
  }

  loadEmployees(): void {
    this.loadingEmployees = true;
    this.employeeService.getAllEmployees()
      .pipe(finalize(() => this.loadingEmployees = false))
      .subscribe(
        (result: any) => {
          // Handle ABP response wrapper
          let allEmployees: any[] = [];
          if (result && result.result) {
            allEmployees = result.result;
          } else if (Array.isArray(result)) {
            allEmployees = result;
          }

          // Filter out the current user (manager/admin) and show only active employees
          this.employees = allEmployees.filter(emp =>
            emp.isActive !== false &&
            emp.id !== this.appSession.user?.id
          );

          console.log('Loaded employees for assignment:', this.employees);
        },
        (error) => {
          console.error('Error loading employees:', error);
          const errorMessage = error?.error?.error?.message ||
                             error?.error?.message ||
                             'Failed to load employees. Please ensure you have proper permissions and that employee records exist.';
          abp.notify.error(errorMessage);
        }
      );
  }

  assignShift(): void {
    if (!this.selectedEmployeeId || !this.selectedShiftId || !this.selectedDate) {
      abp.notify.warn('Please select both employee and shift');
      return;
    }

    // Format date as YYYY-MM-DD in local timezone
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    console.log('Selected Date:', this.selectedDate);
    console.log('Formatted Date String:', localDateString);

    const rosterDto: CreateRosterDto = {
      employeeId: this.selectedEmployeeId,
      shiftId: this.selectedShiftId,
      rosterDate: localDateString
    };

    console.log('Sending roster DTO:', rosterDto);

    this.loading = true;
    const assignedDate = localDateString; // Store for use in callback
    this.rosterService.assignRoster(rosterDto)
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        (result: any) => {
          console.log('Shift assigned successfully:', result);
          const selectedShift = this.getSelectedShift();
          const selectedEmployee = this.getSelectedEmployee();
          abp.notify.success(
            `Shift "${selectedShift?.name}" assigned to ${selectedEmployee?.firstName} ${selectedEmployee?.lastName} for ${assignedDate}`
          );
          this.assigned.emit();
        },
        (error) => {
          console.error('Error assigning shift:', error);
          const errorMessage = error?.error?.error?.message ||
                             error?.error?.message ||
                             'Failed to assign shift';
          abp.notify.error(errorMessage);
        }
      );
  }

  cancel(): void {
    this.cancelled.emit();
  }

  getSelectedShift(): ShiftDto | null {
    return this.shifts.find(s => s.id === this.selectedShiftId) || null;
  }

  getSelectedEmployee(): any {
    return this.employees.find(e => e.id === this.selectedEmployeeId) || null;
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  calculateShiftDuration(shift: ShiftDto): string {
    if (!shift.startTime || !shift.endTime) return '';

    const start = this.parseTime(shift.startTime);
    const end = this.parseTime(shift.endTime);
    let duration = end - start;
    if (duration < 0) duration += 24 * 60; // Handle overnight shifts

    duration -= shift.breakMinutes || 0;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
