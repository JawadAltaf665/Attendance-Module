import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { interval, Subject, timer } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { AppSessionService } from '@shared/session/app-session.service';
import { PermissionCheckerService } from 'abp-ng2-module';
import { AttendanceApiService } from '../../services/attendance-api.service';
import { EmployeeSessionService } from '../../services/employee-session.service';
import {
    AttendanceEvent,
    AttendanceEventType,
    AttendanceSource,
    ClockEventDto,
    TodaySummaryDto,
    WeeklySummaryDto,
    TodayScheduleDto,
    AttendancePermissions,
    Employee
} from '../../models/index';

@Component({
    selector: 'app-clock-in-out',
    templateUrl: './clock-in-out.component.html'
})
export class ClockInOutComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // Current time
    currentTime = new Date();
    currentDate = new Date();

    // Employee state
    currentEmployee: Employee | null = null;
    employeeId: number = 0;
    employeeName: string = '';

    // Clock state
    isClockedIn = false;
    isLoading = false;
    clockInTime: Date | null = null;
    sessionDuration = '00:00:00';

    // Forms
    clockForm: FormGroup;

    // Today's data
    todayEvents: AttendanceEvent[] = [];
    todaySchedule: TodayScheduleDto | null = null;
    todaySummary: TodaySummaryDto = {
        totalHours: 0,
        overtime: 0,
        isCurrentlyClockedIn: false
    };
    weeklySummary: WeeklySummaryDto | null = null;
    
    // Location
    locationEnabled = false;
    currentLocation: { latitude?: number; longitude?: number } = {};
    
    // UI State
    showNotesField = false;
    showLocationWarning = false;
    autoRefreshEnabled = true;
    
    // Constants
    readonly permissions = AttendancePermissions;
    readonly eventTypes = AttendanceEventType;
    readonly sources = AttendanceSource;
    
    constructor(
        private fb: FormBuilder,
        private attendanceService: AttendanceApiService,
        private employeeSession: EmployeeSessionService,
        private appSession: AppSessionService,
        private permissionChecker: PermissionCheckerService
    ) {
        this.clockForm = this.fb.group({
            notes: ['', [Validators.maxLength(500)]],
            includeLocation: [true]
        });
    }
    
    ngOnInit(): void {
        this.initializeClock();
        this.checkLocationPermission();
        this.loadCurrentEmployee();
        this.setupAutoRefresh();
    }
    
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
    
    private initializeClock(): void {
        interval(1000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.currentTime = new Date();
            });
    }
    
    private checkLocationPermission(): void {
        if ('geolocation' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then(result => {
                this.locationEnabled = result.state === 'granted';
                if (this.locationEnabled) {
                    this.updateLocation();
                }
            });
        }
    }
    
    private updateLocation(): void {
        if (navigator.geolocation && this.clockForm.get('includeLocation')?.value) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    this.showLocationWarning = false;
                },
                error => {
                    console.warn('Location error:', error);
                    this.showLocationWarning = true;
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }
    
    private loadCurrentEmployee(): void {
        this.isLoading = true;

        // Use the employee session service to get current employee
        this.employeeSession.getCurrentEmployee()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (employee) => {
                    if (employee) {
                        this.currentEmployee = employee;
                        this.employeeId = employee.id;
                        this.employeeName = `${employee.firstName} ${employee.lastName}`.trim() || employee.employeeNumber;

                        console.log('Employee loaded:', {
                            employeeId: this.employeeId,
                            userId: this.appSession.userId,
                            employeeName: this.employeeName
                        });

                        this.loadInitialData();
                    } else {
                        console.error('No employee record found for user ID:', this.appSession.userId);
                        abp.message.error('No employee record found. Please contact administrator.');
                        this.isLoading = false;
                    }
                },
                error: (error) => {
                    console.error('Failed to load employee data:', error);
                    abp.message.error('Failed to load employee information. Please contact administrator.');
                    this.isLoading = false;
                }
            });
    }

    private loadInitialData(): void {
        this.loadTodayEvents();
        this.loadTodaySchedule();
        this.loadTodaySummary();
        this.loadWeeklySummary();
    }
    
    private setupAutoRefresh(): void {
        // Refresh data every 5 minutes
        interval(5 * 60 * 1000)
            .pipe(
                takeUntil(this.destroy$),
                switchMap(() => this.autoRefreshEnabled ? timer(0) : [])
            )
            .subscribe(() => {
                this.loadTodayEvents();
                this.loadTodaySummary();
            });
    }
    
    loadTodayEvents(): void {
        this.attendanceService.getMyTodayAttendance()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: events => {
                    this.todayEvents = events.sort((a, b) =>
                        new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
                    );
                    this.updateClockState();
                    this.isLoading = false;
                },
                error: error => {
                    console.error('Failed to load today events:', error);
                    this.isLoading = false;
                }
            });
    }
    
    loadTodaySchedule(): void {
        debugger;
        // Skip if employeeId not yet loaded
        if (!this.employeeId) return;

        this.attendanceService.getTodaySchedule(this.employeeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: schedule => {
                    this.todaySchedule = schedule;
                    console.warn('Today schedule loaded:', schedule);
                },
                error: error => {
                    console.error('Failed to load schedule:', error);
                }
            });
    }

    loadTodaySummary(): void {
        debugger;
        // Skip if employeeId not yet loaded
        if (!this.employeeId) return;

        this.attendanceService.getTodaySummary(this.employeeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: summary => {
                    this.todaySummary = summary;
                    console.warn('Today summary loaded:', summary);
                    this.updateSessionTimer();
                },
                error: error => {
                    console.error('Failed to load today summary:', error);
                }
            });
    }

    loadWeeklySummary(): void {
        debugger;
        // Skip if employeeId not yet loaded
        if (!this.employeeId) return;

        this.attendanceService.getWeeklySummary(this.employeeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: summary => {
                    this.weeklySummary = summary;
                    console.warn('Weekly summary loaded:', summary);
                },
                error: error => {
                    console.error('Failed to load weekly summary:', error);
                }
            });
    }
    
    private updateClockState(): void {
        const lastEvent = this.todayEvents[0];
        if (lastEvent) {
            this.isClockedIn = lastEvent.eventType === AttendanceEventType.CLOCK_IN;
            if (this.isClockedIn) {
                this.clockInTime = new Date(lastEvent.eventTime);
                this.updateSessionTimer();
            } else {
                this.clockInTime = null;
                this.sessionDuration = '00:00:00';
            }
        } else {
            this.isClockedIn = false;
            this.clockInTime = null;
            this.sessionDuration = '00:00:00';
        }
    }
    
    private updateSessionTimer(): void {
        if (this.clockInTime) {
            const now = new Date();
            const diff = now.getTime() - this.clockInTime.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            this.sessionDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    clockIn(): void {
        if (!this.canClockIn()) {
            abp.message.warn('You cannot clock in at this time');
            return;
        }

        this.isLoading = true;

        if (this.clockForm.get('includeLocation')?.value) {
            this.updateLocation();
        }

        // Use the new clockInForCurrentUser method that doesn't require employeeId
        this.attendanceService.clockInForCurrentUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: result => {
                    this.isClockedIn = true;
                    this.clockInTime = new Date();
                    this.clockForm.patchValue({ notes: '' });
                    this.showNotesField = false;
                    this.loadTodayEvents();
                    this.loadTodaySummary();

                    const locationText = this.currentLocation.latitude ? ' with location' : '';
                    abp.notify.success(`Successfully clocked in at ${this.formatTime(new Date())}${locationText}`);
                },
                error: error => {
                    console.error('Clock in failed:', error);
                    abp.message.error('Failed to clock in. Please try again.');
                },
                complete: () => {
                    this.isLoading = false;
                }
            });
    }
    
    clockOut(): void {
        if (!this.canClockOut()) {
            abp.message.warn('You cannot clock out at this time');
            return;
        }
        
        abp.message.confirm(
            'Are you sure you want to clock out?',
            'Confirm Clock Out',
            (result: boolean) => {
                if (result) {
                    this.performClockOut();
                }
            }
        );
    }
    
    private performClockOut(): void {
        this.isLoading = true;

        if (this.clockForm.get('includeLocation')?.value) {
            this.updateLocation();
        }

        // Use the new clockOutForCurrentUser method that doesn't require employeeId
        this.attendanceService.clockOutForCurrentUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: result => {
                    this.isClockedIn = false;
                    this.clockInTime = null;
                    this.sessionDuration = '00:00:00';
                    this.clockForm.patchValue({ notes: '' });
                    this.showNotesField = false;
                    this.loadTodayEvents();
                    this.loadTodaySummary();
                    this.loadWeeklySummary();

                    abp.notify.success(`Successfully clocked out at ${this.formatTime(new Date())}`);
                },
                error: error => {
                    console.error('Clock out failed:', error);
                    abp.message.error('Failed to clock out. Please try again.');
                },
                complete: () => {
                    this.isLoading = false;
                }
            });
    }
    
    canClockIn(): boolean {
        return !this.isClockedIn && !this.isLoading &&
               this.permissionChecker.isGranted(this.permissions.AttendanceClockInOut);
    }
    
    canClockOut(): boolean {
        return this.isClockedIn && !this.isLoading &&
               this.permissionChecker.isGranted(this.permissions.AttendanceClockInOut);
    }
    
    toggleNotesField(): void {
        this.showNotesField = !this.showNotesField;
        if (!this.showNotesField) {
            this.clockForm.patchValue({ notes: '' });
        }
    }
    
    requestLocationPermission(): void {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    this.locationEnabled = true;
                    this.showLocationWarning = false;
                    this.updateLocation();
                    abp.notify.success('Location access granted');
                },
                () => {
                    this.locationEnabled = false;
                    this.showLocationWarning = true;
                    abp.message.warn('Location access denied. Clock events will be recorded without location.');
                }
            );
        } else {
            abp.message.warn('Geolocation is not supported by your browser');
        }
    }
    
    formatTime(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    formatDate(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    getEventIcon(eventType: string): string {
        switch (eventType) {
            case AttendanceEventType.CLOCK_IN:
                return 'fa-sign-in-alt';
            case AttendanceEventType.CLOCK_OUT:
                return 'fa-sign-out-alt';
            default:
                return 'fa-clock';
        }
    }
    
    getEventColor(eventType: string): string {
        switch (eventType) {
            case AttendanceEventType.CLOCK_IN:
                return 'success';
            case AttendanceEventType.CLOCK_OUT:
                return 'danger';
            default:
                return 'info';
        }
    }
    
    getScheduleStatusClass(): string {
        if (!this.todaySchedule) return 'text-muted';
        
        switch (this.todaySchedule.scheduleType) {
            case 'shift':
                return this.isClockedIn ? 'text-success' : 'text-warning';
            case 'leave':
                return 'text-info';
            default:
                return 'text-muted';
        }
    }
    
    getProgressPercentage(): number {
        if (!this.weeklySummary) return 0;
        return Math.min(100, Math.round((this.weeklySummary.hoursWorked / this.weeklySummary.target) * 100));
    }
    
    getOvertimeClass(): string {
        if (!this.todaySummary || this.todaySummary.overtime <= 0) return 'text-muted';
        if (this.todaySummary.overtime < 2) return 'text-warning';
        return 'text-danger';
    }
}
