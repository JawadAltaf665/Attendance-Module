import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, interval, fromEvent } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { AppSessionService } from '@shared/session/app-session.service';
import { AttendanceApiService } from '../../services/attendance-api.service';
import { ClockEventDto, AttendanceEvent } from '../../models/index';

interface PendingClockEvent {
    id: string;
    data: ClockEventDto;
    timestamp: Date;
    retryCount: number;
}

@Component({
    selector: 'app-attendance-clock',
    templateUrl: './attendance-clock.component.html'
})
export class AttendanceClockComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // UI State
    isClockedIn = false;
    isLoading = false;
    showSelfieModal = false;
    showConfirmationModal = false;

    // Employee Info
    employeeId: number = 0;
    employeeName: string;
    timezone: string;
    employeeRecord: any = null;

    // Last Punch Info
    lastPunchTime: Date | null = null;
    lastPunchType: 'CLOCK_IN' | 'CLOCK_OUT' | null = null;

    // Current Time
    currentTime = new Date();

    // Location
    currentLocation: { latitude?: number; longitude?: number } = {};
    locationPermissionGranted = false;

    // Photo
    capturedPhotoUrl: string | null = null;

    // Grace Period Message
    graceMessage: string | null = null;
    isLate = false;

    // Retry Queue
    pendingEvents: PendingClockEvent[] = [];
    showRetryButton = false;

    // Form
    clockForm: FormGroup;

    // Policy Settings (from backend or config)
    selfieRequired = false;
    locationRequired = false;
    gracePeriodMinutes = 15;

    // Device ID
    deviceId: string;

    constructor(
        private fb: FormBuilder,
        private attendanceService: AttendanceApiService,
        private appSession: AppSessionService
    ) {
        this.employeeName = this.appSession.user?.name || 'Employee';
        this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        this.deviceId = this.generateDeviceId();

        this.clockForm = this.fb.group({
            notes: ['']
        });
    }

    ngOnInit(): void {
        this.initializeClock();
        this.loadCurrentEmployee();
        this.checkLocationPermission();
        this.loadPendingEvents();
        this.setupNetworkListener();
        this.checkGracePeriod();
    }

    private loadCurrentEmployee(): void {
        this.attendanceService.getCurrentUserEmployee()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (employee) => {
                    this.employeeRecord = employee;
                    this.employeeId = employee.id || 0;
                    this.employeeName = `${employee.firstName} ${employee.lastName}`.trim() || this.employeeName;

                    // Now load attendance status after we have the employee ID
                    this.loadLastPunchStatus();
                },
                error: (error) => {
                    console.error('Failed to load employee record:', error);
                    this.showToast('Failed to load employee information. Please refresh the page.', 'error');
                }
            });
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

    private loadLastPunchStatus(): void {
        if (!this.employeeId || this.employeeId === 0) {
            console.warn('Employee ID not available yet');
            return;
        }

        // Get today's attendance to determine current status
        this.attendanceService.getTodayAttendance(this.employeeId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (events) => {
                    if (events && events.length > 0) {
                        const lastEvent = events[events.length - 1];
                        this.lastPunchTime = new Date(lastEvent.eventTime);
                        this.lastPunchType = lastEvent.eventType as 'CLOCK_IN' | 'CLOCK_OUT';
                        this.isClockedIn = this.lastPunchType === 'CLOCK_IN';
                    } else {
                        this.isClockedIn = false;
                        this.lastPunchTime = null;
                        this.lastPunchType = null;
                    }
                },
                error: (error) => {
                    console.error('Failed to load attendance status:', error);
                    this.showToast('Failed to load attendance status', 'error');
                }
            });
    }

    private checkLocationPermission(): void {
        if ('geolocation' in navigator) {
            navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(result => {
                this.locationPermissionGranted = result.state === 'granted';
                if (this.locationPermissionGranted) {
                    this.getCurrentLocation();
                }
            });
        }
    }

    private getCurrentLocation(): void {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                },
                (error) => {
                    console.warn('Location error:', error);
                    if (this.locationRequired) {
                        this.showToast('Location is required for clock in/out', 'warning');
                    }
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }

    private checkGracePeriod(): void {
        // This would typically fetch from backend API
        // For now, we'll check if current time is past expected start time
        const now = new Date();
        const expectedStartTime = new Date();
        expectedStartTime.setHours(9, 0, 0, 0); // 9:00 AM

        const diffMinutes = Math.floor((now.getTime() - expectedStartTime.getTime()) / 60000);

        if (diffMinutes > 0 && diffMinutes <= this.gracePeriodMinutes && !this.isClockedIn) {
            this.isLate = true;
            this.graceMessage = `You are ${diffMinutes} minutes late. Grace period: ${this.gracePeriodMinutes} minutes.`;
        } else if (diffMinutes > this.gracePeriodMinutes && !this.isClockedIn) {
            this.isLate = true;
            this.graceMessage = `You are ${diffMinutes} minutes late. Grace period exceeded!`;
        }
    }

    onClockButtonClick(): void {
        // Debounce to prevent double-clicks
        if (this.isLoading) {
            return;
        }

        // Check if selfie is required
        if (this.selfieRequired && !this.capturedPhotoUrl) {
            this.showSelfieModal = true;
            return;
        }

        // Check if location is required
        if (this.locationRequired && !this.currentLocation.latitude) {
            this.requestLocationPermission();
            return;
        }

        // Show confirmation modal
        this.showConfirmationModal = true;
    }

    confirmClockAction(): void {
        this.showConfirmationModal = false;

        if (this.isClockedIn) {
            this.performClockOut();
        } else {
            this.performClockIn();
        }
    }

    private performClockIn(): void {
        this.isLoading = true;

        const clockEvent: ClockEventDto = {
            employeeId: this.employeeId,
            eventType: 'CLOCK_IN',
            eventTime: new Date(),
            notes: this.clockForm.get('notes')?.value || undefined,
            latitude: this.currentLocation.latitude,
            longitude: this.currentLocation.longitude,
            source: 'Web',
            deviceId: this.deviceId
        };

        // Add photoUrl if captured
        if (this.capturedPhotoUrl) {
            (clockEvent as any).photoUrl = this.capturedPhotoUrl;
        }

        // Add timezone
        (clockEvent as any).timezone = this.timezone;

        this.attendanceService.clockIn(clockEvent)
            .pipe(
                takeUntil(this.destroy$),
                debounceTime(300)
            )
            .subscribe({
                next: (response) => {
                    this.handleClockSuccess(response, 'CLOCK_IN');
                },
                error: (error) => {
                    this.handleClockError(error, clockEvent);
                }
            });
    }

    private performClockOut(): void {
        this.isLoading = true;

        const clockEvent: ClockEventDto = {
            employeeId: this.employeeId,
            eventType: 'CLOCK_OUT',
            eventTime: new Date(),
            notes: this.clockForm.get('notes')?.value || undefined,
            latitude: this.currentLocation.latitude,
            longitude: this.currentLocation.longitude,
            source: 'Web',
            deviceId: this.deviceId
        };

        // Add photoUrl if captured
        if (this.capturedPhotoUrl) {
            (clockEvent as any).photoUrl = this.capturedPhotoUrl;
        }

        // Add timezone
        (clockEvent as any).timezone = this.timezone;

        this.attendanceService.clockOut(clockEvent)
            .pipe(
                takeUntil(this.destroy$),
                debounceTime(300)
            )
            .subscribe({
                next: (response) => {
                    this.handleClockSuccess(response, 'CLOCK_OUT');
                },
                error: (error) => {
                    this.handleClockError(error, clockEvent);
                }
            });
    }

    private handleClockSuccess(response: any, eventType: 'CLOCK_IN' | 'CLOCK_OUT'): void {
        this.isLoading = false;
        this.isClockedIn = eventType === 'CLOCK_IN';
        this.lastPunchTime = new Date();
        this.lastPunchType = eventType;

        // Clear form and photo
        this.clockForm.reset();
        this.capturedPhotoUrl = null;

        // Clear grace message if clocking in
        if (eventType === 'CLOCK_IN') {
            this.graceMessage = null;
            this.isLate = false;
        }

        // Show success message
        const message = eventType === 'CLOCK_IN'
            ? `Successfully clocked in at ${this.formatTime(new Date())}`
            : `Successfully clocked out at ${this.formatTime(new Date())}`;
        this.showToast(message, 'success');

        // Remove any pending events for this type
        this.removePendingEvent(eventType);
    }

    private handleClockError(error: any, clockEvent: ClockEventDto): void {
        this.isLoading = false;

        // Check if it's a network error
        if (!navigator.onLine || error.status === 0) {
            this.savePendingEvent(clockEvent);
            this.showToast('No network connection. Event saved for retry.', 'warning');
            this.showRetryButton = true;
        } else {
            this.showToast(`Failed to ${clockEvent.eventType === 'CLOCK_IN' ? 'clock in' : 'clock out'}. Please try again.`, 'error');
        }
    }

    private savePendingEvent(event: ClockEventDto): void {
        const pendingEvent: PendingClockEvent = {
            id: this.generateEventId(),
            data: event,
            timestamp: new Date(),
            retryCount: 0
        };

        this.pendingEvents.push(pendingEvent);

        // Save to IndexedDB
        this.saveToIndexedDB(pendingEvent);
    }

    private saveToIndexedDB(event: PendingClockEvent): void {
        if ('indexedDB' in window) {
            const request = indexedDB.open('AttendanceDB', 1);

            request.onsuccess = (e: any) => {
                const db = e.target.result;
                const transaction = db.transaction(['pendingEvents'], 'readwrite');
                const store = transaction.objectStore('pendingEvents');
                store.add(event);
            };

            request.onupgradeneeded = (e: any) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pendingEvents')) {
                    db.createObjectStore('pendingEvents', { keyPath: 'id' });
                }
            };
        } else {
            // Fallback to localStorage
            const pending = JSON.parse(localStorage.getItem('pendingClockEvents') || '[]');
            pending.push(event);
            localStorage.setItem('pendingClockEvents', JSON.stringify(pending));
        }
    }

    private loadPendingEvents(): void {
        if ('indexedDB' in window) {
            const request = indexedDB.open('AttendanceDB', 1);

            request.onsuccess = (e: any) => {
                const db = e.target.result;
                if (db.objectStoreNames.contains('pendingEvents')) {
                    const transaction = db.transaction(['pendingEvents'], 'readonly');
                    const store = transaction.objectStore('pendingEvents');
                    const getAllRequest = store.getAll();

                    getAllRequest.onsuccess = () => {
                        this.pendingEvents = getAllRequest.result || [];
                        this.showRetryButton = this.pendingEvents.length > 0;
                    };
                }
            };
        } else {
            // Fallback to localStorage
            const pending = JSON.parse(localStorage.getItem('pendingClockEvents') || '[]');
            this.pendingEvents = pending;
            this.showRetryButton = this.pendingEvents.length > 0;
        }
    }

    retryPendingEvents(): void {
        if (this.pendingEvents.length === 0) {
            return;
        }

        this.isLoading = true;
        const event = this.pendingEvents[0];

        const apiCall = event.data.eventType === 'CLOCK_IN'
            ? this.attendanceService.clockIn(event.data)
            : this.attendanceService.clockOut(event.data);

        apiCall.subscribe({
            next: (response) => {
                this.removePendingEvent(event.data.eventType!);
                this.showToast(`Successfully submitted pending ${event.data.eventType}`, 'success');

                // Try next pending event
                if (this.pendingEvents.length > 0) {
                    setTimeout(() => this.retryPendingEvents(), 1000);
                } else {
                    this.isLoading = false;
                    this.showRetryButton = false;
                }
            },
            error: (error) => {
                event.retryCount++;
                if (event.retryCount >= 3) {
                    this.pendingEvents.shift();
                    this.showToast(`Failed to submit pending event after 3 retries`, 'error');
                }
                this.isLoading = false;
            }
        });
    }

    private removePendingEvent(eventType: string): void {
        this.pendingEvents = this.pendingEvents.filter(e => e.data.eventType !== eventType);

        // Update IndexedDB
        if ('indexedDB' in window) {
            const request = indexedDB.open('AttendanceDB', 1);
            request.onsuccess = (e: any) => {
                const db = e.target.result;
                if (db.objectStoreNames.contains('pendingEvents')) {
                    const transaction = db.transaction(['pendingEvents'], 'readwrite');
                    const store = transaction.objectStore('pendingEvents');
                    const getAllRequest = store.getAll();

                    getAllRequest.onsuccess = () => {
                        const events = getAllRequest.result || [];
                        events.forEach((event: PendingClockEvent) => {
                            if (event.data.eventType === eventType) {
                                store.delete(event.id);
                            }
                        });
                    };
                }
            };
        } else {
            // Update localStorage
            localStorage.setItem('pendingClockEvents', JSON.stringify(this.pendingEvents));
        }
    }

    private setupNetworkListener(): void {
        fromEvent(window, 'online')
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                if (this.pendingEvents.length > 0) {
                    this.showToast('Network connection restored. Retrying pending events...', 'info');
                    this.retryPendingEvents();
                }
            });
    }

    requestLocationPermission(): void {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    this.locationPermissionGranted = true;
                    this.showToast('Location access granted', 'success');
                },
                (error) => {
                    this.showToast('Location access denied. Some features may be limited.', 'warning');
                }
            );
        }
    }

    onSelfieCapture(photoDataUrl: string): void {
        this.capturedPhotoUrl = photoDataUrl;
        this.showSelfieModal = false;
        // Proceed with clock action
        this.showConfirmationModal = true;
    }

    cancelSelfie(): void {
        this.showSelfieModal = false;
        this.capturedPhotoUrl = null;
    }

    private generateDeviceId(): string {
        const stored = localStorage.getItem('deviceId');
        if (stored) {
            return stored;
        }
        const newId = `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('deviceId', newId);
        return newId;
    }

    private generateEventId(): string {
        return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    formatDateTime(date: Date | null): string {
        if (!date) return '';
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    private showToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
        // Using ABP's notification service if available
        if ((window as any).abp && (window as any).abp.notify) {
            const notify = (window as any).abp.notify;
            switch (type) {
                case 'success':
                    notify.success(message);
                    break;
                case 'error':
                    notify.error(message);
                    break;
                case 'warning':
                    notify.warn(message);
                    break;
                case 'info':
                    notify.info(message);
                    break;
            }
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    getButtonText(): string {
        if (this.isLoading) {
            return 'Processing...';
        }
        return this.isClockedIn ? 'Clock Out' : 'Clock In';
    }

    getButtonClass(): string {
        return this.isClockedIn ? 'btn-clock-out' : 'btn-clock-in';
    }

    getStatusText(): string {
        if (this.isClockedIn) {
            return 'Currently Clocked In';
        } else if (this.lastPunchTime) {
            return 'Currently Clocked Out';
        } else {
            return 'Not Clocked In Today';
        }
    }

    getStatusClass(): string {
        return this.isClockedIn ? 'status-clocked-in' : 'status-clocked-out';
    }
}