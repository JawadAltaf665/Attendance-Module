import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { AttendanceApiService } from '../../services/attendance-api.service';
import { EmployeeSessionService } from '../../services/employee-session.service';
import { AppSessionService } from '@shared/session/app-session.service';
import { Employee, LeaveBalanceDto } from '../../models/index';

@Component({
    selector: 'app-leave-request',
    templateUrl: './leave-request.component.html'
})
export class LeaveRequestComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    leaveForm: FormGroup;
    isLoading = false;
    isSubmitting = false;

    // Employee data
    currentEmployee: Employee | null = null;
    leaveBalances: LeaveBalanceDto[] = [];

    // Leave types
    leaveTypes = [
        { value: 'VACATION', label: 'Vacation', icon: 'fa-umbrella-beach' },
        { value: 'SICK', label: 'Sick Leave', icon: 'fa-briefcase-medical' },
        { value: 'PERSONAL', label: 'Personal', icon: 'fa-home' },
        { value: 'UNPAID', label: 'Unpaid', icon: 'fa-clock' }
    ];

    // Calculated fields
    selectedLeaveBalance: LeaveBalanceDto | null = null;
    requestedDays = 0;
    insufficientBalance = false;

    // File upload
    attachmentFile: File | null = null;
    attachmentUrl: string | null = null;
    uploadProgress = 0;

    // Date constraints
    minDate = new Date();
    maxDate = new Date();

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private attendanceService: AttendanceApiService,
        private employeeSession: EmployeeSessionService,
        private appSession: AppSessionService
    ) {
        // Set min date to today
        this.minDate = new Date();
        this.minDate.setHours(0, 0, 0, 0);

        // Set max date to 1 year from now
        this.maxDate = new Date();
        this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);

        this.leaveForm = this.fb.group({
            leaveType: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            halfDay: [false],
            reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
            approverId: [null],
            attachmentUrl: ['']
        }, {
            validators: [this.dateRangeValidator, this.balanceValidator.bind(this)]
        });
    }

    ngOnInit(): void {
        this.loadEmployeeData();
        this.loadLeaveBalances();
        this.setupFormListeners();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadEmployeeData(): void {
        this.isLoading = true;
        this.employeeSession.getCurrentEmployee()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (employee) => {
                    if (employee) {
                        this.currentEmployee = employee;
                        // Set default approver if available
                        if (employee.managerId) {
                            this.leaveForm.patchValue({ approverId: employee.managerId });
                        }

                        console.log('Employee loaded for leave request:', {
                            employeeId: employee.id,
                            userId: this.appSession.userId,
                            employeeName: `${employee.firstName} ${employee.lastName}`
                        });
                    } else {
                        console.error('No employee record found for leave request');
                        abp.message.error('Failed to load employee information');
                    }
                },
                error: (error) => {
                    console.error('Failed to load employee data:', error);
                    abp.message.error('Failed to load employee information');
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
                    this.updateSelectedBalance();
                },
                error: (error) => {
                    console.error('Failed to load leave balances:', error);
                    // Continue without balances
                    this.leaveBalances = [];
                }
            });
    }

    private setupFormListeners(): void {
        // Listen to leave type changes
        this.leaveForm.get('leaveType')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.updateSelectedBalance();
                this.calculateRequestedDays();
            });

        // Listen to date changes
        this.leaveForm.get('startDate')?.valueChanges
            .pipe(
                debounceTime(300),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.calculateRequestedDays();
                this.validateDates();
            });

        this.leaveForm.get('endDate')?.valueChanges
            .pipe(
                debounceTime(300),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.calculateRequestedDays();
                this.validateDates();
            });

        // Listen to half day toggle
        this.leaveForm.get('halfDay')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((halfDay) => {
                if (halfDay) {
                    // Set end date same as start date for half day
                    const startDate = this.leaveForm.get('startDate')?.value;
                    if (startDate) {
                        this.leaveForm.patchValue({ endDate: startDate });
                    }
                }
                this.calculateRequestedDays();
            });
    }

    private updateSelectedBalance(): void {
        const leaveType = this.leaveForm.get('leaveType')?.value;
        if (leaveType && this.leaveBalances.length > 0) {
            this.selectedLeaveBalance = this.leaveBalances.find(b => b.leaveType === leaveType) || null;
        } else {
            this.selectedLeaveBalance = null;
        }
        this.checkBalance();
    }

    private calculateRequestedDays(): void {
        const startDate = this.leaveForm.get('startDate')?.value;
        const endDate = this.leaveForm.get('endDate')?.value;
        const halfDay = this.leaveForm.get('halfDay')?.value;

        if (!startDate || !endDate) {
            this.requestedDays = 0;
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (halfDay) {
            this.requestedDays = 0.5;
        } else {
            // Calculate business days between dates
            let days = 0;
            const current = new Date(start);

            while (current <= end) {
                const dayOfWeek = current.getDay();
                // Skip weekends (0 = Sunday, 6 = Saturday)
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    days++;
                }
                current.setDate(current.getDate() + 1);
            }

            this.requestedDays = days;
        }

        this.checkBalance();
    }

    private checkBalance(): void {
        if (!this.selectedLeaveBalance) {
            this.insufficientBalance = false;
            return;
        }

        const leaveType = this.leaveForm.get('leaveType')?.value;

        // Unpaid leave has no balance restriction
        if (leaveType === 'UNPAID') {
            this.insufficientBalance = false;
            return;
        }

        this.insufficientBalance = this.requestedDays > this.selectedLeaveBalance.availableDays;
    }

    private validateDates(): void {
        const startDate = this.leaveForm.get('startDate')?.value;
        const endDate = this.leaveForm.get('endDate')?.value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (end < start) {
                this.leaveForm.get('endDate')?.setErrors({ invalidRange: true });
            } else {
                // Clear the error if it exists
                const errors = this.leaveForm.get('endDate')?.errors;
                if (errors?.['invalidRange']) {
                    delete errors['invalidRange'];
                    if (Object.keys(errors).length === 0) {
                        this.leaveForm.get('endDate')?.setErrors(null);
                    } else {
                        this.leaveForm.get('endDate')?.setErrors(errors);
                    }
                }
            }
        }
    }

    // Validators
    private dateRangeValidator(control: AbstractControl): { [key: string]: any } | null {
        const startDate = control.get('startDate')?.value;
        const endDate = control.get('endDate')?.value;
        const halfDay = control.get('halfDay')?.value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (end < start) {
                return { dateRange: 'End date must be after or equal to start date' };
            }

            if (halfDay && start.getTime() !== end.getTime()) {
                return { halfDayRange: 'For half day leave, start and end date must be the same' };
            }
        }

        return null;
    }

    private balanceValidator(control: AbstractControl): { [key: string]: any } | null {
        // Skip validation during form initialization
        if (!this.leaveBalances || this.leaveBalances.length === 0) {
            return null;
        }

        const leaveType = control.get('leaveType')?.value;

        // Skip balance check for unpaid leave
        if (leaveType === 'UNPAID') {
            return null;
        }

        if (this.insufficientBalance) {
            return { insufficientBalance: `You have only ${this.selectedLeaveBalance?.availableDays || 0} days available` };
        }

        return null;
    }

    // File upload
    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                abp.message.error('File size must be less than 5MB');
                return;
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword',
                                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                abp.message.error('Please upload a valid document (JPG, PNG, PDF, DOC, DOCX)');
                return;
            }

            this.attachmentFile = file;
            this.uploadFile();
        }
    }

    private uploadFile(): void {
        if (!this.attachmentFile) return;

        // Mock file upload - in production, this would upload to server
        this.uploadProgress = 0;
        const interval = setInterval(() => {
            this.uploadProgress += 20;
            if (this.uploadProgress >= 100) {
                clearInterval(interval);
                // Mock URL - in production, this would be the actual uploaded file URL
                this.attachmentUrl = `https://storage.example.com/leaves/${Date.now()}_${this.attachmentFile?.name}`;
                this.leaveForm.patchValue({ attachmentUrl: this.attachmentUrl });
                abp.notify.success('File uploaded successfully');
            }
        }, 200);
    }

    removeAttachment(): void {
        this.attachmentFile = null;
        this.attachmentUrl = null;
        this.uploadProgress = 0;
        this.leaveForm.patchValue({ attachmentUrl: '' });
    }

    // Form submission
    onSubmit(): void {
        if (this.leaveForm.invalid) {
            this.markFormGroupTouched(this.leaveForm);
            abp.message.warn('Please fill all required fields correctly');
            return;
        }

        if (this.insufficientBalance) {
            abp.message.error('Insufficient leave balance for this request');
            return;
        }

        this.isSubmitting = true;

        const formValue = this.leaveForm.value;
        const leaveRequest = {
            leaveType: formValue.leaveType,
            startDate: new Date(formValue.startDate).toISOString(),
            endDate: new Date(formValue.endDate).toISOString(),
            halfDay: formValue.halfDay,
            reason: formValue.reason,
            attachmentUrl: formValue.attachmentUrl || null,
            approverId: formValue.approverId || null
        };

        this.attendanceService.requestLeave(leaveRequest)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    abp.notify.success('Leave request submitted successfully');
                    this.router.navigate(['/app/attendance/leave-list']);
                },
                error: (error) => {
                    console.error('Failed to submit leave request:', error);
                    abp.message.error(error || 'Failed to submit leave request');
                    this.isSubmitting = false;
                },
                complete: () => {
                    this.isSubmitting = false;
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/attendance/leave-list']);
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }

    // Helper methods
    getLeaveTypeIcon(leaveType: string): string {
        const type = this.leaveTypes.find(t => t.value === leaveType);
        return type ? type.icon : 'fa-calendar';
    }

    getBalanceColor(balance: LeaveBalanceDto): string {
        const percentage = (balance.availableDays / balance.totalAllocation) * 100;
        if (percentage > 50) return 'success';
        if (percentage > 25) return 'warning';
        return 'danger';
    }

    formatDays(days: number): string {
        return days === 1 ? '1 day' : `${days} days`;
    }
}