import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-clock-in-out',
    templateUrl: './clock-in-out.component.html'
})
export class ClockInOutComponent implements OnInit, OnDestroy {
    currentTime = new Date();
    isClockedIn = false;
    isLoading = false;
    lastPunch: string | null = null;
    workNotes: string = '';

    clockInTime: Date | null = null;
    sessionDuration: string = '0h 0m';

    private clockInterval: any;
    private sessionInterval: any;

    employeeId = 1;
    private baseUrl = 'https://localhost:44311/api/services/app/Attendance';
    private reportUrl = 'https://localhost:44311/api/services/app/Report';

    todaySessions: any[] = [];
    todaySchedule: any = null;
    weeklySummary: any = { hoursWorked: 0, overtime: 0, target: 40 };
    todaySummary: any = {totolHours: 0, overtime: 0};

    constructor(private http: HttpClient) { }

    ngOnInit() {
        // Live clock update
        this.clockInterval = setInterval(() => {
            this.currentTime = new Date();
        }, 1000);

        this.loadTodayAttendance();
        this.loadTodaySchedule();
        this.loadTodaySummary();
        this.loadWeeklySummary();
    }

    ngOnDestroy() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }
    }

    clockIn() {
        this.isLoading = true;

        const now = new Date();
        const workStart = new Date();
        workStart.setHours(12, 0, 0, 0); // 12:00 PM

        // Late Clock In check (warning only)
        if (now > workStart) {
            abp.message.warn("⚠ You are late! Scheduled start was 12:00 PM.");
        }

        this.isClockedIn = true;
        this.clockInTime = now;
        this.startSessionTimer();

        this.http.post<void>(`${this.baseUrl}/ClockIn?employeeId=${this.employeeId}`, {})
            .subscribe({
                next: () => {
                    this.loadTodayAttendance();
                },
                error: (err) => {
                    console.error('Clock In failed:', err);
                    this.isClockedIn = false;
                    this.clockInTime = null;
                    this.stopSessionTimer();
                },
                complete: () => {
                    this.isLoading = false;
                }
            });
    }

    clockOut() {
        this.isLoading = true;

        const now = new Date();
        const workEnd = new Date();
        workEnd.setHours(21, 0, 0, 0); // 9:00 PM

        if (now < workEnd) {
            abp.message.warn("⚠ You are clocking out early! Scheduled end is 9:00 PM.");
        }

        this.isClockedIn = false;
        this.stopSessionTimer();

        this.http.post<void>(`${this.baseUrl}/ClockOut?employeeId=${this.employeeId}`, {})
            .subscribe({
                next: () => {
                    this.clockInTime = null;
                    this.sessionDuration = '0h 0m';
                    this.loadTodayAttendance();
                },
                error: (err) => {
                    console.error('Clock Out failed:', err);
                    this.isClockedIn = true;
                    this.startSessionTimer();
                },
                complete: () => {
                    this.isLoading = false;
                }
            });
    }


    getWorkedHours(): number {
        if (!this.clockInTime) return 0;
        const now = new Date();
        const clockIn = new Date(this.clockInTime);
        const diffMs = now.getTime() - clockIn.getTime();
        return diffMs / (1000 * 60 * 60); 
    }


    loadTodayAttendance() {
        this.http.get<any[]>(`${this.baseUrl}/GetTodayAttendance?employeeId=${this.employeeId}`)
            .subscribe({
                next: (res: any) => {
                    this.todaySessions = res.result || [];

                    if (this.todaySessions.length > 0) {
                        const lastEvent = this.todaySessions[this.todaySessions.length - 1];
                        this.lastPunch = lastEvent.eventTime;
                        const wasClocked = lastEvent.eventType === 'CLOCK_IN';

                        this.isClockedIn = wasClocked;

                        if (wasClocked) {
                            this.clockInTime = new Date(lastEvent.eventTime);
                            this.startSessionTimer();
                        } else {
                            this.clockInTime = null;
                            this.sessionDuration = '0h 0m';
                            this.stopSessionTimer();
                        }
                    } else {
                        this.lastPunch = null;
                        this.isClockedIn = false;
                        this.clockInTime = null;
                        this.sessionDuration = '0h 0m';
                        this.stopSessionTimer();
                    }
                },
                error: (err) => {
                    console.error('Error loading attendance:', err);
                }
            });
    }

    loadTodaySchedule() {
        //debugger;
        this.http.get<any>(`${this.reportUrl}/GetTodaySchedule?employeeId=${this.employeeId}`)
            .subscribe({
                next: (res: any) => {
                    this.todaySchedule = res.result;
                },
                error: (err) => {
                    console.error("Error loading schedule:", err);
                }
            });
    }

    loadTodaySummary() {
        //debugger;
        this.http.get<any>(`${this.reportUrl}/GetTodaySummary?employeeId=${this.employeeId}`)
            .subscribe({
                next: (res: any) => {
                    if (res && res.result) {
                        this.todaySummary = res.result;
                        console.warn('Today Summary:', this.todaySummary);
                    }
                },
                error: (err) => {
                    console.error('Error loading today summary:', err);
                }
            });
    }

    loadWeeklySummary() {
        //debugger;
        this.http.get<any>(`${this.reportUrl}/GetWeeklySummary?employeeId=${this.employeeId}`)
            .subscribe({
                next: (res: any) => {
                    this.weeklySummary = res.result;
                },
                error: (err) => {
                    console.error("Error loading weekly summary:", err);
                }
            });
    }

    private startSessionTimer() {
        this.stopSessionTimer();

        this.updateSessionDuration();

        this.sessionInterval = setInterval(() => {
            this.updateSessionDuration();
        }, 60000); 
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
}
