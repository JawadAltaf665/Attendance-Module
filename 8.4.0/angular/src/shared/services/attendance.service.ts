import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConsts } from '@shared/AppConsts';

export interface ClockEventDto {
    employeeId: number;
    eventType: string; // "ClockIn" or "ClockOut"
    eventTime: Date;
    notes?: string;
    latitude?: number;
    longitude?: number;
}

export interface AttendanceEventDto {
    id: number;
    employeeId: number;
    eventType: string;
    eventTime: Date;
    latitude?: number;
    longitude?: number;
    notes?: string;
    creationTime: Date;
}

export interface PagedRequestDto {
    skipCount?: number;
    maxResultCount?: number;
    sorting?: string;
}

export interface GetAttendanceInput extends PagedRequestDto {
    employeeId?: number;
    startDate?: Date;
    endDate?: Date;
}

export interface PagedResultDto<T> {
    totalCount: number;
    items: T[];
}

@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    private baseUrl: string;
    private attendanceApiUrl: string;

    constructor(
        private http: HttpClient,
        @Optional() @Inject('BASE_URL') baseUrl?: string
    ) {
        this.baseUrl = baseUrl || AppConsts.remoteServiceBaseUrl || 'https://localhost:44311';
        this.attendanceApiUrl = `${this.baseUrl}/api/services/app/Attendance`;
    }

    private getHttpOptions() {
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        };
    }

    /**
     * Clock In
     */
    clockIn(clockEvent: ClockEventDto): Observable<any> {
        const body = {
            ...clockEvent,
            eventType: 'ClockIn',
            eventTime: new Date()
        };
        
        return this.http.post(`${this.attendanceApiUrl}/ClockInAsync`, body, this.getHttpOptions())
            .pipe(map((response: any) => response.result));
    }

    /**
     * Clock Out
     */
    clockOut(clockEvent: ClockEventDto): Observable<any> {
        const body = {
            ...clockEvent,
            eventType: 'ClockOut',
            eventTime: new Date()
        };
        
        return this.http.post(`${this.attendanceApiUrl}/ClockOutAsync`, body, this.getHttpOptions())
            .pipe(map((response: any) => response.result));
    }

    /**
     * Get all attendance events
     */
    getAllAttendanceEvents(): Observable<AttendanceEventDto[]> {
        return this.http.get(`${this.attendanceApiUrl}/GetAllAttendenceEventsAsync`, this.getHttpOptions())
            .pipe(map((response: any) => response.result || []));
    }

    /**
     * Get employee attendance for a date range
     */
    getEmployeeAttendance(employeeId: number, startDate: Date, endDate: Date): Observable<AttendanceEventDto[]> {
        const params = {
            employeeId: employeeId.toString(),
            start: startDate.toISOString(),
            end: endDate.toISOString()
        };

        return this.http.get(`${this.attendanceApiUrl}/GetEmployeeAttendance`, {
            ...this.getHttpOptions(),
            params
        }).pipe(map((response: any) => response.result || []));
    }

    /**
     * Get current user's attendance history for a date range
     */
    getMyAttendanceHistory(startDate: Date, endDate: Date): Observable<AttendanceEventDto[]> {
        const params = {
            start: startDate.toISOString(),
            end: endDate.toISOString()
        };

        return this.http.get(`${this.attendanceApiUrl}/GetMyAttendanceHistory`, {
            ...this.getHttpOptions(),
            params
        }).pipe(map((response: any) => response.result || []));
    }

    /**
     * Get current user's paged attendance history
     */
    getMyPagedAttendanceHistory(input: {
        startDate?: Date;
        endDate?: Date;
        skipCount?: number;
        maxResultCount?: number;
    }): Observable<PagedResultDto<AttendanceEventDto>> {
        const params: any = {
            skipCount: input.skipCount || 0,
            maxResultCount: input.maxResultCount || 10
        };

        if (input.startDate) {
            params.startDate = input.startDate.toISOString();
        }
        if (input.endDate) {
            params.endDate = input.endDate.toISOString();
        }

        return this.http.get(`${this.attendanceApiUrl}/GetMyPagedAttendanceHistory`, {
            ...this.getHttpOptions(),
            params
        }).pipe(map((response: any) => response.result || { items: [], totalCount: 0 }));
    }

    /**
     * Get today's attendance for an employee
     */
    getTodayAttendance(employeeId: number): Observable<AttendanceEventDto[]> {
        const params = {
            employeeId: employeeId.toString()
        };

        return this.http.get(`${this.attendanceApiUrl}/GetTodayAttendanceAsync?employeeId=${employeeId}`, this.getHttpOptions())
            .pipe(map((response: any) => response.result || []));
    }

    /**
     * Get paged attendance list
     */
    getPagedAttendanceList(input: GetAttendanceInput): Observable<PagedResultDto<AttendanceEventDto>> {
        return this.http.post(`${this.attendanceApiUrl}/GetPagedAttendenceListAsync`, input, this.getHttpOptions())
            .pipe(map((response: any) => response.result || { items: [], totalCount: 0 }));
    }

    /**
     * Helper method to get current location
     */
    getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    /**
     * Helper method to check if user is currently clocked in
     */
    getCurrentStatus(employeeId: number): Observable<{ isClockedIn: boolean; lastEvent?: AttendanceEventDto }> {
        return this.getTodayAttendance(employeeId).pipe(
            map(events => {
                if (!events || events.length === 0) {
                    return { isClockedIn: false };
                }

                // Sort events by time to get the most recent
                const sortedEvents = events.sort((a, b) => 
                    new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
                );

                const lastEvent = sortedEvents[0];
                const isClockedIn = lastEvent.eventType === 'ClockIn';

                return { 
                    isClockedIn, 
                    lastEvent 
                };
            })
        );
    }

    /**
     * Calculate total hours worked for a day
     */
    calculateDailyHours(events: AttendanceEventDto[]): number {
        if (!events || events.length === 0) {
            return 0;
        }

        // Sort events by time
        const sortedEvents = events.sort((a, b) => 
            new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
        );

        let totalMinutes = 0;
        let lastClockIn: Date | null = null;

        for (const event of sortedEvents) {
            const eventTime = new Date(event.eventTime);
            const eventType = event.eventType.toUpperCase();

            if (eventType === 'CLOCK_IN' || eventType === 'CLOCKIN') {
                lastClockIn = eventTime;
            } else if ((eventType === 'CLOCK_OUT' || eventType === 'CLOCKOUT') && lastClockIn) {
                const diffInMs = eventTime.getTime() - lastClockIn.getTime();
                const diffInMinutes = diffInMs / (1000 * 60);
                totalMinutes += diffInMinutes;
                lastClockIn = null;
            }
        }

        // If still clocked in, calculate time until now
        if (lastClockIn) {
            const now = new Date();
            const diffInMs = now.getTime() - lastClockIn.getTime();
            const diffInMinutes = diffInMs / (1000 * 60);
            totalMinutes += diffInMinutes;
        }

        return totalMinutes / 60; // Convert to hours
    }

    /**
     * Format duration in hours and minutes
     */
    formatDuration(hours: number): string {
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        return `${wholeHours}h ${minutes}m`;
    }

    /**
     * Export attendance data to CSV
     */
    exportToCSV(data: AttendanceEventDto[], filename: string = 'attendance-export.csv'): void {
        if (!data || data.length === 0) {
            return;
        }

        const csvHeaders = ['Date', 'Employee ID', 'Event Type', 'Time', 'Notes', 'Location'];
        const csvData = data.map(event => [
            new Date(event.eventTime).toLocaleDateString(),
            event.employeeId.toString(),
            event.eventType,
            new Date(event.eventTime).toLocaleTimeString(),
            event.notes || '',
            event.latitude && event.longitude ? `${event.latitude}, ${event.longitude}` : ''
        ]);

        const csvContent = [csvHeaders, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}