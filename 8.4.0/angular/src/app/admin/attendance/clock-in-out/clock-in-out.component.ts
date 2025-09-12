import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PermissionCheckerService } from 'abp-ng2-module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-clock-in-out',
    templateUrl: './clock-in-out.component.html'
})
export class ClockInOutComponent implements OnInit, OnDestroy {
    currentTime = new Date();
    private clockInterval: any;
    private sessionInterval: any;

    // Clock In/Out
    isClockedIn = false;
    isOnBreak = false;
    isLoading = false;
    clockInTime: Date | null = null;
    sessionDuration = '0h 0m';
    workNotes: string = '';

    // Attendance & Schedule
    todaySessions: any[] = [];
    todaySchedule: any = null;
    weeklySummary: any = { hoursWorked: 0, overtime: 0, target: 40 };
    todaySummary: any = { totalHours: 0, overtime: 0, breakTime: 0, status: 'Active' };

    // Leave Balances
    //leaveBalances: any = { vacation: 0, sick: 0 };

    // Leave Request Form
    leaveRequestForm: FormGroup;

    // Location
    locationEnabled = false;

    // APIs
    private baseUrl = 'https://localhost:44311/api/services/app';
    private attendanceUrl = `${this.baseUrl}/Attendance`;
    private reportUrl = `${this.baseUrl}/Report`;
    private leaveUrl = `${this.baseUrl}/Leave`;

    // Employee (normally from token/session)
    employeeId = 1;

    constructor(
        private http: HttpClient,
        private fb: FormBuilder,
        public permission: PermissionCheckerService
    ) {
        
    }

    ngOnInit() {
        // Live clock
        this.clockInterval = setInterval(() => {
            this.currentTime = new Date();
        }, 1000);

        this.loadTodaySessions();
        this.loadTodaySchedule();
        this.loadTodaySummary();
        this.loadWeeklySummary();
        this.checkLocationAccess();
    }

    ngOnDestroy() {
        if (this.clockInterval) clearInterval(this.clockInterval);
        if (this.sessionInterval) clearInterval(this.sessionInterval);
    }

    /** -------------------
     * 🕒 Clock In / Out
     -------------------- */
    clockIn() {
        this.isLoading = true;
        navigator.geolocation.getCurrentPosition((pos) => {
            const payload = {
                employeeId: this.employeeId,
                notes: this.workNotes,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            };

            this.http.post(`${this.baseUrl}/ClockInAsync`, payload).subscribe({
                next: () => {
                    this.isClockedIn = true;
                    this.clockInTime = new Date();
                    this.startSessionTimer();
                    this.loadTodaySessions();
                    abp.message.success("Clocked in successfully with location");
                },
                error: (err) => {
                    console.error("Clock In failed:", err);
                    this.isClockedIn = false;
                },
                complete: () => (this.isLoading = false)
            });
        });
    }

    clockOut() {
        this.isLoading = true;
        this.http.post(`${this.attendanceUrl}/ClockOut?employeeId=${this.employeeId}`, { notes: this.workNotes }).subscribe({
            next: () => {
                this.isClockedIn = false;
                this.stopSessionTimer();
                this.clockInTime = null;
                this.sessionDuration = '0h 0m';
                this.loadTodaySessions();
                abp.message.success('Clocked out successfully');
            },
            error: (err) => {
                console.error('Clock Out failed:', err);
                abp.message.error('Failed to clock out');
            },
            complete: () => (this.isLoading = false)
        });
    }

    //startBreak() {
    //    this.isLoading = true;
    //    this.http.post(`${this.attendanceUrl}/StartBreak?employeeId=${this.employeeId}`, {}).subscribe({
    //        next: () => {
    //            this.isOnBreak = true;
    //            this.loadTodaySessions();
    //            abp.message.info('Break started');
    //        },
    //        error: (err) => {
    //            console.error('Start Break failed:', err);
    //            abp.message.error('Failed to start break');
    //        },
    //        complete: () => (this.isLoading = false)
    //    });
    //}

    //endBreak() {
    //    this.isLoading = true;
    //    this.http.post(`${this.attendanceUrl}/EndBreak?employeeId=${this.employeeId}`, {}).subscribe({
    //        next: () => {
    //            this.isOnBreak = false;
    //            this.loadTodaySessions();
    //            abp.message.info('Break ended');
    //        },
    //        error: (err) => {
    //            console.error('End Break failed:', err);
    //            abp.message.error('Failed to end break');
    //        },
    //        complete: () => (this.isLoading = false)
    //    });
    //}

