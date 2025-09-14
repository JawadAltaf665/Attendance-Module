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
    this.loadShifts();
    this.loadEmployees();
  }

  loadShifts(): void {
    this.loadingShifts = true;
    this.shiftService.getAllShifts()
      .pipe(finalize(() => this.loadingShifts = false))
      .subscribe(
        (result) => {
          this.shifts = result || [];
        },
        (error) => {
          console.error('Error loading shifts:', error);
          abp.notify.error('Failed to load shifts');
        }
      );
  }

  loadEmployees(): void {
    this.loadingEmployees = true;
    this.employeeService.getAll(1000, 0, '')
      .pipe(finalize(() => this.loadingEmployees = false))
      .subscribe(
        (result) => {
          this.employees = result.items || [];
        },
        (error) => {
          console.error('Error loading employees:', error);
          abp.notify.error('Failed to load employees');
        }
      );
  }

  assignShift(): void {
    if (!this.selectedEmployeeId || !this.selectedShiftId || !this.selectedDate) {
      abp.notify.warn('Please select both employee and shift');
      return;
    }

    const rosterDto: CreateRosterDto = {
      employeeId: this.selectedEmployeeId,
      shiftId: this.selectedShiftId,
      rosterDate: this.selectedDate.toISOString().split('T')[0]
    };

    this.loading = true;
    this.rosterService.assignRoster(rosterDto)
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        (result) => {
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