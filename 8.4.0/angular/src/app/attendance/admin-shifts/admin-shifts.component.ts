import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { ShiftService, ShiftDto } from '@shared/services/shift.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-shifts',
  templateUrl: './admin-shifts.component.html',
  styleUrls: ['./admin-shifts.component.css']
})
export class AdminShiftsComponent extends AppComponentBase implements OnInit {
  shifts: ShiftDto[] = [];
  loading = false;
  selectedShift: ShiftDto | null = null;
  showShiftForm = false;
  isEditMode = false;
  keyword = '';

  // For pagination
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;

  constructor(
    injector: Injector,
    private shiftService: ShiftService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadShifts();
  }

  loadShifts(): void {
    this.loading = true;
    const skipCount = (this.currentPage - 1) * this.pageSize;

    console.log('Loading shifts with params:', { keyword: this.keyword, skipCount, pageSize: this.pageSize });

    this.shiftService.getPagedShifts(this.keyword, skipCount, this.pageSize)
      .pipe(finalize(() => this.loading = false))
      .subscribe(
        response => {
          console.log('Shift API Response:', response);
          // Handle ABP response wrapper format
          const result = response.result || response;
          this.shifts = result.items || [];
          this.totalCount = result.totalCount || 0;
          console.log('Shifts loaded:', this.shifts);
          console.log('Total count:', this.totalCount);
        },
        error => {
          console.error('Failed to load shifts:', error);
          abp.notify.error('Failed to load shifts');
        }
      );
  }

  searchShifts(): void {
    this.currentPage = 1;
    this.loadShifts();
  }

  createShift(): void {
    this.selectedShift = null;
    this.isEditMode = false;
    this.showShiftForm = true;
  }

  editShift(shift: ShiftDto): void {
    this.selectedShift = shift;
    this.isEditMode = true;
    this.showShiftForm = true;
  }

  deleteShift(shift: ShiftDto): void {
    abp.message.confirm(
      `Are you sure you want to delete the shift "${shift.name}"? This action cannot be undone.`,
      'Delete Shift',
      (result: boolean) => {
        if (result) {
          this.loading = true;
          this.shiftService.deleteShift(shift.id)
            .pipe(finalize(() => this.loading = false))
            .subscribe(
              (response) => {
                abp.notify.success('Shift deleted successfully');
                this.loadShifts();
              },
              error => {
                console.error('Failed to delete shift:', error);
                // Handle ABP error response format
                const errorMessage = error?.error?.error?.message ||
                                   error?.error?.message ||
                                   'Failed to delete shift. The shift may be assigned to rosters.';
                abp.notify.error(errorMessage);
              }
            );
        }
      }
    );
  }

  onShiftSaved(): void {
    this.showShiftForm = false;
    this.selectedShift = null;
    this.loadShifts();
    abp.notify.success(this.isEditMode ? 'Shift updated successfully' : 'Shift created successfully');
  }

  onFormCancelled(): void {
    this.showShiftForm = false;
    this.selectedShift = null;
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatRecurrence(rule: string): string {
    return this.shiftService.formatRecurrenceRule(rule);
  }

  getShiftDuration(startTime: string, endTime: string, breakMinutes: number): string {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    let duration = end - start;
    if (duration < 0) duration += 24 * 60; // Handle overnight shifts

    duration -= breakMinutes;

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadShifts();
    }
  }

  nextPage(): void {
    const maxPage = Math.ceil(this.totalCount / this.pageSize);
    if (this.currentPage < maxPage) {
      this.currentPage++;
      this.loadShifts();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }
}