    /** -------------------
     * 📊 Load Data
     -------------------- */
    loadTodaySessions() {
        this.http.get<any>(`${this.attendanceUrl}/GetTodayAttendance?employeeId=${this.employeeId}`).subscribe({
            next: (res) => {
                this.todaySessions = res.result || [];
                if (this.todaySessions.length > 0) {
                    const lastEvent = this.todaySessions[this.todaySessions.length - 1];
                    this.isClockedIn = lastEvent.eventType === 'CLOCK_IN';
                    this.isOnBreak = lastEvent.eventType === 'BREAK_START';
                    if (this.isClockedIn) {
                        this.clockInTime = new Date(lastEvent.eventTime);
                        this.startSessionTimer();
                    }
                }
            },
            error: (err) => console.error('Error loading sessions:', err)
        });
    }

    loadTodaySchedule() {
        this.http.get<any>(`${this.reportUrl}/GetTodaySchedule?employeeId=${this.employeeId}`).subscribe({
            next: (res) => (this.todaySchedule = res.result),
            error: (err) => console.error('Error loading schedule:', err)
        });
    }

    loadTodaySummary() {
        this.http.get<any>(`${this.reportUrl}/GetTodaySummary?employeeId=${this.employeeId}`).subscribe({
            next: (res) => (this.todaySummary = res.result || this.todaySummary),
            error: (err) => console.error('Error loading today summary:', err)
        });
    }

    loadWeeklySummary() {
        this.http.get<any>(`${this.reportUrl}/GetWeeklySummary?employeeId=${this.employeeId}`).subscribe({
            next: (res) => (this.weeklySummary = res.result || this.weeklySummary),
            error: (err) => console.error('Error loading weekly summary:', err)
        });
    }

    //loadLeaveBalances() {
    //    this.http.get<any>(`${this.leaveUrl}/GetLeaveBalances?employeeId=${this.employeeId}`).subscribe({
    //        next: (res) => (this.leaveBalances = res.result || this.leaveBalances),
    //        error: (err) => console.error('Error loading leave balances:', err)
    //    });
    //}

    /** -------------------
     * 📍 Location
     -------------------- */
    checkLocationAccess() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => (this.locationEnabled = true),
                () => (this.locationEnabled = false)
            );
        }
    }

    /** -------------------
     * 📝 Leave Request
     -------------------- */
    //requestLeave() {
    //    const modal = document.getElementById('leaveRequestModal');
    //    if (modal) (window as any).bootstrap.Modal.getOrCreateInstance(modal).show();
    //}

    //submitLeaveRequest() {
    //    if (this.leaveRequestForm.invalid) {
    //        abp.message.warn('Please fill all required fields');
    //        return;
    //    }
    //    const payload = { ...this.leaveRequestForm.value, employeeId: this.employeeId };
    //    this.http.post(`${this.leaveUrl}/CreateLeaveRequest`, payload).subscribe({
    //        next: () => {
    //            abp.message.success('Leave request submitted');
    //            this.leaveRequestForm.reset();
    //            const modal = document.getElementById('leaveRequestModal');
    //            if (modal) (window as any).bootstrap.Modal.getOrCreateInstance(modal).hide();
    //        },
    //        error: (err) => {
    //            console.error('Leave request failed:', err);
    //            abp.message.error('Failed to submit leave request');
    //        }
    //    });
    //}

    /** -------------------
     * ⚡ Quick Actions
     -------------------- */
    viewAttendanceHistory() {
        abp.message.info('History feature coming soon...');
    }

    requestShiftSwap() {
        abp.message.info('Shift swap feature coming soon...');
    }

    /** -------------------
     * ⏱️ Helpers
     -------------------- */
    private startSessionTimer() {
        this.stopSessionTimer();
        this.updateSessionDuration();
        this.sessionInterval = setInterval(() => this.updateSessionDuration(), 60000);
    }

    private stopSessionTimer() {
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
            this.sessionInterval = null;
        }
    }

    private updateSessionDuration() {
        if (this.clockInTime) {
            const now = new Date();
            const diffMs = now.getTime() - this.clockInTime.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            this.sessionDuration = `${hours}h ${minutes}m`;
        }
    }

    getEventTypeLabel(eventType: string): string {
        switch (eventType) {
            case 'CLOCK_IN': return 'Clock In';
            case 'CLOCK_OUT': return 'Clock Out';
            case 'BREAK_START': return 'Break Start';
            case 'BREAK_END': return 'Break End';
            default: return eventType;
        }
    }s
}
