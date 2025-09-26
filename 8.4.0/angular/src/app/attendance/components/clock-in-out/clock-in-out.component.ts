import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppSessionService } from '@shared/session/app-session.service';
import { PermissionCheckerService } from 'abp-ng2-module';
import { AttendanceApiService } from '../../services/attendance-api.service';
import { EmployeeSessionService } from '../../services/employee-session.service';
import { RosterService, RosterWithShift } from '@shared/services/roster.service';
import {
    AttendanceEvent,
    AttendanceEventType,
    AttendanceSource,
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

    // Employee state
    currentEmployee: Employee | null = null;
    employeeId = 0;
    employeeName = '';

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

    // Constants
    readonly permissions = AttendancePermissions;
    readonly eventTypes = AttendanceEventType;
    readonly sources = AttendanceSource;

    // Office Timing Configuration
    readonly officeConfig = {
        startTime: { hour: 12, minute: 0 }, // 12:00 PM
        endTime: { hour: 21, minute: 0 },   // 9:00 PM
        graceStartTime: { hour: 11, minute: 0 }, // 11:00 AM (start of allowed period)
        graceEndTime: { hour: 16, minute: 0 },   // 3:00 PM (end of allowed period)
        autoClockOutTime: { hour: 22, minute: 0 }, // 4:00 PM (1 hour after end time)
        hrContact: 'HR Department: hr@company.com | Manager: manager@company.com'
    };

    // Timing validation state
    isWithinGracePeriod = false;
    isLateClockIn = false;
    shouldShowHRWarning = false;
    timeUntilAutoClockOut = '';
    autoClockOutTimer: any;

    // Upcoming roster data
    upcomingRoster: any[] = [];

    constructor(
        private fb: FormBuilder,
        private attendanceService: AttendanceApiService,
        private employeeSession: EmployeeSessionService,
        private appSession: AppSessionService,
        private permissionChecker: PermissionCheckerService,
        private rosterService: RosterService
    ) {
        this.clockForm = this.fb.group({
            notes: ['', [Validators.maxLength(500)]],
            includeLocation: [true]
        });
    }

    ngOnInit(): void {
        this.startClockTicker();
        this.checkLocationPermission();
        this.loadCurrentEmployee();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.autoClockOutTimer) {
            clearTimeout(this.autoClockOutTimer);
        }
    }

    private startClockTicker(): void {
        interval(1000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.currentTime = new Date();
                this.updateSessionTimer();
                this.checkOfficeTimings();
                this.updateAutoClockOutTimer();
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
                () => {
                    this.showLocationWarning = true;
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }

    private loadCurrentEmployee(): void {
        this.isLoading = true;

        this.employeeSession.getCurrentEmployee()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (employee) => {
                    if (employee) {
                        this.currentEmployee = employee;
                        this.employeeId = employee.id;
                        this.employeeName = `${employee.firstName} ${employee.lastName}`.trim() || employee.employeeNumber;
                        console.log('Loaded employee for clock-in/out:', {
                            employeeId: this.employeeId,
                            employeeName: this.employeeName,
                            employee: employee
                        });
                        this.loadInitialData();
                    } else {
                        abp.message.error('No employee record found. Please contact administrator.');
                        this.isLoading = false;
                    }
                },
                error: () => {
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
        this.loadUpcomingRoster();
        this.checkOfficeTimings();
        this.setupAutoClockOut();
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
                    
                    // Log for debugging
                    console.log('Today\'s events loaded:', this.todayEvents);
                    console.log('Has clocked in today:', this.hasAlreadyClockedInToday());
                    console.log('Has clocked out today:', this.hasAlreadyClockedOutToday());
                    
                    // Setup auto clock-out if clocked in
                    if (this.isClockedIn && !this.hasAlreadyClockedOutToday()) {
                        this.setupAutoClockOut();
                    }
                },
                error: (error) => {
                    console.error('Error loading today\'s events:', error);
                    this.isLoading = false;
                }
            });
    }

    loadTodaySchedule(): void {
        if (!this.employeeId) return;

        this.attendanceService.getTodaySchedule(this.employeeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: schedule => (this.todaySchedule = schedule)
            });
    }

    loadTodaySummary(): void {
        if (!this.employeeId) return;

        this.attendanceService.getTodaySummary(this.employeeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: summary => (this.todaySummary = summary)
            });
    }

    loadWeeklySummary(): void {
        if (!this.employeeId) return;

        this.attendanceService.getWeeklySummary(this.employeeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: summary => (this.weeklySummary = summary)
            });
    }

    loadUpcomingRoster(): void {
        if (!this.employeeId) return;

        // Get upcoming 7 days roster data
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1); // Start from tomorrow
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7); // Next 7 days

        // Try getMyRoster first, then fallback to getRoster with specific employeeId for admin users
        this.rosterService.getMyRoster(startDate, endDate)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result: any) => {
                    console.log('Roster API response:', result);

                    // result.result is already an array
                    const rosterItems = Array.isArray(result.result) ? result.result : [];

                    console.log('Extracted rosterItems:', rosterItems);

                    // take only 2
                    this.processRosterResult(rosterItems.slice(0, 2));
                },
                error: (error) => {
                    console.error('getMyRoster failed, trying getRoster with employeeId:', error);

                    this.rosterService.getRoster(this.employeeId, startDate, endDate)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (result: any) => {
                                console.log('Roster API response:', result);

                                // result.result is already an array
                                const rosterItems = Array.isArray(result.result) ? result.result : [];

                                console.log('Extracted rosterItems:', rosterItems);

                                // take only 2
                                this.processRosterResult(rosterItems.slice(0, 2));
                            },
                            error: (fallbackError) => {
                                console.error('Both roster methods failed:', fallbackError);
                                this.upcomingRoster = [];
                            }
                        });
                }
            });
    }

    private processRosterResult(result: any): void {
        let rosters: RosterWithShift[] = [];
        
        // Handle ABP response wrapper
        if (result && result.result) {
            rosters = result.result;
        } else if (Array.isArray(result)) {
            rosters = result;
        } else if (result && result.items && Array.isArray(result.items)) {
            rosters = result.items;
        }

        // Filter rosters for current employee (important for admin users using getRoster)
        if (this.employeeId) {
            rosters = rosters.filter(roster => roster.employeeId === this.employeeId);
        }

        // Transform roster data to match UI expectations
        this.upcomingRoster = rosters.map(roster => ({
            date: new Date(roster.rosterDate),
            shiftName: roster.shift.name,
            startTime: this.formatTimeString(roster.shift.startTime),
            endTime: this.formatTimeString(roster.shift.endTime)
        }));

        console.log('Loaded upcoming roster for employee', this.employeeId, ':', this.upcomingRoster);
    }

    private updateClockState(): void {
        const lastEvent = this.todayEvents[0];
        if (lastEvent) {
            this.isClockedIn = lastEvent.eventType === AttendanceEventType.CLOCK_IN;
            this.clockInTime = this.isClockedIn ? new Date(lastEvent.eventTime) : null;
        } else {
            this.isClockedIn = false;
            this.clockInTime = null;
        }
        if (!this.isClockedIn) this.sessionDuration = '00:00:00';
    }

    private updateSessionTimer(): void {
        if (this.clockInTime) {
            const diff = Date.now() - this.clockInTime.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            this.sessionDuration = `${hours.toString().padStart(2, '0')}:${minutes
                .toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    clockIn(): void {
        // Enhanced validation with specific warning messages
        if (this.hasAlreadyClockedInToday()) {
            abp.message.warn(
                'You have already clocked in today. You can only clock in once per day. Come back tomorrow to clock in again.',
                'Already Clocked In'
            );
            return;
        }

        // Check office timing validation
        if (!this.isWithinOfficeHours() && !this.isWithinGracePeriod) {
            abp.message.warn(
                `Clock-in is only allowed between ${this.formatOfficeTime(this.officeConfig.graceStartTime)} and ${this.formatOfficeTime(this.officeConfig.graceEndTime)}. Please contact HR for assistance.`,
                'Outside Office Hours'
            );
            return;
        }

        // Show late warning if clocking in after official start time
        if (this.isLateClockIn) {
            abp.message.confirm(
                `You are clocking in after the official start time (${this.formatOfficeTime(this.officeConfig.startTime)}). This will be marked as late arrival. Do you want to continue?`,
                'Late Clock-In Warning',
                (result: boolean) => {
                    if (result) {
                        this.performClockIn();
                    }
                }
            );
            return;
        }

        if (!this.canClockIn()) {
            abp.message.warn('You cannot clock in at this time');
            return;
        }

        this.performClockIn();
    }

    private performClockIn(): void {
        this.isLoading = true;

        if (this.clockForm.get('includeLocation')?.value) {
            this.updateLocation();
        }

        this.attendanceService.clockInForCurrentUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.isClockedIn = true;
                    this.clockInTime = new Date();
                    this.clockForm.patchValue({ notes: '' });
                    this.showNotesField = false;
                    this.loadTodayEvents();
                    this.loadTodaySummary();
                    this.setupAutoClockOut();
                    
                    if (this.isLateClockIn) {
                        abp.message.info(
                            `Successfully clocked in! Note: You are late. Please contact ${this.officeConfig.hrContact} if needed.`,
                            'Clock In - Late Arrival'
                        );
                    } else {
                        abp.message.success('Successfully clocked in!', 'Clock In');
                    }
                },
                error: (error) => {
                    console.error('Clock in error:', error);
                    if (error.includes('already clocked in') || error.includes('duplicate')) {
                        abp.message.warn(
                            'You have already clocked in today. Please try again tomorrow.',
                            'Already Clocked In'
                        );
                    } else {
                        abp.message.error('Failed to clock in. Please try again.', 'Clock In Failed');
                    }
                    this.loadTodayEvents(); // Refresh to get current state
                },
                complete: () => (this.isLoading = false)
            });
    }

    clockOut(): void {
        // Enhanced validation with specific warning messages
        if (this.hasAlreadyClockedOutToday()) {
            abp.message.warn(
                'You have already clocked out today. You can only clock out once per day. Come back tomorrow to clock in again.',
                'Already Clocked Out'
            );
            return;
        }

        if (!this.canClockOut()) {
            abp.message.warn('You cannot clock out at this time. Make sure you are clocked in first.');
            return;
        }

        abp.message.confirm(
            'Are you sure you want to clock out?',
            'Confirm Clock Out',
            (result: boolean) => result && this.performClockOut()
        );
    }

    private performClockOut(): void {
        this.isLoading = true;

        if (this.clockForm.get('includeLocation')?.value) {
            this.updateLocation();
        }

        this.attendanceService.clockOutForCurrentUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.isClockedIn = false;
                    this.clockInTime = null;
                    this.sessionDuration = '00:00:00';
                    this.clockForm.patchValue({ notes: '' });
                    this.showNotesField = false;
                    this.loadTodayEvents();
                    this.loadTodaySummary();
                    this.loadWeeklySummary();
                    abp.message.success('Successfully clocked out!', 'Clock Out');
                },
                error: (error) => {
                    console.error('Clock out error:', error);
                    if (error.includes('already clocked out') || error.includes('not clocked in')) {
                        abp.message.warn(
                            'You have already clocked out today or are not currently clocked in.',
                            'Already Clocked Out'
                        );
                    } else {
                        abp.message.error('Failed to clock out. Please try again.', 'Clock Out Failed');
                    }
                    this.loadTodayEvents(); // Refresh to get current state
                },
                complete: () => (this.isLoading = false)
            });
    }

    canClockIn(): boolean {
        return !this.isClockedIn && 
               !this.isLoading &&
               !this.hasAlreadyClockedInToday() &&
               this.permissionChecker.isGranted(this.permissions.AttendanceClockInOut);
    }

    canClockOut(): boolean {
        return this.isClockedIn && 
               !this.isLoading &&
               !this.hasAlreadyClockedOutToday() &&
               this.permissionChecker.isGranted(this.permissions.AttendanceClockInOut);
    }

    /**
     * Check if employee has already clocked in today
     * This prevents multiple clock-ins on the same day
     */
    hasAlreadyClockedInToday(): boolean {
        if (!this.todayEvents || this.todayEvents.length === 0) {
            return false;
        }

        // Check if there's any clock-in event today
        const clockInEvents = this.todayEvents.filter(event => 
            event.eventType === AttendanceEventType.CLOCK_IN
        );

        return clockInEvents.length > 0;
    }

    /**
     * Check if employee has already clocked out today
     * This prevents multiple clock-outs on the same day
     */
    hasAlreadyClockedOutToday(): boolean {
        if (!this.todayEvents || this.todayEvents.length === 0) {
            return false;
        }

        // Check if there's any clock-out event today
        const clockOutEvents = this.todayEvents.filter(event => 
            event.eventType === AttendanceEventType.CLOCK_OUT
        );

        return clockOutEvents.length > 0;
    }

    /**
     * Get the status message for display
     */
    getClockStatusMessage(): string {
        if (this.hasAlreadyClockedInToday() && this.hasAlreadyClockedOutToday()) {
            return 'You have completed your attendance for today. See you tomorrow!';
        } else if (this.hasAlreadyClockedInToday() && !this.hasAlreadyClockedOutToday()) {
            return 'You are currently clocked in. Don\'t forget to clock out when you leave.';
        } else if (!this.hasAlreadyClockedInToday()) {
            return 'Ready to start your day? Clock in when you arrive at work.';
        }
        return '';
    }

    toggleNotesField(): void {
        this.showNotesField = !this.showNotesField;
        if (!this.showNotesField) {
            this.clockForm.patchValue({ notes: '' });
        }
    }

    formatTime(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    /**
     * Format time string from HH:MM to 12-hour format
     */
    private formatTimeString(timeString: string): string {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    formatDate(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    getEventIcon(eventType: string): string {
        switch (eventType) {
            case AttendanceEventType.CLOCK_IN: return 'fa-sign-in-alt';
            case AttendanceEventType.CLOCK_OUT: return 'fa-sign-out-alt';
            default: return 'fa-clock';
        }
    }

    getEventColor(eventType: string): string {
        switch (eventType) {
            case AttendanceEventType.CLOCK_IN: return 'success';
            case AttendanceEventType.CLOCK_OUT: return 'danger';
            default: return 'info';
        }
    }

    getScheduleStatusClass(): string {
        if (!this.todaySchedule) return 'text-muted';
        switch (this.todaySchedule.scheduleType) {
            case 'shift': return this.isClockedIn ? 'text-success' : 'text-warning';
            case 'leave': return 'text-info';
            default: return 'text-muted';
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

    /**
     * Get button text based on current state
     */
    getClockInButtonText(): string {
        if (this.hasAlreadyClockedInToday()) {
            return 'Already Clocked In Today';
        }
        return 'Clock In';
    }

    getClockOutButtonText(): string {
        if (this.hasAlreadyClockedOutToday()) {
            return 'Already Clocked Out Today';
        }
        return 'Clock Out';
    }

    // ==================== OFFICE TIMING METHODS ====================

    /**
     * Check if current time is within office hours
     */
    isWithinOfficeHours(): boolean {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        const startTimeInMinutes = this.officeConfig.startTime.hour * 60 + this.officeConfig.startTime.minute;
        const endTimeInMinutes = this.officeConfig.endTime.hour * 60 + this.officeConfig.endTime.minute;
        
        return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
    }

    /**
     * Check office timings and update validation flags
     */
    private checkOfficeTimings(): void {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        const graceStartInMinutes = this.officeConfig.graceStartTime.hour * 60 + this.officeConfig.graceStartTime.minute;
        const graceEndInMinutes = this.officeConfig.graceEndTime.hour * 60 + this.officeConfig.graceEndTime.minute;
        const startTimeInMinutes = this.officeConfig.startTime.hour * 60 + this.officeConfig.startTime.minute;
        
        // Check if within grace period for clock-in
        this.isWithinGracePeriod = currentTimeInMinutes >= graceStartInMinutes && currentTimeInMinutes <= graceEndInMinutes;
        
        // Check if it's a late clock-in (after official start time but within grace period)
        this.isLateClockIn = currentTimeInMinutes > startTimeInMinutes && this.isWithinGracePeriod;
        
        // Show HR warning if outside grace period
        this.shouldShowHRWarning = !this.isWithinGracePeriod && !this.hasAlreadyClockedInToday();
    }

    /**
     * Setup auto clock-out timer
     */
    private setupAutoClockOut(): void {
        if (!this.isClockedIn || this.hasAlreadyClockedOutToday()) {
            return;
        }

        const now = new Date();
        const autoClockOutTime = new Date();
        autoClockOutTime.setHours(this.officeConfig.autoClockOutTime.hour, this.officeConfig.autoClockOutTime.minute, 0, 0);
        
        // If auto clock-out time has passed today, set it for tomorrow
        if (autoClockOutTime <= now) {
            autoClockOutTime.setDate(autoClockOutTime.getDate() + 1);
        }
        
        const timeUntilAutoClockOut = autoClockOutTime.getTime() - now.getTime();
        
        if (this.autoClockOutTimer) {
            clearTimeout(this.autoClockOutTimer);
        }
        
        this.autoClockOutTimer = setTimeout(() => {
            this.performAutoClockOut();
        }, timeUntilAutoClockOut);
    }

    /**
     * Update countdown timer for auto clock-out
     */
    private updateAutoClockOutTimer(): void {
        if (!this.isClockedIn || this.hasAlreadyClockedOutToday()) {
            this.timeUntilAutoClockOut = '';
            return;
        }

        const now = new Date();
        const autoClockOutTime = new Date();
        autoClockOutTime.setHours(this.officeConfig.autoClockOutTime.hour, this.officeConfig.autoClockOutTime.minute, 0, 0);
        
        if (autoClockOutTime <= now) {
            this.timeUntilAutoClockOut = 'Auto clock-out time passed';
            return;
        }
        
        const diff = autoClockOutTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        this.timeUntilAutoClockOut = `${hours}h ${minutes}m until auto clock-out`;
    }

    /**
     * Perform automatic clock-out
     */
    private performAutoClockOut(): void {
        if (!this.isClockedIn || this.hasAlreadyClockedOutToday()) {
            return;
        }

        this.attendanceService.clockOutForCurrentUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.isClockedIn = false;
                    this.clockInTime = null;
                    this.sessionDuration = '00:00:00';
                    this.loadTodayEvents();
                    this.loadTodaySummary();
                    this.loadWeeklySummary();
                    
                    abp.message.info(
                        `You have been automatically clocked out at ${this.formatOfficeTime(this.officeConfig.autoClockOutTime)} as per company policy.`,
                        'Auto Clock-Out'
                    );
                },
                error: (error) => {
                    console.error('Auto clock-out error:', error);
                }
            });
    }

    /**
     * Format time object to readable string
     */
    formatOfficeTime(timeObj: { hour: number; minute: number }): string {
        const hour12 = timeObj.hour > 12 ? timeObj.hour - 12 : timeObj.hour === 0 ? 12 : timeObj.hour;
        const ampm = timeObj.hour >= 12 ? 'PM' : 'AM';
        const minute = timeObj.minute.toString().padStart(2, '0');
        return `${hour12}:${minute} ${ampm}`;
    }

    /**
     * Get office timing status message
     */
    getOfficeTimingMessage(): string {
        if (this.shouldShowHRWarning) {
            return `Clock-in allowed between ${this.formatOfficeTime(this.officeConfig.graceStartTime)} - ${this.formatOfficeTime(this.officeConfig.graceEndTime)}. Contact HR for assistance.`;
        }
        
        if (this.isLateClockIn && !this.hasAlreadyClockedInToday()) {
            return `You are late! Official time: ${this.formatOfficeTime(this.officeConfig.startTime)}. Please contact ${this.officeConfig.hrContact}`;
        }
        
        if (this.isClockedIn && this.timeUntilAutoClockOut) {
            return this.timeUntilAutoClockOut;
        }
        
        return `Office Hours: ${this.formatOfficeTime(this.officeConfig.startTime)} - ${this.formatOfficeTime(this.officeConfig.endTime)}`;
    }

    /**
     * Get timing status class for styling
     */
    getTimingStatusClass(): string {
        if (this.shouldShowHRWarning) return 'alert-danger';
        if (this.isLateClockIn && !this.hasAlreadyClockedInToday()) return 'alert-warning';
        if (this.isClockedIn) return 'alert-info';
        return 'alert-secondary';
    }

    /**
     * Contact HR method
     */
    contactHR(): void {
        abp.message.info(
            `Please contact HR for assistance with your attendance:\n\n${this.officeConfig.hrContact}\n\nOffice Hours: ${this.formatOfficeTime(this.officeConfig.graceStartTime)} - ${this.formatOfficeTime(this.officeConfig.graceEndTime)}`,
            'HR Contact Information'
        );
    }
}
