import { Component, EventEmitter, Input, OnInit, Output, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { ShiftService, ShiftDto, CreateShiftDto, UpdateShiftDto } from '@shared/services/shift.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-shift-form',
  templateUrl: './shift-form.component.html',
  styleUrls: ['./shift-form.component.css']
})
export class ShiftFormComponent extends AppComponentBase implements OnInit {
  @Input() shift: ShiftDto | null = null;
  @Input() isEditMode = false;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  formData: any = {
    name: '',
    startTime: '',
    endTime: '',
    breakMinutes: 0,
    recurrenceType: 'none',
    weeklyDays: [],
    monthlyDay: 1
  };

  loading = false;
  weekDays = [
    { code: 'MO', name: 'Monday', selected: false },
    { code: 'TU', name: 'Tuesday', selected: false },
    { code: 'WE', name: 'Wednesday', selected: false },
    { code: 'TH', name: 'Thursday', selected: false },
    { code: 'FR', name: 'Friday', selected: false },
    { code: 'SA', name: 'Saturday', selected: false },
    { code: 'SU', name: 'Sunday', selected: false }
  ];

  constructor(
    injector: Injector,
    private shiftService: ShiftService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    if (this.shift && this.isEditMode) {
      this.loadShiftData();
    }
  }

  loadShiftData(): void {
    if (!this.shift) return;

    this.formData.name = this.shift.name;
    this.formData.startTime = this.shift.startTime;
    this.formData.endTime = this.shift.endTime;
    this.formData.breakMinutes = this.shift.breakMinutes;

    // Parse recurrence rule
    if (this.shift.recurrenceRule) {
      if (this.shift.recurrenceRule.includes('FREQ=DAILY')) {
        this.formData.recurrenceType = 'daily';
      } else if (this.shift.recurrenceRule.includes('FREQ=WEEKLY')) {
        this.formData.recurrenceType = 'weekly';
        this.parseWeeklyDays(this.shift.recurrenceRule);
      } else if (this.shift.recurrenceRule.includes('FREQ=MONTHLY')) {
        this.formData.recurrenceType = 'monthly';
        this.parseMonthlyDay(this.shift.recurrenceRule);
      }
    }
  }

  parseWeeklyDays(rule: string): void {
    const match = rule.match(/BYDAY=([A-Z,]+)/);
    if (match) {
      const days = match[1].split(',');
      this.weekDays.forEach(day => {
        day.selected = days.includes(day.code);
      });
    }
  }

  parseMonthlyDay(rule: string): void {
    const match = rule.match(/BYMONTHDAY=(\d+)/);
    if (match) {
      this.formData.monthlyDay = parseInt(match[1]);
    }
  }

  save(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;

    const shiftData = this.prepareShiftData();
    console.log('Saving shift data:', shiftData);

    if (this.isEditMode && this.shift) {
      this.shiftService.updateShift(this.shift.id, shiftData as UpdateShiftDto)
        .pipe(finalize(() => this.loading = false))
        .subscribe(
          (response) => {
            console.log('Shift updated successfully:', response);
            this.saved.emit();
          },
          error => {
            console.error('Failed to update shift:', error);
            const errorMessage = error?.error?.error?.message ||
                               error?.error?.message ||
                               'Failed to update shift';
            abp.notify.error(errorMessage);
          }
        );
    } else {
      this.shiftService.createShift(shiftData as CreateShiftDto)
        .pipe(finalize(() => this.loading = false))
        .subscribe(
          (response) => {
            console.log('Shift created successfully:', response);
            this.saved.emit();
          },
          error => {
            console.error('Failed to create shift:', error);
            const errorMessage = error?.error?.error?.message ||
                               error?.error?.message ||
                               'Failed to create shift';
            abp.notify.error(errorMessage);
          }
        );
    }
  }

  prepareShiftData(): CreateShiftDto | UpdateShiftDto {
    // Ensure time is in HH:mm:ss format for TimeSpan
    const startTime = this.formData.startTime.length === 5 ? `${this.formData.startTime}:00` : this.formData.startTime;
    const endTime = this.formData.endTime.length === 5 ? `${this.formData.endTime}:00` : this.formData.endTime;

    const data: any = {
      name: this.formData.name,
      startTime: startTime,
      endTime: endTime,
      breakMinutes: this.formData.breakMinutes,
      recurrenceRule: this.buildRecurrenceRule()
    };

    return data;
  }

  buildRecurrenceRule(): string {
    switch (this.formData.recurrenceType) {
      case 'daily':
        return 'FREQ=DAILY';
      case 'weekly':
        const selectedDays = this.weekDays
          .filter(d => d.selected)
          .map(d => d.code)
          .join(',');
        return selectedDays ? `FREQ=WEEKLY;BYDAY=${selectedDays}` : '';
      case 'monthly':
        return `FREQ=MONTHLY;BYMONTHDAY=${this.formData.monthlyDay}`;
      default:
        return '';
    }
  }

  validateForm(): boolean {
    if (!this.formData.name) {
      abp.notify.error('Shift name is required');
      return false;
    }

    if (!this.formData.startTime) {
      abp.notify.error('Start time is required');
      return false;
    }

    if (!this.formData.endTime) {
      abp.notify.error('End time is required');
      return false;
    }

    if (this.formData.recurrenceType === 'weekly') {
      const hasSelectedDays = this.weekDays.some(d => d.selected);
      if (!hasSelectedDays) {
        abp.notify.error('Please select at least one day for weekly recurrence');
        return false;
      }
    }

    return true;
  }

  cancel(): void {
    this.cancelled.emit();
  }

  toggleWeekDay(day: any): void {
    day.selected = !day.selected;
  }

  getShiftDuration(): string {
    if (!this.formData.startTime || !this.formData.endTime) {
      return '';
    }

    const start = this.parseTime(this.formData.startTime);
    const end = this.parseTime(this.formData.endTime);

    let duration = end - start;
    if (duration < 0) duration += 24 * 60; // Handle overnight shifts

    duration -= this.formData.breakMinutes;

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return minutes > 0 ? `${hours} hours ${minutes} minutes` : `${hours} hours`;
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}